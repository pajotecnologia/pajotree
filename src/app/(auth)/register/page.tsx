import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getServerBranding } from "@/lib/server-branding";
import { RegisterForm } from "./register-form";

interface PageProps {
  searchParams: Promise<{ ref?: string; planId?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { ref } = await searchParams;
  const branding = await getServerBranding(ref);

  return {
    title: branding.isWhiteLabel ? `${branding.brandName} - Criar Conta` : "Pajotree - Crie sua conta profissional",
    description: branding.isWhiteLabel
      ? `Junte-se a ${branding.brandName} e crie sua conta profissional`
      : "Comece agora com 14 dias de teste grátis no plano PRO",
    icons: branding.faviconUrl ? [{ rel: "icon", url: branding.faviconUrl }] : undefined,
  };
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const { ref, planId } = await searchParams;
  const initialBranding = await getServerBranding(ref);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <Suspense
        fallback={
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          </div>
        }
      >
        <RegisterForm initialBranding={initialBranding} planId={planId} />
      </Suspense>
    </div>
  );
}
