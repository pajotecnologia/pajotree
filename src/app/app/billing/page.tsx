"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

type BillingCycle = "monthly" | "yearly";

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  priceMonthly: number | string;
  priceYearly: number | string;
  features?: Array<{
    maxLinks?: number;
    maxLeads?: number;
    maxMetaPixels?: number;
    maxAutomations?: number;
  }>;
};

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bolepix modal state
  const [bolepixData, setBolepixData] = useState<any>(null);
  const [generatingBolepix, setGeneratingBolepix] = useState(false);
  const [copiedLinha, setCopiedLinha] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  async function loadBilling() {
    try {
      const res = await fetch("/api/billing", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível carregar os planos.");
      setData(json);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao carregar faturamento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBilling();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setSelectedPlan(plan);
  };

  const handleGenerateBolepix = async () => {
    if (!selectedPlan) return;
    setGeneratingBolepix(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "emit_bolepix",
          planId: selectedPlan.id,
          billingCycle,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao emitir cobrança Banco Inter.");
      setSelectedPlan(null);
      setBolepixData(json);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao gerar Bolepix.");
    } finally {
      setGeneratingBolepix(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;

    setUpgradingId(selectedPlan.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, billingCycle }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível concluir o upgrade.");

      setSelectedPlan(null);
      setSuccessMsg(`Upgrade para ${selectedPlan.name} realizado com sucesso. Seus novos limites já estão disponíveis.`);
      await loadBilling();
      window.setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao processar upgrade.");
    } finally {
      setUpgradingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const currentPlan = data?.planAndUsage?.plan;
  const usage = data?.planAndUsage?.usage;
  const features = data?.planAndUsage?.features;
  const subscription = data?.subscription;
  const currentPlanPrice = Number(
    billingCycle === "yearly" ? currentPlan?.priceYearly : currentPlan?.priceMonthly
  ) || 0;

  const plans = (data?.allPlans || []) as Plan[];
  const upgradePlans = plans.filter((plan) => {
    if (plan.id === currentPlan?.id) return false;
    const price = Number(billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly) || 0;
    return price > currentPlanPrice;
  });

  const isTrial = subscription?.status === "TRIAL";

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assinatura & Planos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Faça upgrade quando precisar de mais recursos, limites e possibilidades para sua página.
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              billingCycle === "monthly"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              billingCycle === "yearly"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Anual
            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full border border-emerald-200">
              -20%
            </span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {data?.isSuperAdmin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
              👑 Acesso Master / Super Administrador
            </span>
            <p className="text-xs text-amber-800/90">
              Sua conta possui acesso irrestrito e limites ilimitados em todos os módulos. Para criar ou precificar os planos oferecidos aos clientes, acesse a gestão de planos.
            </p>
          </div>
          <a
            href="/admin/plans"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-xs transition text-center"
          >
            Gerenciar Planos do SaaS
          </a>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-base text-slate-900">
                  Plano Atual: {data?.isSuperAdmin ? "MASTER (Super Admin)" : currentPlan?.name || "FREE"}
                </span>
                {isTrial && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase">
                    Período de Teste
                  </span>
                )}
                {data?.isSuperAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase">
                    Ilimitado
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 block mt-0.5">
                {data?.isSuperAdmin
                  ? "Acesso mestre com cotas e ferramentas liberadas sem restrição."
                  : currentPlan?.description || "Acesso aos recursos essenciais."}
              </span>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-indigo-500 hidden sm:block" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
          {[
            ["Links Criados", usage?.linksCount || 0, data?.isSuperAdmin ? "Ilimitado" : features?.maxLinks, "bg-indigo-600"],
            ["Leads Capturados", usage?.leadsCount || 0, data?.isSuperAdmin ? "Ilimitado" : features?.maxLeads, "bg-emerald-600"],
            ["Meta Pixels", usage?.metaPixelsCount || 0, data?.isSuperAdmin ? "Ilimitado" : features?.maxMetaPixels, "bg-pink-600"],
            ["Automações", usage?.automationsCount || 0, data?.isSuperAdmin ? "Ilimitado" : features?.maxAutomations, "bg-blue-600"],
          ].map(([label, used, max, barClass]) => {
            const numericMax = Number(max) || 1;
            const percentage = data?.isSuperAdmin ? 100 : Math.min((Number(used) / numericMax) * 100, 100);
            return (
              <div key={String(label)} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs gap-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-bold text-slate-900">{used} / {max}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div style={{ width: `${percentage}%` }} className={`h-full ${barClass}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Faça upgrade do seu plano</h3>
            <p className="text-xs text-slate-500 mt-1">Escolha um plano superior e libere os novos recursos.</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {upgradePlans.length} {upgradePlans.length === 1 ? "opção disponível" : "opções disponíveis"}
          </span>
        </div>

        {upgradePlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upgradePlans.map((plan) => {
              const pFeatures = plan.features?.[0];
              const price = Number(billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly) || 0;
              const isUpgrading = upgradingId === plan.id;

              return (
                <div
                  key={plan.id}
                  className="p-6 rounded-2xl flex flex-col justify-between bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-base text-slate-900">{plan.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-100">
                        UPGRADE
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4 min-h-[32px]">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {price === 0 ? "Grátis" : `R$ ${price.toFixed(2).replace(".", ",")}`}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">{billingCycle === "yearly" ? "/ano" : "/mês"}</span>
                    </div>

                    <div className="space-y-2.5 mb-6 text-xs text-slate-700">
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Até {pFeatures?.maxLinks} Links com Tracking</span></div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>{pFeatures?.maxLeads} Leads no CRM</span></div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>{pFeatures?.maxMetaPixels} Meta Pixels</span></div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Domínio Próprio & SSL</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={Boolean(upgradingId)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-xs"
                  >
                    {isUpgrading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Fazer upgrade para {plan.name}</span>}
                    {!isUpgrading && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center">
            <p className="text-sm font-semibold text-slate-700">Você já está no maior plano disponível.</p>
            <p className="text-xs text-slate-500 mt-1">Novos planos aparecerão aqui quando forem disponibilizados.</p>
          </div>
        )}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Confirmar upgrade</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Você está selecionando o plano <strong className="text-slate-800">{selectedPlan.name}</strong> no ciclo {billingCycle === "yearly" ? "anual" : "mensal"}.
                </p>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Plano atual</span>
                <strong className="text-slate-800">{currentPlan?.name || "FREE"}</strong>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-500">Novo plano</span>
                <strong className="text-indigo-700">{selectedPlan.name}</strong>
              </div>
              <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-slate-200">
                <span className="font-semibold text-slate-700">Valor</span>
                <strong className="text-slate-900">
                  R$ {Number(billingCycle === "yearly" ? selectedPlan.priceYearly : selectedPlan.priceMonthly).toFixed(2).replace(".", ",")}
                  <span className="text-[10px] font-normal text-slate-500">/{billingCycle === "yearly" ? "ano" : "mês"}</span>
                </strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <button
                onClick={() => setSelectedPlan(null)}
                disabled={Boolean(upgradingId) || generatingBolepix}
                className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateBolepix}
                disabled={Boolean(upgradingId) || generatingBolepix}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-xs"
              >
                {generatingBolepix ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Pagar com Boleto / Pix
              </button>
              <button
                onClick={handleConfirmUpgrade}
                disabled={Boolean(upgradingId) || generatingBolepix}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-xs"
              >
                {upgradingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Ativar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bolepix Data Modal */}
      {bolepixData && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Boleto com Pix (Bolepix)</h3>
                  <p className="text-xs text-slate-500">
                    Pague pelo Pix para ativação imediata ou utilize o código de barras.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBolepixData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-900 font-semibold">Valor da Cobrança:</span>
                <span className="text-sm font-extrabold text-amber-950">
                  R$ {Number(bolepixData.bolepix?.valorNominal || 0).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-800">Vencimento:</span>
                <span className="font-bold text-amber-900">
                  {bolepixData.bolepix?.dataVencimento
                    ? new Date(bolepixData.bolepix.dataVencimento).toLocaleDateString("pt-BR")
                    : "Em 3 dias"}
                </span>
              </div>
            </div>

            {/* Pix Copia e Cola */}
            {bolepixData.bolepix?.pixCopiaECola && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Código Pix Copia e Cola (Compensação Imediata)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={bolepixData.bolepix.pixCopiaECola}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bolepixData.bolepix.pixCopiaECola);
                      setCopiedPix(true);
                      setTimeout(() => setCopiedPix(false), 3000);
                    }}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                  >
                    {copiedPix ? "Copiado!" : "Copiar Pix"}
                  </button>
                </div>
              </div>
            )}

            {/* Linha Digitável */}
            {bolepixData.bolepix?.linhaDigitavel && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Linha Digitável do Boleto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={bolepixData.bolepix.linhaDigitavel}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bolepixData.bolepix.linhaDigitavel);
                      setCopiedLinha(true);
                      setTimeout(() => setCopiedLinha(false), 3000);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 transition"
                  >
                    {copiedLinha ? "Copiado!" : "Copiar Linha"}
                  </button>
                </div>
              </div>
            )}

            {/* PDF and Close Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2">
              {bolepixData.pdfUrl && (
                <a
                  href={bolepixData.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Visualizar / Baixar PDF</span>
                </a>
              )}
              <button
                onClick={() => {
                  setBolepixData(null);
                  loadBilling();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
