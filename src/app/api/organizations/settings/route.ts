import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuditService } from "@/server/services/audit.service";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const org = await db.organization.findUnique({
      where: { id: auth.organization.id },
      include: {
        addresses: true,
        domains: true,
      },
    });

    return NextResponse.json({ organization: org });
  } catch (error: any) {
    console.error("Erro ao obter configurações:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;
    const body = await request.json();
    const { name, tradeName, document, phone, whatsapp, website, segment, description, logoUrl, customDomain } = body;

    const updated = await db.organization.update({
      where: { id: orgId },
      data: {
        name,
        tradeName: tradeName || null,
        document: document || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        website: website || null,
        segment: segment || null,
        description: description || null,
        logoUrl: logoUrl || null,
      },
    });

    // Se informou domínio customizado, salvar na tabela Domain
    if (customDomain) {
      await db.domain.upsert({
        where: { domain: customDomain.toLowerCase().trim() },
        create: {
          organizationId: orgId,
          domain: customDomain.toLowerCase().trim(),
          verificationStatus: "PENDING",
        },
        update: {
          organizationId: orgId,
        },
      });
    }

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "UPDATE_ORGANIZATION_SETTINGS",
      entity: "Organization",
      entityId: orgId,
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error: any) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar dados" }, { status: 500 });
  }
}
