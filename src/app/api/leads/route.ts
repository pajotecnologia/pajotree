import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeadStatus } from "@prisma/client";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const leads = await db.lead.findMany({
      where: { organizationId: auth.organization.id },
      include: {
        tags: { include: { tag: true } },
        customers: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const customers = await db.customer.findMany({
      where: { organizationId: auth.organization.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leads, customers });
  } catch (error: any) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { action, leadId } = body;

    if (action === "convert_to_customer") {
      const lead = await db.lead.findFirst({
        where: { id: leadId, organizationId: auth.organization.id },
      });

      if (!lead) {
        return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
      }

      // Criar cliente e atualizar status do lead para CONVERTED
      const customer = await db.$transaction(async (tx) => {
        const createdCustomer = await tx.customer.create({
          data: {
            organizationId: auth.organization!.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            whatsapp: lead.whatsapp,
            company: lead.company,
            leadId: lead.id,
          },
        });

        await tx.lead.update({
          where: { id: lead.id },
          data: { status: "CONVERTED" },
        });

        return createdCustomer;
      });

      return NextResponse.json({ success: true, customer });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao converter lead:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar ação" }, { status: 500 });
  }
}
