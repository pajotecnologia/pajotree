import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

function getConfiguredAdminCredentials(): { username: string; email: string; password: string } {
  const rawUsername = process.env.ADMIN_DEFAULT_USERNAME || process.env.ADMIN_DEFAULT_LOGIN || process.env.ADMIN_USERNAME || process.env.ADMIN_USER;
  const rawEmail = (process.env.ADMIN_DEFAULT_EMAIL || process.env.ADMIN_EMAIL || "pajotecnologia@gmail.com").trim().toLowerCase();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || process.env.ADMIN_PASSWORD || "123456";

  const username = (rawUsername || rawEmail.split("@")[0] || "pajotecnologia").trim().toLowerCase();
  const email = rawEmail;

  return { username, email, password };
}

/**
 * Ensures that the administrator exists and keeps the credentials in sync.
 * This operation is idempotent.
 */
export async function ensureDefaultSuperAdmin(): Promise<void> {
  const credentials = getConfiguredAdminCredentials();
  const passwordHash = await hashPassword(credentials.password);

  const existingAdmin = await db.user.findFirst({
    where: {
      OR: [
        { isSuperAdmin: true },
        { email: { equals: credentials.email, mode: "insensitive" } },
        { username: { equals: credentials.username, mode: "insensitive" } },
        { username: { equals: "pajotecnologia", mode: "insensitive" } },
        { username: { equals: "admin", mode: "insensitive" } },
        { email: { startsWith: `${credentials.username}@`, mode: "insensitive" } },
        { email: { startsWith: "pajotecnologia@", mode: "insensitive" } },
      ],
    },
    select: { id: true, username: true, status: true, isSuperAdmin: true },
  });

  if (existingAdmin) {
    await db.user.update({
      where: { id: existingAdmin.id },
      data: {
        username: credentials.username,
        email: credentials.email,
        passwordHash,
        isSuperAdmin: true,
        status: "ACTIVE",
      },
    });
    return;
  }

  try {
    await db.user.create({
      data: {
        name: "Super Administrador",
        username: credentials.username,
        email: credentials.email,
        passwordHash,
        status: "ACTIVE",
        isSuperAdmin: true,
      },
    });
  } catch (error) {
    console.warn("Aviso ao criar Super Admin inicial:", error);
  }
}
