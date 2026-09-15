import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { APP_VENDOR } from "@/lib/app-meta";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");
    const cookieRef = req.cookies.get("pajotree_wl_ref")?.value;
    const effectiveRef = ref || cookieRef;
    const host = req.headers.get("host") || "";
    const cleanHost = host.split(":")[0].toLowerCase();

    let organization: any = null;

    // 1. Busca por parâmetro de indicação / referência direta ou cookie de sessão WL
    if (effectiveRef) {
      organization = await db.organization.findFirst({
        where: {
          OR: [
            { id: effectiveRef },
            { name: { equals: effectiveRef, mode: "insensitive" } },
            { tradeName: { equals: effectiveRef, mode: "insensitive" } },
            { whiteLabelDomain: { equals: effectiveRef, mode: "insensitive" } },
          ],
        },
        include: {
          whiteLabelParent: true,
          pages: {
            where: { status: "PUBLISHED" },
            take: 1,
            include: { settings: true },
          },
        },
      });
    }

    // 2. Busca por domínio personalizado (Host header ou x-custom-host)
    const customHost = req.headers.get("x-custom-host") || cleanHost;
    const withoutWww = customHost.replace(/^www\./, "");

    if (!organization && customHost && !customHost.includes("localhost") && !customHost.includes("pajotree") && !customHost.includes("pajotech") && !customHost.includes("127.0.0.1") && !customHost.includes("vercel.app")) {
      // 2.1 Verifica se o domínio está cadastrado diretamente no campo whiteLabelDomain da Organização
      organization = await db.organization.findFirst({
        where: {
          OR: [
            { whiteLabelDomain: customHost },
            { whiteLabelDomain: withoutWww },
          ],
        },
        include: {
          whiteLabelParent: true,
          pages: {
            where: { status: "PUBLISHED" },
            take: 1,
            include: { settings: true },
          },
        },
      });

      // 2.2 Se não encontrado, verifica na tabela de Domínios (Domain)
      if (!organization) {
        const domainRecord = await db.domain.findFirst({
          where: {
            OR: [
              { domain: customHost },
              { domain: withoutWww },
            ],
          },
          include: {
            organization: {
              include: {
                whiteLabelParent: true,
                pages: {
                  where: { status: "PUBLISHED" },
                  take: 1,
                  include: { settings: true },
                },
              },
            },
          },
        });

        if (domainRecord?.organization) {
          organization = domainRecord.organization;
        }
      }
    }

    if (organization) {
      const effectiveOrg = organization.whiteLabelParent || organization;
      const pageSettings = effectiveOrg.pages?.[0]?.settings || organization.pages?.[0]?.settings;

      const brandName = effectiveOrg.tradeName || effectiveOrg.name || "Minha Empresa";
      const logoUrl = effectiveOrg.logoUrl || null;
      const faviconUrl = pageSettings?.faviconUrl || effectiveOrg.faviconUrl || "/favicon.ico";
      const primaryColor = pageSettings?.primaryColor || "#6366f1";
      const secondaryColor = pageSettings?.secondaryColor || "#ec4899";

      return NextResponse.json({
        isWhiteLabel: true,
        brandName,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        vendorName: brandName,
        orgId: effectiveOrg.id,
      });
    }

    // Default Pajotree branding
    return NextResponse.json({
      isWhiteLabel: false,
      brandName: "Pajotree",
      logoUrl: null,
      faviconUrl: "/favicon.ico",
      primaryColor: "#6366f1",
      secondaryColor: "#ec4899",
      vendorName: APP_VENDOR,
    });
  } catch (error) {
    console.error("Erro ao resolver branding White Label:", error);
    return NextResponse.json({
      isWhiteLabel: false,
      brandName: "Pajotree",
      logoUrl: null,
      faviconUrl: "/favicon.ico",
      primaryColor: "#6366f1",
      secondaryColor: "#ec4899",
      vendorName: APP_VENDOR,
    });
  }
}
