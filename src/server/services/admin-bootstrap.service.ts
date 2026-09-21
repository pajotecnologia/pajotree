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
 * This operation is idempotent and never promotes another user.
 */
export async function ensureDefaultSuperAdmin(): Promise<void> {
  const credentials = getConfiguredAdminCredentials();
  if (!credentials) return;

  const existingAdmin = await db.user.findFirst({
    where: {
      OR: [
        { email: credentials.email },
        { username: credentials.username },
      ],
    },
    select: { id: true, username: true, status: true, isSuperAdmin: true },
  });

  if (existingAdmin) {
    const shouldUpdate =
      !existingAdmin.isSuperAdmin ||
      existingAdmin.status !== "ACTIVE" ||
      !existingAdmin.username;

    if (shouldUpdate) {
      await db.user.update({
        where: { id: existingAdmin.id },
        data: {
          username: existingAdmin.username || credentials.username,
          isSuperAdmin: true,
          status: "ACTIVE",
        },
      });
    }
    return;
  }

  const passwordHash = await hashPassword(credentials.password);

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
          { email: credentials.email },
          { username: credentials.username },
        ],
      },
      select: { id: true, username: true, status: true, isSuperAdmin: true },
    });

    if (!concurrentAdmin) throw error;

    if (!concurrentAdmin.isSuperAdmin || concurrentAdmin.status !== "ACTIVE" || !concurrentAdmin.username) {
      await db.user.update({
        where: { id: concurrentAdmin.id },
        data: {
          username: concurrentAdmin.username || credentials.username,
          isSuperAdmin: true,
          status: "ACTIVE",
        },
      });
    }
  }
}
