import dotenv from 'dotenv'
import { Client as PgClient } from 'pg'

import { createMongoClient, safeDatabaseError, sourceTypeParsers, verifyAllPostgresTables } from './postgresMongoMirror'

dotenv.config()

const postgresUrl = process.env.POSTGRESQL_SOURCE_URL?.trim() || process.env.DATABASE_URL?.trim() || ''
const mongoUri = process.env.MONGODB_URI?.trim() || ''

const main = async () => {
  if (!postgresUrl) throw new Error('POSTGRESQL_SOURCE_URL_OR_DATABASE_URL_MISSING')
  if (!mongoUri) throw new Error('MONGODB_URI_MISSING')

  const source = new PgClient({ connectionString: postgresUrl, application_name: 'vistoafrica-readonly-migration-verification', types: sourceTypeParsers })
  const target = createMongoClient(mongoUri)

  try {
    await source.connect()
    await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await target.connect()
    const verification = await verifyAllPostgresTables(source, target.db())
    console.log(JSON.stringify({
      readOnly: verification.readOnly,
      complete: verification.complete,
      catalogMatches: verification.catalogMatches,
      tableCount: verification.tableCount,
      checks: verification.checks,
    }, null, 2))
    await source.query('COMMIT')
    if (!verification.complete) process.exitCode = 2
  } finally {
    await source.query('ROLLBACK').catch(() => undefined)
    await source.end().catch(() => undefined)
    await target.close().catch(() => undefined)
  }
}

void main().catch((error: unknown) => {
  console.error(JSON.stringify({ verified: false, readOnly: true, errorCode: safeDatabaseError(error), message: 'Vérification interrompue; les URI et identifiants sont masqués.' }))
  process.exitCode = 1
})
