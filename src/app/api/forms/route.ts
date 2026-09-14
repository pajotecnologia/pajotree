import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlanLimitService } from "@/server/services/plan-limit.service";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const forms = await db.form.findMany({
      where: { organizationId: auth.organization.id },
      include: {
        fields: { orderBy: { position: "asc" } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ forms });
  } catch (error: any) {
    console.error("Erro ao listar formulários:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    // 1. Validar cota do plano
    await PlanLimitService.assertCanCreate(orgId, "form");

    const body = await request.json();
    const { title, description, successMessage, fields } = body;

    const form = await db.form.create({
      data: {
        organizationId: orgId,
        title,
        description: description || null,
        successMessage: successMessage || "Mensagem enviada com sucesso!",
        fields: {
          create: (fields || []).map((f: any, idx: number) => ({
            label: f.label,
            type: f.type || "text",
            placeholder: f.placeholder || null,
            required: !!f.required,
            position: idx,
          })),
        },
      },
      include: { fields: true },
    });

    return NextResponse.json({ success: true, form });
  } catch (error: any) {
    console.error("Erro ao criar formulário:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar formulário" },
      { status: 400 }
    );
  }
}
