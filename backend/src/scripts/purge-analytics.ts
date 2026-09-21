import { prisma } from '../config/prisma'
import { purgeOldAnalytics } from '../services/analyticsService'

purgeOldAnalytics()
  .then(() => console.log('Purge analytics terminée.'))
  .catch((error) => { console.error('Erreur purge analytics:', error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
