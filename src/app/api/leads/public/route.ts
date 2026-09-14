import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TrackingService } from "@/server/services/tracking.service";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { z } from "zod";

const publicLeadSchema = z.object({
  pageSlug: z.string().min(1),
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional().default("page_form"),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = publicLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { pageSlug, name, email, phone, whatsapp, message, source, utmSource, utmMedium, utmCampaign } = parsed.data;

    // Localizar a página e a organização correspondente
    const page = await db.page.findUnique({
      where: { slug: pageSlug },
      include: {
        organization: {
          include: {
            pipelines: {
              include: {
                stages: {
                  orderBy: { position: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!page || page.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Página não encontrada ou inativa." },
        { status: 404 }
      );
    }

    const orgId = page.organizationId;

    // Verificar se o plano da empresa permite capturar mais leads
    try {
      await PlanLimitService.assertCanCreate(orgId, "lead");
    } catch (limitError: any) {
      console.warn("Limite de leads atingido para org:", orgId);
      // Notifica o dono da empresa silenciosamente
      await db.notification.create({
        data: {
          organizationId: orgId,
          type: "limit_reached",
          title: "Limite de Leads Atingido!",
          message: `Um novo contato tentou se cadastrar mas seu limite de leads do plano foi atingido. Faça upgrade para não perder clientes.`,
        },
      });
      return NextResponse.json(
        { error: "Mensagem recebida! No momento estamos com alta demanda." },
        { status: 200 }
      );
    }

    // Criar o Lead no banco
    const lead = await db.lead.create({
      data: {
        organizationId: orgId,
        pageId: page.id,
        name,
        email: email || null,
        phone: phone || whatsapp || null,
        whatsapp: whatsapp || phone || null,
        message: message || null,
        source: source || "page_form",
        status: "NEW",
      },
    });

    // Se a organização possuir pipeline CRM, criar automaticamente a oportunidade na primeira etapa
    const defaultPipeline = page.organization.pipelines[0];
    const initialStage = defaultPipeline?.stages[0];

    if (defaultPipeline && initialStage) {
      await db.opportunity.create({
        data: {
          organizationId: orgId,
          pipelineId: defaultPipeline.id,
          stageId: initialStage.id,
          title: `Oportunidade: ${name}`,
          leadId: lead.id,
        },
      });
    }

    // Criar Notificação interna para a equipe
    await db.notification.create({
      data: {
        organizationId: orgId,
        type: "new_lead",
        title: "Novo Lead Capturado!",
        message: `${name} enviou uma mensagem através da sua página pública.`,
        link: `/app/crm`,
      },
    });

    // Registrar Evento no Analytics
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    TrackingService.recordEvent({
      organizationId: orgId,
      pageId: page.id,
      eventType: "Lead",
      eventName: "LeadCapture",
      referrer,
      userAgent,
      ipAddress,
      utms: {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
      },
    }).catch((e) => console.error("Tracking lead error:", e));

    return NextResponse.json({
      success: true,
      message: "Recebemos sua mensagem! Em breve entraremos em contato.",
    });
  } catch (error: any) {
    console.error("Erro ao registrar lead público:", error);
    return NextResponse.json(
      { error: "Não foi possível enviar sua mensagem. Tente novamente." },
      { status: 500 }
    );
  }
}
