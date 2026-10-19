import { prisma } from "./src/config/prisma";

async function main() {
  const activeCourses = await prisma.course.findMany({
    where: { isActive: true },
    select: {
      name: true,
      slug: true,
      isActive: true,
      archivedAt: true,
    },
  });

  console.log("Formations actives :", activeCourses.length);
  console.log(JSON.stringify(activeCourses, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
