import { createHash } from 'node:crypto'
import dns from 'node:dns'
import { types as pgTypes, type Client, type QueryResultRow } from 'pg'
import { MongoClient, type Collection, type Db, type Document } from 'mongodb'

const SYSTEM_SCHEMAS = new Set(['information_schema', 'pg_catalog', 'pg_toast'])
const DATE_AND_EXACT_NUMERIC_OIDS = new Set([1082, 1083, 1114, 1184, 1266, 1182, 1183, 1115, 1185, 1270, 1700, 1231])
const MIRROR_METADATA_COLLECTION = '__vistoafrica_pg_migration_metadata'
const BATCH_SIZE = 500

type TableMetadata = {
  schema: string
  name: string
  collection: string
  kind: string
  primaryKey: string[]
  columns: Document[]
  rowCount: number
}

type Catalog = {
  tables: TableMetadata[]
  constraints: Document[]
  indexes: Document[]
  sequences: Document[]
}

type SourceRow = QueryResultRow & Record<string, unknown>

export const sourceTypeParsers = {
  getTypeParser(oid: number, format?: 'text' | 'binary') {
    if (format === 'text' && DATE_AND_EXACT_NUMERIC_OIDS.has(oid)) return (value: string) => value
    return pgTypes.getTypeParser(oid, format)
  },
}

const canonicalize = (value: unknown): unknown => {
  if (value instanceof Date) return { $date: value.toISOString() }
  if (Buffer.isBuffer(value)) return { $binary: value.toString('base64') }
  if (Array.isArray(value)) return value.map(canonicalize)
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonicalize(item)]))
  }
  return value
}

const canonicalJson = (value: unknown) => JSON.stringify(canonicalize(value))
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const quoteIdentifier = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`
const collectionFor = (schema: string, table: string) => `pgmirror_${digest(`${schema}.${table}`).slice(0, 24)}`

const readTableRows = async (source: Client, table: TableMetadata) => {
  const result = await source.query<SourceRow>(`SELECT * FROM ${quoteIdentifier(table.schema)}.${quoteIdentifier(table.name)}`)
  return result.rows
}

const stableDocuments = (table: TableMetadata, rows: SourceRow[]) => {
  const sorted = rows.map((row) => ({ row, canonicalRow: canonicalJson(row) })).sort((left, right) => left.canonicalRow.localeCompare(right.canonicalRow))
  const duplicateOrdinals = new Map<string, number>()

  return sorted.map(({ row, canonicalRow }) => {
    const rowHash = digest(canonicalRow)
    const primaryKey = Object.fromEntries(table.primaryKey.map((column) => [column, row[column]]))
    const identity = table.primaryKey.length > 0
      ? canonicalJson(table.primaryKey.map((column) => [column, row[column]]))
      : `${rowHash}:${duplicateOrdinals.get(rowHash) ?? 0}`
    if (table.primaryKey.length === 0) duplicateOrdinals.set(rowHash, (duplicateOrdinals.get(rowHash) ?? 0) + 1)

    return {
      _id: digest(`${table.schema}.${table.name}:${identity}`),
      _sourceSchema: table.schema,
      _sourceTable: table.name,
      _sourcePrimaryKey: table.primaryKey.length > 0 ? primaryKey : null,
      _sourceRowHash: rowHash,
      _sourceRow: row,
    }
  })
}

export const discoverPostgresCatalog = async (source: Client): Promise<Catalog> => {
  const [tableResult, columnResult, constraintResult, indexResult, sequenceResult] = await Promise.all([
    source.query<{ schema_name: string; table_name: string; kind: string }>(`
      SELECT n.nspname AS schema_name, c.relname AS table_name, c.relkind AS kind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r', 'p', 'f')
        AND n.nspname <> ALL($1::text[])
        AND n.nspname NOT LIKE 'pg_temp_%'
        AND n.nspname NOT LIKE 'pg_toast_temp_%'
      ORDER BY n.nspname, c.relname
    `, [[...SYSTEM_SCHEMAS]]),
    source.query<Document>(`
      SELECT n.nspname AS schema_name, c.relname AS table_name, a.attname AS column_name,
             format_type(a.atttypid, a.atttypmod) AS data_type, a.attnotnull AS not_null,
             pg_get_expr(d.adbin, d.adrelid) AS default_expression,
             a.attidentity AS identity_kind, a.attgenerated AS generated_kind,
             a.attnum AS ordinal_position
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
      WHERE a.attnum > 0 AND NOT a.attisdropped AND c.relkind IN ('r', 'p', 'f')
        AND n.nspname <> ALL($1::text[])
        AND n.nspname NOT LIKE 'pg_temp_%'
        AND n.nspname NOT LIKE 'pg_toast_temp_%'
      ORDER BY n.nspname, c.relname, a.attnum
    `, [[...SYSTEM_SCHEMAS]]),
    source.query<Document>(`
      SELECT con.oid::text AS oid, n.nspname AS schema_name, c.relname AS table_name, con.conname AS constraint_name,
             con.contype AS constraint_type, con.condeferrable AS is_deferrable,
             con.condeferred AS initially_deferred, pg_get_constraintdef(con.oid, true) AS definition
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname <> ALL($1::text[])
        AND n.nspname NOT LIKE 'pg_temp_%'
      ORDER BY n.nspname, c.relname, con.conname
    `, [[...SYSTEM_SCHEMAS]]),
    source.query<Document>(`
      SELECT schemaname AS schema_name, tablename AS table_name, indexname AS index_name, indexdef AS definition
      FROM pg_indexes
      WHERE schemaname <> ALL($1::text[])
        AND schemaname NOT LIKE 'pg_temp_%'
      ORDER BY schemaname, tablename, indexname
    `, [[...SYSTEM_SCHEMAS]]),
    source.query<Document>(`
      SELECT schemaname AS schema_name, sequencename AS sequence_name, data_type, start_value,
             min_value, max_value, increment_by, cycle, cache_size, last_value
      FROM pg_sequences
      WHERE schemaname <> ALL($1::text[])
        AND schemaname NOT LIKE 'pg_temp_%'
      ORDER BY schemaname, sequencename
    `, [[...SYSTEM_SCHEMAS]]),
  ])

  const columns = columnResult.rows
  const constraints = constraintResult.rows
  const indexes = indexResult.rows
  const sequences = sequenceResult.rows

  const tables = await Promise.all(tableResult.rows.map(async ({ schema_name: schema, table_name: name, kind }) => {
    const tableColumns = columns.filter((column) => column.schema_name === schema && column.table_name === name)
    const primaryConstraint = constraints.find((constraint) => constraint.schema_name === schema && constraint.table_name === name && constraint.constraint_type === 'p')
    const primaryKey = primaryConstraint
      ? (await source.query<{ column_name: string }>(`
          SELECT a.attname AS column_name
          FROM unnest((SELECT conkey FROM pg_constraint WHERE oid = $1::oid)) WITH ORDINALITY AS key_column(attnum, position)
          JOIN pg_attribute a ON a.attrelid = (SELECT conrelid FROM pg_constraint WHERE oid = $1::oid) AND a.attnum = key_column.attnum
          ORDER BY key_column.position
        `, [primaryConstraint.oid])).rows.map((row) => row.column_name)
      : []
    const countResult = await source.query<{ count: string }>(`SELECT count(*)::text AS count FROM ${quoteIdentifier(schema)}.${quoteIdentifier(name)}`)

    return {
      schema,
      name,
      collection: collectionFor(schema, name),
      kind,
      primaryKey,
      columns: tableColumns,
      rowCount: Number(countResult.rows[0]?.count ?? 0),
    }
  }))

  return { tables, constraints, indexes, sequences }
}

type MirrorDocument = Document & { _id: string }

const upsertBatch = async (collection: Collection<MirrorDocument>, documents: MirrorDocument[]) => {
  if (documents.length === 0) return
  await collection.bulkWrite(documents.map((document) => ({
    updateOne: {
      filter: { _id: document._id },
      update: { $set: Object.fromEntries(Object.entries(document).filter(([key]) => key !== '_id')) },
      upsert: true,
    },
  })), { ordered: true })
}

const writeCatalog = async (db: Db, catalog: Catalog) => {
  await db.collection<MirrorDocument & { catalog?: unknown }>(MIRROR_METADATA_COLLECTION).updateOne(
    { _id: 'catalog' },
    { $set: { catalog: { tables: catalog.tables, constraints: catalog.constraints, indexes: catalog.indexes, sequences: catalog.sequences } } },
    { upsert: true },
  )
}

export const mirrorAllPostgresTables = async (source: Client, db: Db) => {
  const catalog = await discoverPostgresCatalog(source)
  await writeCatalog(db, catalog)

  const results: Record<string, { sourceRows: number; upsertedOrMatched: number; collection: string }> = {}
  for (const table of catalog.tables) {
    const rows = await readTableRows(source, table)
    const documents = stableDocuments(table, rows)
    const collection = db.collection<MirrorDocument>(table.collection)
    await collection.createIndex({ _sourceRowHash: 1 })
    if (table.primaryKey.length > 0) {
      await collection.createIndex(
        Object.fromEntries(table.primaryKey.map((column) => [`_sourcePrimaryKey.${column}`, 1])),
        { unique: true, name: 'source_primary_key_unique' },
      )
    }

    let acknowledged = 0
    for (let offset = 0; offset < documents.length; offset += BATCH_SIZE) {
      const batch = documents.slice(offset, offset + BATCH_SIZE)
      await upsertBatch(collection, batch)
      acknowledged += batch.length
    }

    results[`${table.schema}.${table.name}`] = {
      sourceRows: rows.length,
      upsertedOrMatched: acknowledged,
      collection: table.collection,
    }
  }

  return { catalog, results }
}

export const verifyAllPostgresTables = async (source: Client, db: Db) => {
  const catalog = await discoverPostgresCatalog(source)
  const checks: Record<string, { sourceRows: number; matchingRows: number; mismatches: number; targetRows: number; collection: string }> = {}
  const storedCatalog = await db.collection<MirrorDocument & { catalog?: unknown }>(MIRROR_METADATA_COLLECTION).findOne({ _id: 'catalog' })
  const catalogMatches = storedCatalog?.catalog !== undefined && canonicalJson(storedCatalog.catalog) === canonicalJson({
    tables: catalog.tables,
    constraints: catalog.constraints,
    indexes: catalog.indexes,
    sequences: catalog.sequences,
  })

  for (const table of catalog.tables) {
    const rows = await readTableRows(source, table)
    const documents = stableDocuments(table, rows)
    const collection = db.collection<MirrorDocument>(table.collection)
    let matchingRows = 0
    let mismatches = 0

    for (let offset = 0; offset < documents.length; offset += BATCH_SIZE) {
      const batch = documents.slice(offset, offset + BATCH_SIZE)
      const stored = await collection.find({ _id: { $in: batch.map((document) => document._id) } }).toArray()
      const byId = new Map(stored.map((document) => [String(document._id), document]))
      for (const expected of batch) {
        const actual = byId.get(String(expected._id))
        if (!actual) {
          mismatches += 1
          continue
        }
        matchingRows += 1
        if (actual._sourceRowHash !== expected._sourceRowHash || canonicalJson(actual._sourceRow) !== canonicalJson(expected._sourceRow)) mismatches += 1
      }
    }

    checks[`${table.schema}.${table.name}`] = {
      sourceRows: rows.length,
      matchingRows,
      mismatches,
      targetRows: await collection.countDocuments(),
      collection: table.collection,
    }
  }

  const complete = catalogMatches && Object.values(checks).every((check) => check.sourceRows === check.matchingRows && check.sourceRows === check.targetRows && check.mismatches === 0)
  return { readOnly: true, complete, catalogMatches, tableCount: catalog.tables.length, checks, catalog }
}

dns.setServers(['8.8.8.8', '1.1.1.1'])

export const createMongoClient = (uri: string) => new MongoClient(uri, {
  appName: 'vistoafrica-postgres-migration',
  serverSelectionTimeoutMS: 15_000,
})

export const safeDatabaseError = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error) return String(error.code)
  if (typeof error === 'object' && error !== null && 'name' in error) return String(error.name)
  return 'CONNECTION_OR_QUERY_ERROR'
}

export const tableCollectionNames = (catalog: Catalog) => catalog.tables.map((table) => table.collection)

