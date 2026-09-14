"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Link2,
  ShieldCheck,
  History,
  Loader2,
  ArrowUpRight,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch("/api/admin/metrics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Erro ao carregar métricas admin:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalOrgs: 0,
    activeOrgs: 0,
    trialOrgs: 0,
    suspendedOrgs: 0,
    totalUsers: 0,
    totalLeads: 0,
    totalLinks: 0,
    totalWhatsapp: 0,
    mrr: "R$ 0,00",
    arr: "R$ 0,00",
  };

  const statCards = [
    { title: "MRR (Receita Mensal)", value: metrics.mrr, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
    { title: "ARR (Projeção Anual)", value: metrics.arr, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50 text-indigo-600" },
    { title: "Total de Empresas", value: metrics.totalOrgs, icon: Building2, color: "text-amber-600", bg: "bg-amber-50 text-amber-600" },
    { title: "Empresas em Trial", value: metrics.trialOrgs, icon: Users, color: "text-cyan-600", bg: "bg-cyan-50 text-cyan-600" },
    { title: "WhatsApps Conectados", value: metrics.totalWhatsapp, icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
    { title: "Total de Leads no SaaS", value: metrics.totalLeads, icon: Users, color: "text-purple-600", bg: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Painel Mestre — Métricas Globais
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Visão consolidada de todas as organizações, faturamento recorrente e auditoria do SaaS.
        </p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">{stat.title}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent System Audit Logs */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Últimos Registros de Auditoria</h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
            data.recentAuditLogs.map((log: any) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="text-slate-900 font-semibold">
                      {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ""}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Org: {log.organization?.name || "Global"} &bull; Usuário: {log.user?.email || "Sistema"}
                  </span>
                </div>
                <span className="text-slate-400 text-[10px]">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhum evento registrado recentemente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
