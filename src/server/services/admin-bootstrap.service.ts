import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

function getConfiguredAdminCredentials(): { email: string; password: string } | null {
  try {
    const email = process.env.ADMIN_DEFAULT_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_DEFAULT_PASSWORD;

    if (!email || !password || password.length < 6) return null;
    return { email, password };
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

  const existingAdmin = await db.user.findUnique({
    where: { email: credentials.email },
    select: { id: true, status: true, isSuperAdmin: true },
  });

  if (existingAdmin) {
    if (!existingAdmin.isSuperAdmin || existingAdmin.status !== "ACTIVE") {
      await db.user.update({
        where: { id: existingAdmin.id },
        data: {
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
        email: credentials.email,
        passwordHash,
        status: "ACTIVE",
        isSuperAdmin: true,
      },
    });
  } catch (error) {
    // Another application instance may have created the unique e-mail concurrently.
    const concurrentAdmin = await db.user.findUnique({
      where: { email: credentials.email },
      select: { id: true, status: true, isSuperAdmin: true },
    });

    if (!concurrentAdmin) throw error;

    if (!concurrentAdmin.isSuperAdmin || concurrentAdmin.status !== "ACTIVE") {
      await db.user.update({
        where: { id: concurrentAdmin.id },
        data: {
          isSuperAdmin: true,
          status: "ACTIVE",
        },
      });
    }
  }
}
