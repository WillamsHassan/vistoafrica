import { app } from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'

const server = app.listen(env.port, () => {
  console.log(JSON.stringify({ event: 'server_started', port: env.port, environment: env.nodeEnv }))
})

const shutdown = async (signal: string) => {
  console.log(JSON.stringify({ event: 'shutdown_started', signal }))
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.once('SIGTERM', () => void shutdown('SIGTERM'))
process.once('SIGINT', () => void shutdown('SIGINT'))