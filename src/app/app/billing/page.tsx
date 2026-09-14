"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadBilling() {
    try {
      const res = await fetch("/api/billing");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Erro ao carregar faturamento:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBilling();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    setUpgradingId(planId);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });

      if (res.ok) {
        setSuccessMsg("Plano alterado com sucesso! Seus novos limites foram liberados.");
        await loadBilling();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Erro ao alterar plano:", err);
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

  const isTrial = subscription?.status === "TRIAL";

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Assinatura & Planos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie sua assinatura, consulte cotas em tempo real e faça upgrade dos seus recursos.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
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
            <span>Anual</span>
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

      {/* Current Quota Consumption Overview */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900">
                  Plano Atual: {currentPlan?.name || "FREE"}
                </span>
                {isTrial && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase">
                    Período de Teste (Trial)
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 block mt-0.5">
                {currentPlan?.description || "Acesso aos recursos essenciais."}
              </span>
            </div>
          </div>
        </div>

        {/* Quota Bars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Links Criados</span>
              <span className="font-bold text-slate-900">
                {usage?.linksCount || 0} / {features?.maxLinks}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(((usage?.linksCount || 0) / features?.maxLinks) * 100, 100)}%` }}
                className="h-full bg-indigo-600"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Leads Capturados</span>
              <span className="font-bold text-slate-900">
                {usage?.leadsCount || 0} / {features?.maxLeads}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(((usage?.leadsCount || 0) / features?.maxLeads) * 100, 100)}%` }}
                className="h-full bg-emerald-600"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">WhatsApp Conectado</span>
              <span className="font-bold text-slate-900">
                {usage?.whatsappInstancesCount || 0} / {features?.maxWhatsappInstances}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(((usage?.whatsappInstancesCount || 0) / (features?.maxWhatsappInstances || 1)) * 100, 100)}%` }}
                className="h-full bg-blue-600"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Meta Pixels</span>
              <span className="font-bold text-slate-900">
                {usage?.metaPixelsCount || 0} / {features?.maxMetaPixels}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(((usage?.metaPixelsCount || 0) / features?.maxMetaPixels) * 100, 100)}%` }}
                className="h-full bg-pink-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans Selector */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Escolha ou Altere seu Plano</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data?.allPlans?.map((plan: any) => {
            const isCurrent = currentPlan?.id === plan.id;
            const pFeatures = plan.features?.[0];
            const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl flex flex-col justify-between transition ${
                  isCurrent
                    ? "bg-white border-2 border-indigo-600 shadow-md ring-2 ring-indigo-100"
                    : "bg-white border border-slate-200/80 shadow-xs hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-base text-slate-900">{plan.name}</h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                        Atual
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-4 min-h-[32px]">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {Number(price) === 0 ? "Grátis" : `R$ ${Number(price).toFixed(2).replace(".", ",")}`}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      {billingCycle === "yearly" ? "/ano" : "/mês"}
                    </span>
                  </div>

                  <div className="space-y-2.5 mb-6 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Até {pFeatures?.maxLinks} Links com Tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{pFeatures?.maxLeads} Leads no CRM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{pFeatures?.maxWhatsappInstances} Conexões WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{pFeatures?.maxMetaPixels} Meta Pixels</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent || upgradingId === plan.id}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? "bg-slate-100 text-slate-400 cursor-default"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  }`}
                >
                  {upgradingId === plan.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isCurrent ? (
                    <span>Plano Ativo</span>
                  ) : (
                    <>
                      <span>Mudar para {plan.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
