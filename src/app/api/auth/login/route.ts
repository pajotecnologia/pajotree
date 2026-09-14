import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { AuditService } from "@/server/services/audit.service";
import { ensureDefaultSuperAdmin } from "@/server/services/admin-bootstrap.service";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Senha obrigatória"),
});

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("BAD_REQUEST", parsed.error.issues[0]?.message || "Dados inválidos", 400);
    }

    // Bootstrap idempotente: garante que o Super Admin configurado no Coolify
    // exista antes da busca de credenciais, sem alterar usuários clientes.
    await ensureDefaultSuperAdmin();

    const { email, password } = parsed.data;
    const user = await db.user.findUnique({
      where: { email },
      include: {
        organizations: {
          where: { status: "ACTIVE" },
          include: { organization: true, role: true },
        },
      },
    });

    if (!user) return apiError("UNAUTHORIZED", "Credenciais inválidas.", 401);
    if (user.status !== "ACTIVE") return apiError("FORBIDDEN", "Esta conta está inativa ou bloqueada.", 403);

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return apiError("UNAUTHORIZED", "Credenciais inválidas.", 401);

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const primaryOrg = user.organizations[0]?.organization;
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeOrganizationId: primaryOrg?.id,
    });

    await AuditService.log({
      organizationId: primaryOrg?.id || null,
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, isSuperAdmin: user.isSuperAdmin },
      organization: primaryOrg
        ? { id: primaryOrg.id, name: primaryOrg.name, status: primaryOrg.status }
        : null,
    });
  } catch (error) {
    console.error("Erro no login:", error instanceof Error ? error.message : "Erro desconhecido");
    return apiError("INTERNAL_ERROR", "Ocorreu um erro ao processar o login. Tente novamente.", 500);
  }
}
