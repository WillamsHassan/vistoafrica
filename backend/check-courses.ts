import { prisma } from "./src/config/prisma";

async function main() {
  const courses = await prisma.course.findMany({
    where: {},
    select: {
      name: true,
      slug: true,
      isActive: true,
      archivedAt: true,
    },
  });

  console.log(JSON.stringify(courses, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
