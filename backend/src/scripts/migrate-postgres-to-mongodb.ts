import dotenv from 'dotenv'
import { Client as PgClient } from 'pg'
import { resolve } from 'node:path'

import { createMongoClient, mirrorAllPostgresTables, safeDatabaseError, sourceTypeParsers, verifyAllPostgresTables } from './postgresMongoMirror'
import { getPostgresConnectionInfo, postgresErrorCode, postgresErrorType } from './databaseConnectionInfo'

dotenv.config({ path: resolve(__dirname, '../../.env') })

const postgres = getPostgresConnectionInfo()
const mongoUri = process.env.MONGODB_URI?.trim() || ''

const main = async () => {
  if (postgres.info.variable !== 'POSTGRESQL_SOURCE_URL') {
    console.error('Migration annulée : définis POSTGRESQL_SOURCE_URL explicitement vers la base PostgreSQL locale. DATABASE_URL seul n’est pas utilisé pour éviter de reprendre par erreur l’ancienne base hébergée.')
    process.exitCode = 1
    return
  }
  if (!postgres.info.valid) {
    console.log(`POSTGRESQL CONFIGURATION - Variable détectée : ${postgres.info.variable}; Host : ${postgres.info.host}; Port : ${postgres.info.port}; Database : ${postgres.info.database}; User : ${postgres.info.user}`)
    throw new Error(postgres.info.errorCode ?? 'INVALID_POSTGRESQL_CONFIGURATION')
  }
  if (!mongoUri) throw new Error('MONGODB_URI_MISSING')

  let source = new PgClient({ connectionString: postgres.url, application_name: 'vistoafrica-postgres-migration', types: sourceTypeParsers, connectionTimeoutMillis: 12_000 })
  const target = createMongoClient(mongoUri)

  try {
    try {
      const configuredUrl = new URL(postgres.url)
      const tlsUrl = new URL(postgres.url)
      if (!tlsUrl.searchParams.has('sslmode')) tlsUrl.searchParams.set('sslmode', 'verify-full')
      const urls = [configuredUrl.toString(), ...(configuredUrl.toString() === tlsUrl.toString() ? [] : [tlsUrl.toString()])]
      let connected = false
      let connectionError: unknown

      for (const connectionString of urls) {
        source = new PgClient({ connectionString, application_name: 'vistoafrica-postgres-migration', types: sourceTypeParsers, connectionTimeoutMillis: 12_000 })
        try {
          await source.connect()
          await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
          connected = true
          break
        } catch (error) {
          connectionError = error
          await source.query('ROLLBACK').catch(() => undefined)
          await source.end().catch(() => undefined)
          const code = postgresErrorCode(error)
          if (connectionString !== urls[0] || !['ECONNRESET', '28000', '28P01'].includes(code) && !code.startsWith('08')) break
        }
      }
      if (!connected) throw connectionError ?? new Error('POSTGRESQL_CONNECTION_FAILED')
    } catch (error) {
      const errorCode = postgresErrorCode(error)
      console.error(`POSTGRESQL CONNECTION\nFAILED\nPostgreSQL error code : ${errorCode}\nPostgreSQL error type : ${postgresErrorType(errorCode)}`)
      process.exitCode = 1
      return
    }

    await target.connect()
    const database = target.db()

    const migration = await mirrorAllPostgresTables(source, database)
    const verification = await verifyAllPostgresTables(source, database)
    const countsMatch = Object.entries(migration.results).every(([table, result]) => result.sourceRows === verification.checks[table]?.matchingRows)
    const verified = verification.complete && countsMatch

    const result = {
      success: verified,
      readOnlySource: true,
      migrationMode: 'generic-postgres-table-mirror',
      tableCount: verification.tableCount,
      tables: migration.results,
      verification: verification.checks,
    }
    console.log(JSON.stringify(result, null, 2))
    await source.query('COMMIT')
    if (!verified) process.exitCode = 2
  } finally {
    await source.query('ROLLBACK').catch(() => undefined)
    await source.end().catch(() => undefined)
    await target.close().catch(() => undefined)
  }
}

void main().catch((error: unknown) => {
  console.error(JSON.stringify({ success: false, errorCode: safeDatabaseError(error), message: 'Migration interrompue. Les URI et identifiants sont masqués; PostgreSQL n’a subi aucune écriture.' }))
  process.exitCode = 1
})
