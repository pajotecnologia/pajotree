"use client";

import { useEffect, useState } from "react";
import { APP_VENDOR } from "@/lib/app-meta";

export interface BrandingInfo {
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

const DEFAULT_BRANDING: BrandingInfo = {
  isWhiteLabel: false,
  brandName: "Pajotree",
  logoUrl: null,
  faviconUrl: "/favicon.ico",
  primaryColor: "#6366f1",
  secondaryColor: "#ec4899",
  vendorName: APP_VENDOR,
  loading: true,
};

export function useBranding(initialBranding?: Partial<BrandingInfo>): BrandingInfo {
  const [branding, setBranding] = useState<BrandingInfo>(() => ({
    ...DEFAULT_BRANDING,
    ...initialBranding,
    loading: initialBranding ? Boolean(initialBranding.loading ?? false) : true,
  }));

  useEffect(() => {
    let isMounted = true;
    async function loadBranding() {
      try {
        let ref = "";
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          ref = params.get("ref") || "";
        }

        const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
        const res = await fetch(`/api/white-label/branding${query}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setBranding({
            isWhiteLabel: Boolean(data.isWhiteLabel),
            brandName: data.brandName || "Pajotree",
            logoUrl: data.logoUrl || null,
            faviconUrl: data.faviconUrl || "/favicon.ico",
            primaryColor: data.primaryColor || "#6366f1",
            secondaryColor: data.secondaryColor || "#ec4899",
            vendorName: data.vendorName || (data.isWhiteLabel ? data.brandName : APP_VENDOR),
            orgId: data.orgId,
            loading: false,
          });
          return;
        }
      } catch (err) {
        console.error("Erro ao carregar branding:", err);
      }
      if (isMounted) {
        setBranding((prev) => ({ ...prev, loading: false }));
      }
    }

    loadBranding();
    return () => {
      isMounted = false;
    };
  }, []);

  return branding;
}
