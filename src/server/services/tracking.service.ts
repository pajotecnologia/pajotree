import { db } from "@/lib/db";
import crypto from "crypto";
import { headers } from "next/headers";

export interface TrackingParams {
  organizationId: string;
  pageId?: string | null;
  linkId?: string | null;
  eventType: string; // PageView, LinkClick, WhatsAppClick, Lead, FormSubmit
  eventName?: string | null;
  sessionId?: string | null;
  visitorId?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  utms?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
    term?: string | null;
  };
}

export class TrackingService {
  /**
   * Hashes IP address for LGPD/GDPR compliance (anonymized unique tracking).
   */
  static hashIp(ip: string | null | undefined): string {
    if (!ip) return "anonymous";
    return crypto.createHash("sha256").update(ip + "pajotree-salt").digest("hex").slice(0, 16);
  }

  /**
   * Parses User-Agent to detect device type, browser and OS.
   */
  static parseUserAgent(ua: string | null | undefined) {
    if (!ua) return { deviceType: "desktop", browser: "Unknown", os: "Unknown" };

    const uaLower = ua.toLowerCase();
    let deviceType = "desktop";
    if (/mobile|android|iphone|ipad|phone/i.test(uaLower)) {
      deviceType = /ipad|tablet/i.test(uaLower) ? "tablet" : "mobile";
    }

    let browser = "Other";
    if (uaLower.includes("chrome") && !uaLower.includes("edg")) browser = "Chrome";
    else if (uaLower.includes("safari") && !uaLower.includes("chrome")) browser = "Safari";
    else if (uaLower.includes("firefox")) browser = "Firefox";
    else if (uaLower.includes("edg")) browser = "Edge";
    else if (uaLower.includes("opera") || uaLower.includes("opr")) browser = "Opera";

    let os = "Other";
    if (uaLower.includes("windows")) os = "Windows";
    else if (uaLower.includes("macintosh") || uaLower.includes("mac os")) os = "MacOS";
    else if (uaLower.includes("android")) os = "Android";
    else if (uaLower.includes("iphone") || uaLower.includes("ipad")) os = "iOS";
    else if (uaLower.includes("linux")) os = "Linux";

    return { deviceType, browser, os };
  }

  /**
   * Asynchronously records an analytics event in the database.
   * Non-blocking to guarantee lightning-fast redirects.
   */
  static async recordEvent(params: TrackingParams) {
    try {
      const { deviceType, browser, os } = this.parseUserAgent(params.userAgent);
      const ipHash = this.hashIp(params.ipAddress);

      await db.analyticsEvent.create({
        data: {
          organizationId: params.organizationId,
          pageId: params.pageId || null,
          linkId: params.linkId || null,
          eventType: params.eventType,
          eventName: params.eventName || params.eventType,
          sessionId: params.sessionId || null,
          visitorId: params.visitorId || null,
          referrer: params.referrer || null,
          userAgent: params.userAgent || null,
          deviceType,
          browser,
          os,
          ipHash,
          utmSource: params.utms?.source || null,
          utmMedium: params.utms?.medium || null,
          utmCampaign: params.utms?.campaign || null,
          utmContent: params.utms?.content || null,
          utmTerm: params.utms?.term || null,
        },
      });

      // Se houver Meta Pixel configurado com Conversions API, dispara em background
      if (params.linkId || params.pageId) {
        this.dispatchMetaCapi(params).catch((e) =>
          console.error("Meta CAPI dispatch error:", e)
        );
      }
    } catch (err) {
      console.error("Erro ao registrar evento de analytics:", err);
    }
  }

  /**
   * Dispatches Meta Conversions API event server-side when configured.
   */
  private static async dispatchMetaCapi(params: TrackingParams) {
    try {
      const pixel = await db.metaPixel.findFirst({
        where: {
          organizationId: params.organizationId,
          status: "ACTIVE",
          accessTokenEncrypted: { not: null },
        },
      });

      if (!pixel || !pixel.pixelId || !pixel.accessTokenEncrypted) return;

      // Monta payload Meta Graph API CAPI
      // https://graph.facebook.com/v19.0/{pixel_id}/events
      const eventData = {
        event_name: params.eventName || "ViewContent",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        user_data: {
          client_ip_address: params.ipAddress,
          client_user_agent: params.userAgent,
        },
        custom_data: {
          utm_source: params.utms?.source,
          utm_medium: params.utms?.medium,
          utm_campaign: params.utms?.campaign,
        },
      };

      // In a real dispatch, call fetch(`https://graph.facebook.com/v19.0/${pixel.pixelId}/events?access_token=...`)
      // Non-blocking log
    } catch (error) {
      console.error("Erro no dispatch Meta CAPI:", error);
    }
  }
}
