import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { encryptSecret } from "@/lib/crypto";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const [metaPixels, googleIntegrations] = await Promise.all([
      db.metaPixel.findMany({ where: { organizationId: orgId } }),
      db.googleIntegration.findMany({ where: { organizationId: orgId } }),
    ]);

    return NextResponse.json({ metaPixels, googleIntegrations });
  } catch (error: any) {
    console.error("Erro ao listar pixels:", error);
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
    const body = await request.json();
    const { type, name, pixelId, accessToken, measurementId } = body;

    if (type === "meta") {
      // 1. Validar cota de pixels do plano
      await PlanLimitService.assertCanCreate(orgId, "meta_pixel");

      const encryptedToken = accessToken ? encryptSecret(accessToken) : null;

      const metaPixel = await db.metaPixel.create({
        data: {
          organizationId: orgId,
          name: name || "Meta Pixel Padrão",
          pixelId,
          accessTokenEncrypted: encryptedToken,
          isDefault: true,
          status: "ACTIVE",
        },
      });

      return NextResponse.json({ success: true, pixel: metaPixel });
    }

    if (type === "google") {
      const google = await db.googleIntegration.create({
        data: {
          organizationId: orgId,
          measurementId,
          status: "ACTIVE",
        },
      });

      return NextResponse.json({ success: true, google });
    }

    return NextResponse.json({ error: "Tipo de pixel inválido" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao salvar pixel:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao configurar pixel" },
      { status: 400 }
    );
  }
}
