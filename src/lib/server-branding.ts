import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/db-migrate";
import { APP_VENDOR } from "@/lib/app-meta";
import { cookies, headers } from "next/headers";

export interface ServerBranding {
  isWhiteLabel: boolean;
  brandName: string;
  logoUrl: string | null;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  vendorName: string;
  orgId?: string;
  loading: boolean;
}

export async function getServerBranding(refParam?: string): Promise<ServerBranding> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieRef = cookieStore.get("pajotree_wl_ref")?.value;
  const effectiveRef = refParam || cookieRef;
  const host = headerStore.get("x-custom-host") || headerStore.get("host") || "";
  const cleanHost = host.split(":")[0].toLowerCase().trim();
  const withoutWww = cleanHost.replace(/^www\./, "");

  try {
    await ensureDatabaseSchema();
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

    // 2. Busca por domínio personalizado (Host header)
    if (
      !organization &&
      cleanHost &&
      !cleanHost.includes("localhost") &&
      !cleanHost.includes("pajotree") &&
      !cleanHost.includes("pajotech") &&
      !cleanHost.includes("127.0.0.1") &&
      !cleanHost.includes("vercel.app")
    ) {
      organization = await db.organization.findFirst({
        where: {
          OR: [
            { whiteLabelDomain: cleanHost },
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

      if (!organization) {
        const domainRecord = await db.domain.findFirst({
          where: {
            OR: [
              { domain: cleanHost },
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
      return {
        isWhiteLabel: true,
        brandName,
        logoUrl: effectiveOrg.logoUrl || null,
        faviconUrl: pageSettings?.faviconUrl || effectiveOrg.faviconUrl || "/favicon.ico",
        primaryColor: pageSettings?.primaryColor || "#6366f1",
        secondaryColor: pageSettings?.secondaryColor || "#ec4899",
        vendorName: brandName,
        orgId: effectiveOrg.id,
        loading: false,
      };
    }
  } catch (error) {
    console.error("Erro ao carregar server branding:", error);
  }

  return {
    isWhiteLabel: false,
    brandName: "Pajotree",
    logoUrl: null,
    faviconUrl: "/favicon.ico",
    primaryColor: "#6366f1",
    secondaryColor: "#ec4899",
    vendorName: APP_VENDOR,
    loading: false,
  };
}
