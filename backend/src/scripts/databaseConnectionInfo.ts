export type PostgresEnvironmentVariable = 'POSTGRESQL_SOURCE_URL' | 'DATABASE_URL' | 'MISSING'

export type PostgresConnectionInfo = {
  variable: PostgresEnvironmentVariable
  host: string
  port: string
  database: string
  user: string
  valid: boolean
  errorCode?: string
  encodingWarning?: boolean
}

export const getPostgresConnectionInfo = (): { url: string; info: PostgresConnectionInfo } => {
  const explicitSourceUrl = process.env.POSTGRESQL_SOURCE_URL?.trim() ?? ''
  const fallbackUrl = process.env.DATABASE_URL?.trim() ?? ''
  const url = explicitSourceUrl || fallbackUrl
  const variable: PostgresEnvironmentVariable = explicitSourceUrl ? 'POSTGRESQL_SOURCE_URL' : fallbackUrl ? 'DATABASE_URL' : 'MISSING'
  const emptyInfo: PostgresConnectionInfo = { variable, host: 'unavailable', port: '5432', database: 'unavailable', user: 'unavailable', valid: false }

  if (!url) return { url, info: { ...emptyInfo, errorCode: 'POSTGRESQL_SOURCE_URL_OR_DATABASE_URL_MISSING' } }

  try {
    const parsed = new URL(url)
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      return { url, info: { ...emptyInfo, errorCode: 'INVALID_POSTGRESQL_URI_SCHEME' } }
    }

    const username = decodeURIComponent(parsed.username)
    const password = decodeURIComponent(parsed.password)
    const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
    const schemeEnd = url.indexOf('//') + 2
    const authorityEnd = url.slice(schemeEnd).search(/[/?#]/)
    const authority = url.slice(schemeEnd, authorityEnd < 0 ? undefined : schemeEnd + authorityEnd)
    const rawUserInfo = authority.slice(0, authority.lastIndexOf('@'))
    const rawPassword = rawUserInfo.slice(rawUserInfo.indexOf(':') + 1)
    const encodingWarning = rawUserInfo.split('@').length > 1 || /[:/@?#]/.test(rawPassword)

    if (!parsed.hostname || !username || !database) {
      return {
        url,
        info: {
          variable,
          host: parsed.hostname || 'missing',
          port: parsed.port || '5432',
          database: database || 'missing',
          user: username || 'missing',
          valid: false,
          errorCode: 'POSTGRESQL_URI_MISSING_HOST_USER_OR_DATABASE',
          encodingWarning,
        },
      }
    }

    return {
      url,
      info: {
        variable,
        host: parsed.hostname,
        port: parsed.port || '5432',
        database,
        user: username,
        valid: true,
        encodingWarning,
      },
    }
  } catch {
    return { url, info: { ...emptyInfo, errorCode: 'INVALID_POSTGRESQL_URI_OR_PERCENT_ENCODING' } }
  }
}

export const postgresErrorType = (code?: string) => {
  if (code === '28000' || code === '28P01' || code?.startsWith('28')) return 'authentication/authorization'
  if (code === '3D000') return 'database does not exist'
  if (code?.startsWith('08') || ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH'].includes(code ?? '')) return 'connection/network'
  if (code === 'INVALID_POSTGRESQL_URI_OR_PERCENT_ENCODING' || code === 'INVALID_POSTGRESQL_URI_SCHEME' || code === 'POSTGRESQL_URI_MISSING_HOST_USER_OR_DATABASE') return 'configuration/URI format'
  return 'PostgreSQL connection/query'
}

export const postgresErrorCode = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error) return String(error.code)
  if (error instanceof Error && error.message === 'INVALID_POSTGRESQL_URI_OR_PERCENT_ENCODING') return error.message
  return 'CONNECTION_OR_QUERY_ERROR'
}
