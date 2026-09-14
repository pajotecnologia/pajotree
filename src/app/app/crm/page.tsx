"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  KanbanSquare,
  Plus,
  Lock,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
} from "lucide-react";

export default function CrmPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [crmLocked, setCrmLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadPipeline() {
    try {
      const res = await fetch("/api/crm/pipeline");
      const json = await res.json();
      if (!res.ok && json.crmLocked) {
        setCrmLocked(true);
      } else if (res.ok) {
        setPipeline(json.pipeline);
      }
    } catch (err) {
      console.error("Erro ao carregar CRM:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPipeline();
  }, []);

  const handleMoveStage = async (opportunityId: string, currentStageId: string, direction: "next" | "prev") => {
    if (!pipeline?.stages) return;
    const currentIdx = pipeline.stages.findIndex((s: any) => s.id === currentStageId);
    if (currentIdx === -1) return;

    const newIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= pipeline.stages.length) return;

    const targetStageId = pipeline.stages[newIdx].id;

    try {
      const res = await fetch("/api/crm/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          newStageId: targetStageId,
        }),
      });

      if (res.ok) {
        await loadPipeline();
      }
    } catch (err) {
      console.error("Erro ao mover oportunidade:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (crmLocked) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Desbloqueie o Funil de Vendas CRM
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            O recurso de CRM Kanban visual está disponível a partir do plano START. Gerencie oportunidades, acompanhe negociações e aumente a conversão dos seus leads.
          </p>
        </div>
        <Link
          href="/app/billing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Fazer Upgrade Agora</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const stages = pipeline?.stages || [];

  return (
    <div className="space-y-6 h-[calc(100vh-130px)] flex flex-col">
      {/* CRM Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pipeline CRM & Funil de Vendas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie cada lead do primeiro contato até o fechamento com visão Kanban.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/leads"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs"
          >
            Ver Tabela de Leads
          </Link>
        </div>
      </div>

      {/* Kanban Board Container with horizontal scroll */}
      <div className="flex-1 overflow-x-auto pb-4 flex gap-4 min-h-0 items-start">
        {stages.map((stage: any, sIdx: number) => {
          const count = stage.opportunities?.length || 0;

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col max-h-full"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    style={{ backgroundColor: stage.color }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                  <h3 className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                    {stage.name}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-600 shadow-2xs">
                  {count}
                </span>
              </div>

              {/* Cards List with vertical scroll */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {stage.opportunities && stage.opportunities.length > 0 ? (
                  stage.opportunities.map((opp: any) => (
                    <div
                      key={opp.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition shadow-2xs space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 line-clamp-2">
                          {opp.title}
                        </span>
                        {opp.lead?.whatsapp && (
                          <a
                            href={`https://wa.me/${opp.lead.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition shrink-0"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {opp.lead && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{opp.lead.name}</span>
                        </div>
                      )}

                      {/* Move Stage Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <button
                          onClick={() => handleMoveStage(opp.id, stage.id, "prev")}
                          disabled={sIdx === 0}
                          className="p-1 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition"
                          title="Mover para etapa anterior"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span>{new Date(opp.createdAt).toLocaleDateString("pt-BR")}</span>
                        <button
                          onClick={() => handleMoveStage(opp.id, stage.id, "next")}
                          disabled={sIdx === stages.length - 1}
                          className="p-1 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition"
                          title="Avançar etapa"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                    Nenhum lead nesta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
