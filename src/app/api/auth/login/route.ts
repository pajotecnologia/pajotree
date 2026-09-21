import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { AuditService } from "@/server/services/audit.service";
import { ensureDefaultSuperAdmin } from "@/server/services/admin-bootstrap.service";
import { ensureDatabaseSchema } from "@/lib/db-migrate";
import { z } from "zod";

const loginSchema = z.object({
  login: z.string().trim().min(1, "Informe seu usuário ou login").optional(),
  username: z.string().trim().min(1).optional(),
  email: z.string().trim().min(1).optional(),
  password: z.string().min(1, "Senha obrigatória"),
}).refine((data) => Boolean(data.login || data.username || data.email), {
  message: "Informe seu usuário ou login de acesso",
});

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("BAD_REQUEST", parsed.error.issues[0]?.message || "Dados inválidos", 400);
    }

    // Auto-migração resiliente do schema
    try {
      await ensureDatabaseSchema();
    } catch {
      // Non-blocking
    }

    // Bootstrap idempotente: garante que o Super Admin configurado no Coolify
    // exista antes da busca de credenciais, sem alterar usuários clientes.
    try {
      await ensureDefaultSuperAdmin();
    } catch (bootstrapErr) {
      console.warn("Aviso no bootstrap do Super Admin:", bootstrapErr);
    }

    const { password } = parsed.data;
    const rawIdentifier = (parsed.data.login || parsed.data.username || parsed.data.email || "").trim();
    const loginIdentifier = rawIdentifier.toLowerCase();
    const usernamePrefix = loginIdentifier.includes("@") ? loginIdentifier.split("@")[0] : loginIdentifier;
    const alphanumericOnly = loginIdentifier.replace(/[^a-z0-9]/g, "");

    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: { equals: loginIdentifier, mode: "insensitive" } },
          { username: { equals: usernamePrefix, mode: "insensitive" } },
          { username: { equals: alphanumericOnly, mode: "insensitive" } },
          { email: { equals: loginIdentifier, mode: "insensitive" } },
          { email: { startsWith: `${usernamePrefix}@`, mode: "insensitive" } },
          {
            organizations: {
              some: {
                organization: {
                  OR: [
                    { id: loginIdentifier },
                    { whiteLabelDomain: loginIdentifier },
                    { name: { equals: loginIdentifier, mode: "insensitive" } },
                    { tradeName: { equals: loginIdentifier, mode: "insensitive" } },
                  ],
                },
              },
            },
          },
          ...(loginIdentifier === "admin" || loginIdentifier === "pajotecnologia" ? [{ isSuperAdmin: true }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        passwordHash: true,
        status: true,
        isSuperAdmin: true,
        organizations: {
          select: {
            organization: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) return apiError("UNAUTHORIZED", "Credenciais inválidas.", 401);
    if (user.status !== "ACTIVE") return apiError("FORBIDDEN", "Esta conta está inativa ou bloqueada.", 403);

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return apiError("UNAUTHORIZED", "Credenciais inválidas.", 401);

    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch {
      // Non-blocking
    }

    const primaryOrg = user.organizations[0]?.organization;
    const token = signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeOrganizationId: primaryOrg?.id,
    });

    try {
      await setSessionCookie({
        userId: user.id,
        username: user.username,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        activeOrganizationId: primaryOrg?.id,
      });
    } catch {
      // Ignored if called in edge/context where cookies() is read-only
    }

    try {
      await AuditService.log({
        organizationId: primaryOrg?.id || null,
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
      });
    } catch {
      // Non-blocking
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
      organization: primaryOrg
        ? { id: primaryOrg.id, name: primaryOrg.name, status: primaryOrg.status }
        : null,
    });

    const isCookieSecure =
      process.env.COOKIE_SECURE === "true" ||
      (process.env.NODE_ENV === "production" &&
        Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")));

    response.cookies.set("pajotree_session", token, {
      httpOnly: true,
      secure: isCookieSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro detalhado no login:", error);
    return apiError(
      "INTERNAL_ERROR",
      `Ocorreu um erro ao processar o login (${message}). Tente novamente.`,
      500
    );
  }
}
