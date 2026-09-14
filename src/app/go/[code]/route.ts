import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TrackingService } from "@/server/services/tracking.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const url = new URL(request.url);

  try {
    const shortLink = await db.shortLink.findUnique({
      where: { code },
      include: {
        link: {
          include: {
            trackingConfig: true,
          },
        },
      },
    });

    if (!shortLink || shortLink.status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Extrair parâmetros de rastreamento e headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");
    const utmContent = url.searchParams.get("utm_content");
    const utmTerm = url.searchParams.get("utm_term");

    // Registro Assíncrono sem travar a resposta
    TrackingService.recordEvent({
      organizationId: shortLink.organizationId,
      linkId: shortLink.linkId,
      eventType: "LinkClick",
      eventName: shortLink.link?.trackingConfig?.eventName || "LinkClick",
      referrer,
      userAgent,
      ipAddress,
      utms: {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        content: utmContent,
        term: utmTerm,
      },
    }).catch((e) => console.error("Falha no tracking assíncrono:", e));

    // Montar URL de destino preservando UTMs
    let destination = shortLink.destinationUrl;
    try {
      const destUrl = new URL(destination);
      url.searchParams.forEach((value, key) => {
        if (!destUrl.searchParams.has(key)) {
          destUrl.searchParams.set(key, value);
        }
      });
      destination = destUrl.toString();
    } catch {
      // Se não for URL absoluta com protocolo, mantém o padrão
    }

    return NextResponse.redirect(destination, {
      status: 307,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Erro no redirecionamento /go:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
