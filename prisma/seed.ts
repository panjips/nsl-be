import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedRoles() {
  const roles = ["Pemilik", "Kasir", "Staf", "Pelanggan"];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { id: roles.indexOf(name) + 1 },
      update: {},
      create: { name },
    });
  }

  console.log("✅ Roles seeded.");
}

async function main() {
  await seedRoles();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    prisma.$disconnect();
    process.exit(1);
  });
