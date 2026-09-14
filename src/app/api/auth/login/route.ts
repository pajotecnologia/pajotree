import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { AuditService } from "@/server/services/audit.service";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // 1. Buscar usuário com organizações
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organizations: {
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas. Verifique seu e-mail e senha." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Esta conta está inativa ou bloqueada. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    // 2. Validar Senha
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas. Verifique seu e-mail e senha." },
        { status: 401 }
      );
    }

    // 3. Atualizar último login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 4. Determinar organização ativa inicial
    const primaryOrg = user.organizations[0]?.organization;

    // 5. Configurar Cookie de Sessão
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeOrganizationId: primaryOrg?.id,
    });

    // 6. Auditoria
    await AuditService.log({
      organizationId: primaryOrg?.id || null,
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
      organization: primaryOrg
        ? {
            id: primaryOrg.id,
            name: primaryOrg.name,
            status: primaryOrg.status,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar o login. Tente novamente." },
      { status: 500 }
    );
  }
}
