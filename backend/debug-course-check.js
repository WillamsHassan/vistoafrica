require('dotenv').config({ path: 'C:/Users/WILLIAMS HASSAN/Documents/econews/vistoafrica/backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const docs = await prisma.course.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, slug: true, category: true, type: true, legacyId: true, isActive: true, archivedAt: true, createdAt: true }
    });
    console.log(JSON.stringify({ count: docs.length, items: docs }, null, 2));
    const nullLegacy = docs.filter((doc) => doc.legacyId === null || doc.legacyId === undefined).length;
    const duplicates = Object.entries(docs.reduce((acc, doc) => {
      const value = doc.legacyId ?? '__NULL__';
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {})).filter(([, count]) => count > 1);
    console.log(JSON.stringify({ nullLegacy, duplicateLegacyIds: duplicates }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({ ok: false, name: error && error.name, message: error && error.message }, null, 2));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
