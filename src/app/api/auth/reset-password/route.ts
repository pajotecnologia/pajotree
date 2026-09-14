import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { AuditService } from "@/server/services/audit.service";

const resetSchema = z.object({
  token: z.string().min(1, "Token de recuperação obrigatório"),
  password: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Busca o token no banco
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Link de recuperação inválido ou inexistente." },
        { status: 400 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: "Este link de recuperação já foi utilizado. Solicite um novo caso necessário." },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: "Este link de recuperação expirou (validade de 1 hora). Solicite um novo link." },
        { status: 400 }
      );
    }

    // Busca o usuário correspondente ao e-mail do token
    const user = await db.user.findUnique({
      where: { email: resetToken.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário associado a este token não encontrado." },
        { status: 404 }
      );
    }

    // Gera o novo hash de senha
    const newPasswordHash = await hashPassword(password);

    // Atualiza a senha e marca o token como utilizado em transação atômica
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    await AuditService.log({
      userId: user.id,
      action: "RESET_PASSWORD_COMPLETED",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email },
    });

    return NextResponse.json({
      success: true,
      message: "Sua senha foi redefinida com sucesso! Você já pode fazer login.",
    });
  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar a nova senha. Tente novamente." },
      { status: 500 }
    );
  }
}
