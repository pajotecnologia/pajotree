"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  CreditCard,
  ArrowLeft,
  Menu,
  X,
  Loader2,
} from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkSuperAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data.isSuperAdmin) {
          router.push("/app");
          return;
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkSuperAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Validando privilégios de Super Admin...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Visão Geral Global", href: "/admin", icon: LayoutDashboard },
    { label: "Gestão de Empresas", href: "/admin/organizations", icon: Building2 },
    { label: "Planos & Recursos", href: "/app/billing", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-x-clip font-sans">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 max-w-[85vw] bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 shadow-sm ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="min-h-0">
          <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-slate-100">
            <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center shadow-xs shrink-0">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight min-w-0">
                <span className="font-extrabold text-base tracking-tight text-slate-900 block">
                  PAINEL <span className="text-amber-600">MESTRE</span>
                </span>
                <span className="text-[10px] text-amber-700 font-semibold tracking-wider">
                  Super Administrador
                </span>
              </div>
            </Link>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden min-h-11 min-w-11 p-2 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1" aria-label="Navegação administrativa">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`min-h-11 flex items-center gap-3 px-3.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? "bg-amber-50 text-amber-900 border border-amber-200 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-100">
          <Link
            href="/app"
            className="min-h-11 w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 transition shadow-2xs text-center"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Voltar ao Painel da Empresa</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="min-h-16 px-3 sm:px-6 py-2 border-b border-slate-200 bg-white flex items-center gap-3 shrink-0 sticky top-0 z-30 shadow-2xs">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden min-h-11 min-w-11 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="min-w-0 truncate text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-widest bg-amber-50 border border-amber-200 px-2.5 py-2 rounded-lg">
            Ambiente de Gestão Global
          </span>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
