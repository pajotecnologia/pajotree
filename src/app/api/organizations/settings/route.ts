import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { AuditService } from "@/server/services/audit.service";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  tradeName: z.string().trim().max(120).optional().default(""),
  document: z.string().trim().max(30).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  whatsapp: z.string().trim().max(30).optional().default(""),
  website: z.string().trim().max(255).optional().default(""),
  segment: z.string().trim().max(100).optional().default(""),
  description: z.string().trim().max(500).optional().default(""),
  logoUrl: z.string().max(2_800_000).optional().default(""),
  customDomain: z.string().trim().max(253).optional().default(""),
});

function normalizeDomain(value: string) {
  return value.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth?.organization) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const org = await db.organization.findUnique({
      where: { id: auth.organization.id },
      include: { addresses: true, domains: true },
    });

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error("Erro ao obter configurações:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth?.organization) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }

    const data = parsed.data;
    const orgId = auth.organization.id;
    const customDomain = data.customDomain ? normalizeDomain(data.customDomain) : "";

    if (customDomain) {
      try {
        await PlanLimitService.assertFeatureEnabled(orgId, "custom_domain");
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Domínio personalizado não disponível." }, { status: 403 });
      }
    }

    const updated = await db.organization.update({
      where: { id: orgId },
      data: {
        name: data.name,
        tradeName: data.tradeName || null,
        document: data.document || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        website: data.website || null,
        segment: data.segment || null,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
      },
    });

    if (customDomain) {
      const conflictingDomain = await db.domain.findUnique({ where: { domain: customDomain } });
      if (conflictingDomain && conflictingDomain.organizationId !== orgId) {
        return NextResponse.json({ error: "Este domínio já está vinculado a outra organização." }, { status: 409 });
      }

      await db.domain.upsert({
        where: { domain: customDomain },
        create: { organizationId: orgId, domain: customDomain, verificationStatus: "PENDING" },
        update: { organizationId: orgId },
      });
    }

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "UPDATE_ORGANIZATION_SETTINGS",
      entity: "Organization",
      entityId: orgId,
      metadata: { customDomain: customDomain || null },
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao atualizar dados" }, { status: 500 });
  }
}
