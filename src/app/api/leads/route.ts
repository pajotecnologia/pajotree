import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const [leads, customers, newLeadsCount] = await Promise.all([
      db.lead.findMany({
        where: { organizationId: orgId },
        include: {
          tags: { include: { tag: true } },
          customers: true,
          page: { select: { title: true, slug: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.customer.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
      }),
      db.lead.count({
        where: { organizationId: orgId, status: "NEW" },
      }),
    ]);

    return NextResponse.json({ leads, customers, newLeadsCount });
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
    const { action, leadId, status } = body;

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

    if (action === "update_status") {
      if (!leadId || !status) {
        return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
      }

      const updated = await db.lead.updateMany({
        where: { id: leadId, organizationId: auth.organization.id },
        data: { status },
      });

      return NextResponse.json({ success: true, updated });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao processar ação de lead:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar ação" }, { status: 500 });
  }
}

