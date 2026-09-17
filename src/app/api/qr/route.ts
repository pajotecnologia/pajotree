import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(request: Request) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const [page, org, domain] = await Promise.all([
      db.page.findFirst({
        where: { organizationId: orgId },
      }),
      db.organization.findUnique({
        where: { id: orgId },
        include: { whiteLabelParent: true },
      }),
      db.domain.findFirst({
        where: { organizationId: orgId },
      }),
    ]);

    const pageSlug = page?.slug || "minha-empresa";

    // Extrair host ativo da requisição / query params
    const { searchParams } = new URL(request.url);
    const queryHost = searchParams.get("host")?.replace(/^https?:\/\//, "").split(":")[0].toLowerCase().trim();

    const reqHeaders = new Headers(request.headers);
    const rawReqHost =
      queryHost ||
      reqHeaders.get("x-custom-host") ||
      reqHeaders.get("x-forwarded-host") ||
      reqHeaders.get("host") ||
      "";
    const cleanReqHost = rawReqHost.split(":")[0].toLowerCase().trim();

    const isNonDefaultHost =
      cleanReqHost &&
      !["localhost", "127.0.0.1", "tree.pajotech.com.br", "pajotree.com", "pajotech.com.br", "pajotree.com.br"].includes(cleanReqHost);

    // Prioridade de resolução de domínio:
    // 1. Host ativo atual se for um domínio personalizado (ex: bio.agenciaignis.com.br)
    // 2. whiteLabelDomain cadastrado na organização ou no parceiro White Label
    // 3. Registro na tabela domain
    // 4. NEXT_PUBLIC_APP_URL padrão
    const customDomain =
      (isNonDefaultHost ? cleanReqHost : null) ||
      org?.whiteLabelDomain ||
      org?.whiteLabelParent?.whiteLabelDomain ||
      domain?.domain ||
      (cleanReqHost && !cleanReqHost.includes("localhost") ? cleanReqHost : null);

    let targetUrl: string;

    if (customDomain) {
      const cleanCustomDomain = customDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      targetUrl = `https://${cleanCustomDomain}/p/${pageSlug}`;
    } else {
      const configuredUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
      targetUrl = `${configuredUrl}/p/${pageSlug}`;
    }

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 500,
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
      brandName: org?.tradeName || org?.name || "Minha Empresa",
    });
  } catch (error: any) {
    console.error("Erro ao gerar QR Code:", error);
    return NextResponse.json({ error: "Erro ao gerar QR Code" }, { status: 500 });
  }
}
