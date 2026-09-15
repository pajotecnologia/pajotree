import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getServerBranding } from "@/lib/server-branding";
import { LoginForm } from "./login-form";

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { ref } = await searchParams;
  const branding = await getServerBranding(ref);

  return {
    title: branding.isWhiteLabel ? `${branding.brandName} - Acesso ao Painel` : "Pajotree - Acesse sua conta",
    description: branding.isWhiteLabel
      ? `Painel de gerenciamento exclusivo de ${branding.brandName}`
      : "Gerencie sua página, leads, WhatsApp e CRM",
    icons: branding.faviconUrl ? [{ rel: "icon", url: branding.faviconUrl }] : undefined,
  };
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { ref } = await searchParams;
  const initialBranding = await getServerBranding(ref);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <Suspense
        fallback={
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          </div>
        }
      >
        <LoginForm initialBranding={initialBranding} />
      </Suspense>
    </div>
  );
}
