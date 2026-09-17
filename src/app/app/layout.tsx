"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Palette, Link2, Users2, KanbanSquare, MessageSquare, FileText, BarChart3, QrCode, Settings, CreditCard, LogOut, ExternalLink, Zap, Menu, X, Sparkles, ChevronRight, ShieldAlert, Brush, Loader2,
} from "lucide-react";
import { APP_VERSION, APP_VENDOR } from "@/lib/app-meta";

export default function TenantAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authData, setAuthData] = useState<any>(null);
  const [newLeadsCount, setNewLeadsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }
        const data = await authRes.json();
        if (!data.authenticated) {
          router.push("/login");
          return;
        }
        setAuthData(data);

        // Carrega contagem de leads de forma independente e não-bloqueante
        try {
          const leadsRes = await fetch("/api/leads");
          if (leadsRes.ok) {
            const leadsData = await leadsRes.json();
            setNewLeadsCount(leadsData.newLeadsCount || 0);
          }
        } catch {
          // Non-blocking
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadAuth();
  }, [router, pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { label: "Dashboard", href: "/app", icon: LayoutDashboard },
    { label: "Editor Visual", href: "/app/editor", icon: Palette },
    { label: "Links & Tracking", href: "/app/links", icon: Link2 },
    { label: "Leads & Contatos", href: "/app/leads", icon: Users2, badge: newLeadsCount > 0 ? `${newLeadsCount} novo${newLeadsCount > 1 ? "s" : ""}` : null },
    { label: "CRM Kanban", href: "/app/crm", icon: KanbanSquare, badge: newLeadsCount > 0 ? "Novo" : null },
    { label: "Formulários", href: "/app/forms", icon: FileText },
    { label: "Analytics & Pixels", href: "/app/analytics", icon: BarChart3 },
    { label: "QR Codes", href: "/app/qr-code", icon: QrCode },
    { label: "Assinatura & Planos", href: "/app/billing", icon: CreditCard },
    { label: "White Label", href: "/app/settings/white-label", icon: Brush },
    { label: "Configurações", href: "/app/settings", icon: Settings },
  ];

  const organization = authData?.organization;
  const plan = authData?.planDetails?.plan?.name || "START";

  const isWhiteLabel = Boolean(
    authData?.isWhiteLabelPartner ||
    authData?.isWhiteLabelClient ||
    authData?.whiteLabelParent ||
    organization?.isWhiteLabel ||
    organization?.logoUrl
  );

  const displayLogo = authData?.whiteLabelParent?.logoUrl || organization?.logoUrl || null;
  const brandName = authData?.whiteLabelParent?.tradeName || authData?.whiteLabelParent?.name || (isWhiteLabel ? (organization?.tradeName || organization?.name) : "Pajotree") || "Pajotree";
  const subTitle = authData?.whiteLabelParent ? (organization?.name || "Minha Empresa") : (isWhiteLabel ? "Painel da Empresa" : (organization?.name || "Minha Empresa"));
  const vendorCredit = isWhiteLabel ? brandName : APP_VENDOR;

  const pageTitleMap: Record<string, string> = {
    "/app": "Painel de Gestão",
    "/app/editor": "Editor Visual",
    "/app/links": "Links & Tracking",
    "/app/leads": "Leads & Contatos",
    "/app/crm": "CRM Kanban",
    "/app/forms": "Formulários",
    "/app/analytics": "Analytics & Pixels",
    "/app/qr-code": "QR Codes",
    "/app/billing": "Assinatura & Planos",
    "/app/settings/white-label": "Gerenciamento White Label",
    "/app/settings": "Configurações da Empresa",
  };

  useEffect(() => {
    if (brandName) {
      const section = pageTitleMap[pathname] || "Painel";
      document.title = `${brandName} - ${section}`;
    }
  }, [brandName, pathname]);

  useEffect(() => {
    if (displayLogo) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = displayLogo;
    }
  }, [displayLogo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <span className="text-xs text-slate-500 font-medium">Carregando painel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-x-clip font-sans">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden" aria-hidden="true" />}

      <aside className={`fixed inset-y-0 left-0 w-64 max-w-[85vw] bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 shadow-sm ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="min-h-0">
          <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-slate-100">
            <Link href="/app" className="flex items-center gap-2.5 min-w-0" title={brandName}>
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={brandName}
                  className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 shrink-0"
                />
              ) : isWhiteLabel ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
                  {brandName?.charAt(0)?.toUpperCase() || "E"}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200 shrink-0">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
              )}
              <div className="leading-tight min-w-0">
                <span className="font-extrabold text-base tracking-tight text-slate-900 block truncate">
                  {brandName}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block truncate max-w-[130px]">
                  {subTitle}
                </span>
              </div>
            </Link>
            <button type="button" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} className="lg:hidden min-h-11 min-w-11 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
          </div>

          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-210px)]" aria-label="Navegação principal">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`min-h-10 flex items-center justify-between px-3 rounded-lg text-xs font-medium transition ${
                    active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <Link href="/app/billing" className="min-h-10 flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition group">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Plano {plan}</span>
                <span className="text-[10px] text-slate-400">Ver cotas e limites</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
          </Link>
          <div className="flex items-center justify-between gap-2 p-1 text-xs">
            <div className="truncate max-w-[150px] min-w-0">
              <span className="text-slate-800 font-semibold block truncate text-xs">{authData?.user?.name}</span>
              <span className="text-slate-400 text-[10px] block truncate">{authData?.user?.email}</span>
              <span className="text-slate-400 text-[9px] block mt-0.5">v{APP_VERSION} • By {vendorCredit}</span>
            </div>
            <button type="button" onClick={handleLogout} title="Sair da Conta" aria-label="Sair da Conta" className="min-h-10 min-w-10 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center cursor-pointer"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="min-h-14 px-3 sm:px-6 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)} className="lg:hidden min-h-10 min-w-10 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center"><Menu className="w-5 h-5" /></button>
            <h1 className="text-xs font-bold text-slate-800 hidden sm:block truncate">{organization?.name || "Painel de Controle"}</h1>
            
            {/* White Label Partner Signal */}
            {authData?.isWhiteLabelPartner && (
              <Link
                href="/app/settings/white-label"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
                title="Configurar Pagamentos, Planos e Marca White Label"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span>Modo White Label: <strong className="text-slate-900">{organization?.tradeName || organization?.name}</strong></span>
              </Link>
            )}

            {/* White Label Client Signal */}
            {authData?.isWhiteLabelClient && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span>Ambiente: <strong className="text-slate-900">{authData?.whiteLabelParent?.tradeName || authData?.whiteLabelParent?.name}</strong></span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 max-w-full">
            {newLeadsCount > 0 && (
              <Link
                href="/app/leads"
                className="min-h-10 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium hover:bg-emerald-100 transition flex items-center gap-1.5 whitespace-nowrap"
                title={`${newLeadsCount} novos leads aguardando atendimento`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>{newLeadsCount} {newLeadsCount === 1 ? "Novo Lead" : "Novos Leads"}</span>
              </Link>
            )}
            {authData?.isSuperAdmin && <Link href="/admin" className="min-h-10 px-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-200 transition flex items-center gap-1.5 whitespace-nowrap"><ShieldAlert className="w-3.5 h-3.5 text-slate-600" /><span className="hidden xs:inline">Painel Mestre</span><span className="sm:hidden">Mestre</span></Link>}
            {(() => {
              const effectiveCustomDomain = authData?.customDomain || organization?.whiteLabelDomain || authData?.whiteLabelParent?.whiteLabelDomain;
              const rawName = organization?.name || "minha-empresa";
              const pageSlug = authData?.pageSlug || String(rawName).toLowerCase().replace(/[^a-z0-9]/g, "-");
              const publicPageUrl = effectiveCustomDomain
                ? `https://${String(effectiveCustomDomain).replace(/^https?:\/\//, "").replace(/\/+$/, "")}/p/${pageSlug}`
                : `/p/${pageSlug}`;

              return (
                <Link
                  href={publicPageUrl}
                  target="_blank"
                  className="min-h-10 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <span className="hidden sm:inline">Ver Minha Página</span>
                  <span className="sm:hidden">Minha Página</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              );
            })()}
          </div>

        </header>
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
