import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

function getConfiguredAdminCredentials(): { username: string; email: string; password: string } | null {
  try {
    const rawUsername = process.env.ADMIN_DEFAULT_USERNAME || process.env.ADMIN_DEFAULT_LOGIN;
    const rawEmail = process.env.ADMIN_DEFAULT_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_DEFAULT_PASSWORD;

    if (!password || password.length < 6) return null;

    const username = (rawUsername || (rawEmail ? rawEmail.split("@")[0] : "admin")).trim().toLowerCase();
    const email = rawEmail || `${username}@pajotree.com`;

    return { username, email, password };
  } catch {
    return null;
  }
}

/**
 * Ensures that the administrator configured through Coolify exists.
 * This operation is idempotent and keeps the password in sync with environment variables.
 */
export async function ensureDefaultSuperAdmin(): Promise<void> {
  const credentials = getConfiguredAdminCredentials();
  if (!credentials) return;

  const passwordHash = await hashPassword(credentials.password);

  const existingAdmin = await db.user.findFirst({
    where: {
      OR: [
        { email: { equals: credentials.email, mode: "insensitive" } },
        { username: { equals: credentials.username, mode: "insensitive" } },
        { email: { startsWith: `${credentials.username}@`, mode: "insensitive" } },
      ],
    },
    select: { id: true, username: true, status: true, isSuperAdmin: true },
  });

  if (existingAdmin) {
    await db.user.update({
      where: { id: existingAdmin.id },
      data: {
        username: credentials.username,
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
    // Another application instance may have created the unique e-mail/username concurrently.
    const concurrentAdmin = await db.user.findFirst({
      where: {
        OR: [
          { email: { equals: credentials.email, mode: "insensitive" } },
          { username: { equals: credentials.username, mode: "insensitive" } },
          { email: { startsWith: `${credentials.username}@`, mode: "insensitive" } },
        ],
      },
      select: { id: true, username: true, status: true, isSuperAdmin: true },
    });

    if (!concurrentAdmin) throw error;

    await db.user.update({
      where: { id: concurrentAdmin.id },
      data: {
        username: credentials.username,
        passwordHash,
        isSuperAdmin: true,
        status: "ACTIVE",
      },
    });
  }
}
