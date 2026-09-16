import { notFound } from "next/navigation";
import { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { TrackingService } from "@/server/services/tracking.service";
import { PublicPageRenderer } from "@/components/public-page/page-renderer";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function findPageBySlug(slug: string) {
  let page = await db.page.findUnique({
    where: { slug },
    include: {
      organization: {
        include: {
          plan: { include: { features: true } },
          metaPixels: { where: { status: "ACTIVE" } },
          googleIntegrations: { where: { status: "ACTIVE" } },
          whiteLabelParent: true,
        },
      },
      settings: true,
      links: { where: { status: "ACTIVE" }, orderBy: { position: "asc" }, include: { shortLinks: true } },
      blocks: { where: { status: "ACTIVE" }, orderBy: { position: "asc" } },
    },
  });

  if (!page) {
    // Fallback: busca por slug insensível a maiúsculas/minúsculas
    page = await db.page.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" } },
      include: {
        organization: {
          include: {
            plan: { include: { features: true } },
            metaPixels: { where: { status: "ACTIVE" } },
            googleIntegrations: { where: { status: "ACTIVE" } },
            whiteLabelParent: true,
          },
        },
        settings: true,
        links: { where: { status: "ACTIVE" }, orderBy: { position: "asc" }, include: { shortLinks: true } },
        blocks: { where: { status: "ACTIVE" }, orderBy: { position: "asc" } },
      },
    });
  }

  if (!page) {
    // Fallback 2: busca por nome ou tradeName da organização
    const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, " ");
    const org = await db.organization.findFirst({
      where: {
        OR: [
          { name: { contains: normalized, mode: "insensitive" } },
          { tradeName: { contains: normalized, mode: "insensitive" } },
        ],
      },
      include: {
        pages: {
          take: 1,
          include: {
            organization: {
              include: {
                plan: { include: { features: true } },
                metaPixels: { where: { status: "ACTIVE" } },
                googleIntegrations: { where: { status: "ACTIVE" } },
                whiteLabelParent: true,
              },
            },
            settings: true,
            links: { where: { status: "ACTIVE" }, orderBy: { position: "asc" }, include: { shortLinks: true } },
            blocks: { where: { status: "ACTIVE" }, orderBy: { position: "asc" } },
          },
        },
      },
    });

    if (org?.pages?.[0]) {
      page = org.pages[0];
    }
  }

  return page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await findPageBySlug(slug);

  if (!page || page.status !== "PUBLISHED") {
    return { title: "Página não encontrada | Pajotree" };
  }

  const title = page.settings?.seoTitle || page.title || `${page.name} | Link Oficial`;
  const description = page.settings?.seoDescription || page.description || `Acesse os links oficiais e canais de contato de ${page.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: page.settings?.ogImageUrl ? [{ url: page.settings.ogImageUrl }] : undefined,
    },
    icons: { icon: page.settings?.faviconUrl || page.organization.faviconUrl || "/favicon.ico" },
  };
}

export default async function PublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sParams = await searchParams;

  const page = await findPageBySlug(slug);

  if (!page || page.status !== "PUBLISHED") notFound();

  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "";
  const referrer = headerList.get("referer") || "";

  const utmSource = typeof sParams.utm_source === "string" ? sParams.utm_source : undefined;
  const utmMedium = typeof sParams.utm_medium === "string" ? sParams.utm_medium : undefined;
  const utmCampaign = typeof sParams.utm_campaign === "string" ? sParams.utm_campaign : undefined;

  TrackingService.recordEvent({
    organizationId: page.organizationId,
    pageId: page.id,
    eventType: "PageView",
    eventName: "PageView",
    referrer,
    userAgent,
    ipAddress,
    utms: { source: utmSource, medium: utmMedium, campaign: utmCampaign },
  }).catch((e) => console.error("Erro PageView:", e));

  const defaultMetaPixel = page.organization.metaPixels.find((p) => p.isDefault) || page.organization.metaPixels[0];
  const gaIntegration = page.organization.googleIntegrations[0];

  let userCustomConfig: any = {};
  try {
    userCustomConfig = JSON.parse(page.settings?.customCss || "{}");
  } catch {}

  const canRemoveBranding = Boolean(
    page.organization.plan?.features?.[0]?.removeBranding
  );
  // Apenas remove a marca se o plano permitir E o usuário tiver ativado explicitamente a opção
  const shouldRemoveBranding = canRemoveBranding && Boolean(userCustomConfig.removeBranding);

  const displayName = page.title || page.name || page.organization.tradeName || page.organization.name;
  const isWhiteLabel = Boolean(
    page.organization.isWhiteLabel ||
    page.organization.whiteLabelParentId ||
    page.organization.whiteLabelDomain ||
    page.organization.logoUrl
  );
  const brandName = page.organization.whiteLabelParent?.tradeName ||
    page.organization.whiteLabelParent?.name ||
    (isWhiteLabel ? (page.organization.tradeName || page.organization.name) : "Pajotree");
  const brandLogoUrl = page.organization.whiteLabelParent?.logoUrl ||
    (isWhiteLabel ? page.organization.logoUrl : null);
  const brandUrl = page.organization.whiteLabelParent
    ? `/wl/${page.organization.whiteLabelParent.whiteLabelDomain || page.organization.whiteLabelParent.id}`
    : (page.organization.isWhiteLabel ? `/wl/${page.organization.whiteLabelDomain || page.organization.id}` : "/");

  const isContactFormActive = Boolean(
    (page.settings as any)?.showContactForm ?? userCustomConfig.showContactForm
  );

  const publicPage = {
    ...page,
    name: displayName,
    title: page.title || page.name,
    settings: page.settings
      ? {
          ...page.settings,
          showContactForm: isContactFormActive,
        }
      : null,
    organization: {
      ...page.organization,
      name: displayName,
      removeBranding: shouldRemoveBranding,
      brandName,
      brandLogoUrl,
      brandUrl,
    },
  };

  return (
    <>
      {defaultMetaPixel && (
        <script dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);
          t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
          (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${defaultMetaPixel.pixelId}');fbq('track', 'PageView');
        ` }} />
      )}
      {gaIntegration && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaIntegration.measurementId}`} />
          <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaIntegration.measurementId}');` }} />
        </>
      )}
      <PublicPageRenderer page={publicPage as any} />
    </>
  );
}
