import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const authContext = await getCurrentAuthContext();

    if (!authContext) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let planAndUsage = null;
    let pageSlug = null;

    if (authContext.organization?.id) {
      try {
        const [planUsage, primaryPage] = await Promise.all([
          PlanLimitService.getPlanAndUsage(authContext.organization.id),
          db.page.findFirst({
            where: { organizationId: authContext.organization.id },
            select: { slug: true },
          }),
        ]);
        planAndUsage = planUsage;
        pageSlug = primaryPage?.slug || null;
      } catch (e) {
        console.error("Erro ao carregar dados complementares do auth/me:", e);
      }
    }

    const org = authContext.organization;
    const isWlPlan = planAndUsage?.plan?.name?.toUpperCase().includes("WHITE") || Boolean(planAndUsage?.features?.removeBranding && planAndUsage?.features?.customDomainAllowed);
    const isWhiteLabelPartner = Boolean(org?.isWhiteLabel || isWlPlan || authContext.isSuperAdmin);
    const isWhiteLabelClient = Boolean(org?.whiteLabelParentId);

    return NextResponse.json({
      authenticated: true,
      user: authContext.user,
      organization: authContext.organization,
      role: authContext.role,
      permissions: authContext.permissions,
      isSuperAdmin: authContext.isSuperAdmin,
      isWhiteLabelPartner,
      isWhiteLabelClient,
      whiteLabelParent: org?.whiteLabelParent || null,
      planDetails: planAndUsage,
      pageSlug,
    });
  } catch (error: any) {
    console.error("Erro ao obter contexto de autenticação:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados do usuário" },
      { status: 500 }
    );
  }
}
