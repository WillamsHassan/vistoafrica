import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Connexion à MongoDB Atlas...");

  await prisma.$connect();

  console.log("✅ MongoDB connecté.");

  await prisma.$runCommandRaw({ ping: 1 });

  console.log("✅ MongoDB Atlas répond au ping.");

  const count = await prisma.admin.count();

  console.log(`👤 Nombre d'administrateurs : ${count}`);

  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });

  console.log("📋 Administrateurs existants :");
  console.table(admins);
}

main()
  .catch((error: unknown) => {
    console.error("❌ Erreur MongoDB :");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });