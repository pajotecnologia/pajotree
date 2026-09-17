import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import QRCode from "qrcode";

function getPublicAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Evita URLs inválidas como https://tree.pajotech.com.br//p/slug
  return configuredUrl.replace(/\/+$/, "");
}

export async function GET(request: Request) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const [page, org] = await Promise.all([
      db.page.findFirst({
        where: { organizationId: orgId },
      }),
      db.organization.findUnique({
        where: { id: orgId },
        include: { whiteLabelParent: true },
      }),
    ]);

    const pageSlug = page?.slug || "minha-empresa";

    // Resolve White Label Custom Domain
    const customDomain = org?.whiteLabelDomain || org?.whiteLabelParent?.whiteLabelDomain;
    let targetUrl: string;

    if (customDomain) {
      const cleanCustomDomain = customDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      targetUrl = `https://${cleanCustomDomain}/p/${pageSlug}`;
    } else {
      const configuredUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
      targetUrl = `${configuredUrl}/p/${pageSlug}`;
    }

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      targetUrl,
      qrDataUrl,
      pageSlug,
    });
  } catch (error: any) {
    console.error("Erro ao gerar QR Code:", error);
    return NextResponse.json({ error: "Erro ao gerar QR Code" }, { status: 500 });
  }
}
