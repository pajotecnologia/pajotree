"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  MousePointerClick,
  Users2,
  TrendingUp,
  MessageCircle,
  ExternalLink,
  Plus,
  ArrowUpRight,
  Sparkles,
  KanbanSquare,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white border border-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    pageViews: 0,
    linkClicks: 0,
    leads: 0,
    customers: 0,
    conversionRate: "0.0%",
  };

  const statCards = [
    {
      title: "Visualizações da Página",
      value: metrics.pageViews,
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
    },
    {
      title: "Cliques em Links",
      value: metrics.linkClicks,
      icon: MousePointerClick,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
    },
    {
      title: "Leads Capturados",
      value: metrics.leads,
      icon: Users2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      title: "Taxa de Conversão",
      value: metrics.conversionRate,
      icon: TrendingUp,
      color: "text-pink-600",
      bg: "bg-pink-50 border-pink-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Visão Geral do Seu Negócio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a atração, retenção e conversão dos seus canais em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/links"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Link</span>
          </Link>
          <Link
            href={`/p/${data?.pageSlug || "minha-empresa"}`}
            target="_blank"
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>Ver Bio</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">
                  {stat.title}
                </span>
                <div className={`p-2 rounded-xl border ${stat.bg}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Recent Leads & Top Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Leads Recentes Capturados
              </h3>
            </div>
            <Link
              href="/app/crm"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <span>Abrir CRM Kanban</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data?.recentLeads && data.recentLeads.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentLeads.map((lead: any) => (
                <div
                  key={lead.id}
                  className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">
                        {lead.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {lead.email || lead.phone || lead.whatsapp || "Sem contato"} &bull; {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                      {lead.status}
                    </span>
                    {lead.whatsapp && (
                      <a
                        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition"
                        title="Chamar no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhum lead capturado ainda. Compartilhe sua página para começar!
            </div>
          )}
        </div>

        {/* Top Clicked Links (1 col) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Links Mais Clicados
              </h3>
            </div>
            <Link
              href="/app/links"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Gerenciar
            </Link>
          </div>

          {data?.topLinks && data.topLinks.length > 0 ? (
            <div className="space-y-2.5">
              {data.topLinks.map((link: any, idx: number) => (
                <div
                  key={link.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-xs text-slate-800 truncate max-w-[130px]">
                      {link.title}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-indigo-600 block">
                      {link.clicks}
                    </span>
                    <span className="text-[9px] text-slate-400">cliques</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhum clique registrado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
