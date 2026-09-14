import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { PlanLimitService } from "@/server/services/plan-limit.service";

export async function GET() {
  try {
    const authContext = await getCurrentAuthContext();

    if (!authContext) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let planAndUsage = null;
    if (authContext.organization?.id) {
      try {
        planAndUsage = await PlanLimitService.getPlanAndUsage(authContext.organization.id);
      } catch (e) {
        console.error("Erro ao carregar uso do plano:", e);
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: authContext.user,
      organization: authContext.organization,
      role: authContext.role,
      permissions: authContext.permissions,
      isSuperAdmin: authContext.isSuperAdmin,
      planDetails: planAndUsage,
    });
  } catch (error: any) {
    console.error("Erro ao obter contexto de autenticação:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados do usuário" },
      { status: 500 }
    );
  }
}
