import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "pajotree_session";

function getJwtSecret(): string {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }

  return JWT_SECRET;
}

export interface SessionPayload {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  activeOrganizationId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Gets the current logged-in user with their active organization and RBAC permissions.
 */
export async function getCurrentAuthContext() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      organizations: {
        include: {
          organization: {
            include: {
              plan: {
                include: {
                  features: true,
                },
              },
              whiteLabelParent: {
                select: {
                  id: true,
                  name: true,
                  tradeName: true,
                  logoUrl: true,
                  faviconUrl: true,
                },
              },
              paymentGateway: {
                select: {
                  ativo: true,
                  provider: true,
                  ambiente: true,
                },
              },
            },
          },
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") return null;

  // Resolve active organization: either from session or the first organization user belongs to
  let activeOrgUser = user.organizations.find(
    (ou) => ou.organizationId === session.activeOrganizationId
  );

  if (!activeOrgUser && user.organizations.length > 0) {
    activeOrgUser = user.organizations[0];
  }

  // If user is a Super Admin and has no organization association yet, ensure/link master organization
  if (!activeOrgUser && user.isSuperAdmin) {
    try {
      let defaultOrg = await db.organization.findFirst({
        include: {
          plan: {
            include: { features: true },
          },
        },
      });

      if (!defaultOrg) {
        const masterPlan = await db.plan.findFirst({
          include: { features: true },
        });

        defaultOrg = await db.organization.create({
          data: {
            name: "Pajotree Master",
            email: user.email,
            status: "ACTIVE",
            planId: masterPlan?.id || null,
          },
          include: {
            plan: { include: { features: true } },
          },
        });
      }

      let ownerRole = await db.role.findFirst({
        where: { name: "OWNER" },
        include: { permissions: { include: { permission: true } } },
      });

      if (!ownerRole) {
        ownerRole = await db.role.create({
          data: {
            name: "OWNER",
            description: "Proprietário / Acesso Total",
          },
          include: { permissions: { include: { permission: true } } },
        });
      }

      if (defaultOrg && ownerRole) {
        activeOrgUser = await db.organizationUser.upsert({
          where: {
            organizationId_userId: {
              organizationId: defaultOrg.id,
              userId: user.id,
            },
          },
          create: {
            userId: user.id,
            organizationId: defaultOrg.id,
            roleId: ownerRole.id,
            status: "ACTIVE",
          },
          update: {
            status: "ACTIVE",
          },
          include: {
            organization: {
              include: {
                plan: { include: { features: true } },
                whiteLabelParent: {
                  select: {
                    id: true,
                    name: true,
                    tradeName: true,
                    logoUrl: true,
                    faviconUrl: true,
                  },
                },
                paymentGateway: {
                  select: {
                    ativo: true,
                    provider: true,
                    ambiente: true,
                  },
                },
              },
            },
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        });
      }
    } catch (err) {
      console.error("Erro ao vincular organização master ao Super Admin:", err);
    }
  }

  const permissions = new Set<string>();
  if (activeOrgUser?.role?.permissions) {
    activeOrgUser.role.permissions.forEach((rp) => {
      permissions.add(rp.permission.key);
    });
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    },
    organization: activeOrgUser?.organization || null,
    role: activeOrgUser?.role || null,
    permissions: Array.from(permissions),
    isSuperAdmin: user.isSuperAdmin,
  };
}
