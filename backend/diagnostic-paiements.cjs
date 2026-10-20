const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const recentPayments = await prisma.payment.findMany({
    select: {
      id: true,
      status: true,
      archivedAt: true,
      registrationId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const total = await prisma.payment.count();

  const archivedAtNull = await prisma.payment.count({
    where: { archivedAt: null },
  });

  const nullOrMissing = await prisma.payment.count({
    where: {
      OR: [
        { archivedAt: null },
        { archivedAt: { isSet: false } },
      ],
    },
  });

  console.log("\n=== 20 DERNIERS PAIEMENTS ===");
  console.dir(recentPayments, { depth: null });

  console.log("\n=== STATISTIQUES ===");
  console.log("Total des paiements :", total);
  console.log("Avec archivedAt null :", archivedAtNull);
  console.log("Avec archivedAt null ou absent :", nullOrMissing);
}

main()
  .catch((error) => {
    console.error("Erreur de diagnostic :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
