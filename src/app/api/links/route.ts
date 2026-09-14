import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { AuditService } from "@/server/services/audit.service";
import { z } from "zod";

const linkSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  url: z.string().url("URL inválida"),
  description: z.string().optional(),
  icon: z.string().optional().default("globe"),
  featured: z.boolean().optional().default(false),
  openNewTab: z.boolean().optional().default(true),
  metaPixelId: z.string().optional(),
  eventName: z.string().optional().default("LinkClick"),
});

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const links = await db.link.findMany({
      where: { organizationId: orgId },
      include: {
        shortLinks: true,
        trackingConfig: true,
        _count: {
          select: { analyticsEvents: true },
        },
      },
      orderBy: { position: "asc" },
    });

    const metaPixels = await db.metaPixel.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
    });

    const planUsage = await PlanLimitService.getPlanAndUsage(orgId);

    return NextResponse.json({ links, metaPixels, planUsage });
  } catch (error: any) {
    console.error("Erro ao buscar links:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    // 1. Validar Limite do Plano
    await PlanLimitService.assertCanCreate(orgId, "link");

    const body = await request.json();
    const parsed = linkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { title, url, description, icon, featured, openNewTab, metaPixelId, eventName } = parsed.data;

    // Buscar a página principal da organização
    const page = await db.page.findFirst({
      where: { organizationId: orgId },
    });

    const lastLink = await db.link.findFirst({
      where: { organizationId: orgId },
      orderBy: { position: "desc" },
    });

    const position = lastLink ? lastLink.position + 1 : 0;
    const shortCode = `l-${Date.now().toString(36).slice(-5)}`;

    const link = await db.$transaction(async (tx) => {
      const createdLink = await tx.link.create({
        data: {
          organizationId: orgId,
          pageId: page?.id || null,
          title,
          url,
          description: description || null,
          icon: icon || "globe",
          featured: !!featured,
          openNewTab: !!openNewTab,
          position,
          status: "ACTIVE",
          trackingConfig: {
            create: {
              enabled: true,
              trackingMode: metaPixelId ? "CUSTOM" : "INHERIT",
              metaPixelId: metaPixelId || null,
              eventName: eventName || "LinkClick",
            },
          },
        },
      });

      await tx.shortLink.create({
        data: {
          organizationId: orgId,
          linkId: createdLink.id,
          code: shortCode,
          destinationUrl: url,
          status: "ACTIVE",
        },
      });

      return createdLink;
    });

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "CREATE_LINK",
      entity: "Link",
      entityId: link.id,
      metadata: { title, url, shortCode },
    });

    return NextResponse.json({ success: true, link });
  } catch (error: any) {
    console.error("Erro ao criar link:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar link" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("id");

    if (!linkId) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const existing = await db.link.findFirst({
      where: { id: linkId, organizationId: auth.organization.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
    }

    await db.link.delete({ where: { id: linkId } });

    await AuditService.log({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      action: "DELETE_LINK",
      entity: "Link",
      entityId: linkId,
    });

    return NextResponse.json({ success: true, message: "Link excluído" });
  } catch (error: any) {
    console.error("Erro ao deletar link:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
