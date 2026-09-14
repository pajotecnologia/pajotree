"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  Link2,
  Users2,
  KanbanSquare,
  MessageSquare,
  FileText,
  BarChart3,
  QrCode,
  Settings,
  CreditCard,
  LogOut,
  ExternalLink,
  Zap,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Brush,
} from "lucide-react";

export default function TenantAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          router.push("/login");
          return;
        }
        setAuthData(data);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadAuth();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { label: "Dashboard", href: "/app", icon: LayoutDashboard },
    { label: "Editor Visual", href: "/app/editor", icon: Palette },
    { label: "Links & Tracking", href: "/app/links", icon: Link2 },
    { label: "Leads & Contatos", href: "/app/leads", icon: Users2 },
    { label: "CRM Kanban", href: "/app/crm", icon: KanbanSquare },
    { label: "WhatsApp & Inbox", href: "/app/whatsapp", icon: MessageSquare },
    { label: "Formulários", href: "/app/forms", icon: FileText },
    { label: "Analytics & Pixels", href: "/app/analytics", icon: BarChart3 },
    { label: "QR Codes", href: "/app/qr-code", icon: QrCode },
    { label: "Assinatura & Planos", href: "/app/billing", icon: CreditCard },
    { label: "White Label", href: "/app/settings/white-label", icon: Brush },
    { label: "Configurações", href: "/app/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 animate-pulse flex items-center justify-center shadow-md shadow-indigo-100">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs text-slate-500 font-medium">Carregando painel...</span>
        </div>
      </div>
    );
  }

  const organization = authData?.organization;
  const plan = authData?.planDetails?.plan?.name || "START";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 shadow-sm ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
            <Link href="/app" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200"><Zap className="w-4 h-4 text-white fill-white" /></div>
              <div className="leading-tight">
                <span className="font-extrabold text-base tracking-tight text-slate-900 block">Pajo<span className="text-indigo-600">tree</span></span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block truncate max-w-[130px]">{organization?.name || "Minha Empresa"}</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-5 h-5" /></button>
          </div>

          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}><Icon className={`w-4 h-4 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`} /><span>{item.label}</span></Link>;
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <Link href="/app/billing" className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100/80 hover:bg-indigo-100/70 transition group">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition" /><div><span className="text-[11px] font-bold text-indigo-900 block">Plano {plan}</span><span className="text-[9px] text-indigo-600">Ver limites & cotas</span></div></div>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition" />
          </Link>
          <div className="flex items-center justify-between p-1.5 text-xs">
            <div className="truncate max-w-[150px]"><span className="text-slate-800 font-semibold block truncate text-xs">{authData?.user?.name}</span><span className="text-slate-400 text-[10px] block truncate">{authData?.user?.email}</span></div>
            <button onClick={handleLogout} title="Sair da Conta" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 px-4 sm:px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"><Menu className="w-5 h-5" /></button><h1 className="text-sm font-bold text-slate-800 hidden sm:block">{organization?.name || "Painel de Controle"}</h1></div>
          <div className="flex items-center gap-3">
            {authData?.isSuperAdmin && <Link href="/admin" className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-amber-600" /><span>Painel Mestre</span></Link>}
            <Link href={`/p/${organization?.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "minha-empresa"}`} target="_blank" className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition flex items-center gap-1.5"><span>Ver Minha Página</span><ExternalLink className="w-3.5 h-3.5 text-indigo-600" /></Link>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
