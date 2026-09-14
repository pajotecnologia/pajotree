import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      organizations: {
        include: {
          organization: true,
          role: true,
        },
      },
    },
  });

  console.log(`\n=== USUÁRIOS NO BANCO DE DADOS (${users.length}) ===`);
  for (const u of users) {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Nome: ${u.name} | SuperAdmin: ${u.isSuperAdmin} | Status: ${u.status}`);
    for (const orgUser of u.organizations) {
      console.log(`  -> Org: ${orgUser.organization.name} (${orgUser.organization.id}) | Role: ${orgUser.role.name}`);
    }
  }

  // Se não houver admin ou senha precisar ser garantida:
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@pajotree.com";
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "AdminPassword123!";
  const hash = await bcrypt.hash(defaultPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hash,
      status: "ACTIVE",
      isSuperAdmin: true,
    },
    create: {
      name: "Super Administrador",
      email: adminEmail,
      passwordHash: hash,
      isSuperAdmin: true,
      status: "ACTIVE",
    },
  });

  console.log(`\n✅ Super Admin garantido:`);
  console.log(`Email: ${admin.email}`);
  console.log(`Senha padrão: ${defaultPassword}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
