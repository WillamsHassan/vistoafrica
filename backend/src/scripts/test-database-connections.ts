import dotenv from 'dotenv'
import { Client as PgClient } from 'pg'
import { resolve } from 'node:path'

import { getPostgresConnectionInfo, postgresErrorCode, postgresErrorType } from './databaseConnectionInfo'
import { createMongoClient, safeDatabaseError, sourceTypeParsers } from './postgresMongoMirror'

dotenv.config({ path: resolve(__dirname, '../../.env') })

const postgres = getPostgresConnectionInfo()
const mongoUri = process.env.MONGODB_URI?.trim() ?? ''
type ConnectionStatus = 'OK' | 'FAILED'
const results: {
  postgres: ConnectionStatus
  postgresErrorCode?: string
  postgresErrorType?: string
  mongodb: ConnectionStatus
  mongodbErrorCode?: string
} = { postgres: 'FAILED', mongodb: 'FAILED' }

const safePostgresOutput = () => {
  console.log('POSTGRESQL CONFIGURATION')
  console.log(`Variable détectée : ${postgres.info.variable}`)
  console.log(`Host : ${postgres.info.host}`)
  console.log(`Port : ${postgres.info.port}`)
  console.log(`Database : ${postgres.info.database}`)
  console.log(`User : ${postgres.info.user}`)
  if (postgres.info.encodingWarning) console.log('Avertissement : encoder en pourcentage les caractères spéciaux du mot de passe présents dans l’URI.')
}

const postgresUrlAttempts = () => {
  if (!postgres.info.valid) return []
  const attempts = [postgres.url]
  const tlsUrl = new URL(postgres.url)
  if (!tlsUrl.searchParams.has('sslmode')) {
    tlsUrl.searchParams.set('sslmode', 'verify-full')
    attempts.push(tlsUrl.toString())
  }
  return attempts
}

const testPostgres = async () => {
  safePostgresOutput()
  if (!postgres.info.valid) {
    results.postgresErrorCode = postgres.info.errorCode ?? 'INVALID_POSTGRESQL_CONFIGURATION'
    results.postgresErrorType = postgresErrorType(results.postgresErrorCode)
    return
  }

  let lastError: unknown = new Error('POSTGRESQL_CONNECTION_TIMEOUT')
  for (const connectionString of postgresUrlAttempts()) {
    const client = new PgClient({
      connectionString,
      application_name: 'vistoafrica-readonly-db-test',
      types: sourceTypeParsers,
      connectionTimeoutMillis: 10_000,
    })
    try {
      await client.connect()
      await client.query('BEGIN READ ONLY')
      await client.query('SELECT 1')
      await client.query('ROLLBACK')
      results.postgres = 'OK'
      console.log('\nPOSTGRESQL CONNECTION\nOK\nPostgreSQL : OK')
      await client.end().catch(() => undefined)
      return
    } catch (error) {
      lastError = error
      await client.query('ROLLBACK').catch(() => undefined)
      await client.end().catch(() => undefined)
      const code = postgresErrorCode(error)
      const canRetryWithTls = connectionString === postgres.url && (code === 'ECONNRESET' || code === '28000' || code === '28P01' || code.startsWith('08'))
      if (!canRetryWithTls) break
    }
  }

  results.postgresErrorCode = postgresErrorCode(lastError)
  results.postgresErrorType = postgresErrorType(results.postgresErrorCode)
  console.log(`\nPOSTGRESQL CONNECTION\nFAILED\nPostgreSQL error code : ${results.postgresErrorCode}\nPostgreSQL error type : ${results.postgresErrorType}`)
}

const testMongo = async () => {
  if (!mongoUri) {
    results.mongodbErrorCode = 'MONGODB_URI_MISSING'
    return
  }

  const client = createMongoClient(mongoUri)
  try {
    await client.connect()
    await client.db().command({ ping: 1 })
    results.mongodb = 'OK'
  } catch (error) {
    results.mongodbErrorCode = safeDatabaseError(error)
  } finally {
    await client.close().catch(() => undefined)
  }
}

const main = async () => {
  try {
    await testPostgres()
  } catch (error) {
    results.postgres = 'FAILED'
    results.postgresErrorCode = postgresErrorCode(error)
    results.postgresErrorType = postgresErrorType(results.postgresErrorCode)
  }
  await testMongo()
  console.log(`\nPostgreSQL : ${results.postgres}`)
  console.log(`MongoDB    : ${results.mongodb}`)
  if (results.mongodbErrorCode) console.log(`MongoDB error code : ${results.mongodbErrorCode}`)
  if (results.postgres !== 'OK' || results.mongodb !== 'OK') process.exitCode = 1
}

void main().catch((error: unknown) => {
  console.error(`Database diagnostic failed: ${safeDatabaseError(error)}`)
  console.log('\nPostgreSQL : FAILED\nMongoDB    : FAILED')
  process.exitCode = 1
})
