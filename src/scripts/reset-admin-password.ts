import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const newPassword = "pajo3112@";
  const passwordHash = await bcrypt.hash(newPassword, 10);

  console.log(`\n🔑 Ajustando contas de Administrador...\n`);

  // Ajusta o usuário admin@pajotree.com
  await prisma.user.updateMany({
    where: { email: "admin@pajotree.com" },
    data: {
      username: "admin",
      passwordHash,
      isSuperAdmin: true,
      status: "ACTIVE"
    }
  });

  // Ajusta o usuário pajotecnologia@gmail.com
  await prisma.user.updateMany({
    where: { email: "pajotecnologia@gmail.com" },
    data: {
      username: "pajotecnologia",
      passwordHash,
      isSuperAdmin: true,
      status: "ACTIVE"
    }
  });

  // Ajusta as outras contas também
  await prisma.user.updateMany({
    where: {
      email: { in: ["paulo@pajotecnologia.com.br", "paulojsilva@live.com"] }
    },
    data: {
      passwordHash,
      isSuperAdmin: true,
      status: "ACTIVE"
    }
  });

  const users = await prisma.user.findMany({
    where: { isSuperAdmin: true },
    select: { id: true, name: true, email: true, username: true, isSuperAdmin: true, status: true }
  });

  console.log(`✅ Contas Super Admin no banco de dados:`);
  for (const u of users) {
    console.log(`- Login/Username: "${u.username}" | E-mail: "${u.email}" | Status: ${u.status} | Senha: "${newPassword}"`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
