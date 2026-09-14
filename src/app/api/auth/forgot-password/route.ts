import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { AuditService } from "@/server/services/audit.service";

const forgotSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "E-mail inválido" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    // Procura o usuário
    const user = await db.user.findUnique({
      where: { email },
      include: {
        organizations: {
          include: {
            organization: {
              include: {
                whiteLabelParent: true,
              },
            },
          },
        },
      },
    });

    // Se usuário não existir, retornamos sucesso genérico por segurança (evita enumeração de e-mails)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Se o e-mail informado estiver cadastrado, você receberá as instruções para redefinir sua senha em instantes.",
      });
    }

    // Gera token seguro de 64 caracteres hexadecimais
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validade

    try {
      // Invalida tokens anteriores não usados para este e-mail
      await db.passwordResetToken.updateMany({
        where: { email, used: false },
        data: { used: true },
      });

      // Cria o novo token
      await db.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt,
          used: false,
        },
      });
    } catch (tokenErr) {
      console.warn("Aviso ao persistir token de recuperação no banco:", tokenErr);
    }

    // Resolve marca (White Label ou Pajotree)
    const orgUser = user.organizations[0];
    const org = orgUser?.organization;
    const parent = org?.whiteLabelParent;

    const brandName = parent?.tradeName || parent?.name || org?.tradeName || org?.name || "Pajotree";
    const logoUrl = parent?.logoUrl || org?.logoUrl || null;

    // Constrói URL de reset
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

    // Envia o e-mail (resiliente)
    try {
      await sendPasswordResetEmail({
        to: email,
        name: user.name,
        resetUrl,
        brandName,
        logoUrl,
        organizationId: org?.id,
      });
    } catch (emailErr) {
      console.warn("Aviso ao enviar e-mail de recuperação (SMTP):", emailErr);
    }

    try {
      await AuditService.log({
        userId: user.id,
        organizationId: org?.id || undefined,
        action: "REQUEST_PASSWORD_RESET",
        entity: "User",
        entityId: user.id,
        metadata: { email },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: "Se o e-mail informado estiver cadastrado, você receberá as instruções para redefinir sua senha em instantes.",
    });
  } catch (error: any) {
    console.error("Erro na recuperação de senha:", error);
    return NextResponse.json({
      success: true,
      message: "Se o e-mail informado estiver cadastrado, você receberá as instruções para redefinir sua senha em instantes.",
    });
  }
}
