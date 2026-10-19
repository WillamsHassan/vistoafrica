import { prisma } from "./src/config/prisma";

async function main() {
  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      OR: [
        { archivedAt: null },
        { archivedAt: { isSet: false } },
      ],
    },
    select: {
      name: true,
      slug: true,
      archivedAt: true,
    },
  });

  console.log("Nombre de formations :", courses.length);
  console.log(JSON.stringify(courses, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
