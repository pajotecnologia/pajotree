"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Copy, Edit3, Loader2, Plus, Save, ShieldCheck, Trash2, X } from "lucide-react";

type Features = {
  maxPages: number;
  maxLinks: number;
  maxUsers: number;
  maxLeads: number;
  maxForms: number;
  maxMetaPixels: number;
  maxAutomations: number;
  maxStorageMb: number;
  customDomainAllowed: boolean;
  crmAllowed: boolean;
  advancedAnalytics: boolean;
  removeBranding: boolean;
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number | string;
  priceYearly: number | string;
  trialDays: number;
  features?: Features | null;
  _count?: { organizations: number; subscriptions?: number };
};

const defaultFeatures: Features = {
  maxPages: 1,
  maxLinks: 5,
  maxUsers: 1,
  maxLeads: 50,
  maxForms: 1,
  maxMetaPixels: 1,
  maxAutomations: 0,
  maxStorageMb: 20,
  customDomainAllowed: false,
  crmAllowed: false,
  advancedAnalytics: false,
  removeBranding: false,
};

const featureLabels: Array<[keyof Features, string]> = [
  ["maxPages", "Páginas"],
  ["maxLinks", "Links"],
  ["maxUsers", "Usuários"],
  ["maxLeads", "Leads"],
  ["maxForms", "Formulários"],
  ["maxMetaPixels", "Meta Pixels"],
  ["maxAutomations", "Automações"],
  ["maxStorageMb", "Armazenamento (MB)"],
];

const booleanFeatures: Array<[keyof Features, string]> = [
  ["customDomainAllowed", "Domínio personalizado"],
  ["crmAllowed", "CRM"],
  ["advancedAnalytics", "Analytics avançado"],
  ["removeBranding", "Remover marca PAJOTREE"],
];

function emptyPlan(): Omit<Plan, "id" | "_count"> {
  return {
    name: "NOVO PLANO",
    description: "Plano personalizado para sua estratégia comercial.",
    priceMonthly: 0,
    priceYearly: 0,
    trialDays: 0,
    features: defaultFeatures,
  };
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível carregar os planos.");
      setPlans(json.plans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(a.priceMonthly) - Number(b.priceMonthly)),
    [plans]
  );

  function openCreate() {
    setCreating(true);
    setEditing({ id: "", ...emptyPlan() } as Plan);
    setMessage(null);
    setError(null);
  }

  function openEdit(plan: Plan) {
    setCreating(false);
    setEditing({ ...plan, features: { ...defaultFeatures, ...(plan.features || {}) } });
    setMessage(null);
    setError(null);
  }

  function updateEditing(field: keyof Plan, value: string | number | null) {
    setEditing((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateFeature(field: keyof Features, value: string | boolean) {
    setEditing((current) =>
      current
        ? { ...current, features: { ...defaultFeatures, ...(current.features || {}), [field]: typeof value === "boolean" ? value : Number(value) } }
        : current
    );
  }

  async function savePlan() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      ...(creating ? {} : { id: editing.id }),
      name: editing.name,
      description: editing.description || null,
      priceMonthly: Number(editing.priceMonthly),
      priceYearly: Number(editing.priceYearly),
      trialDays: Number(editing.trialDays),
      features: { ...defaultFeatures, ...(editing.features || {}) },
    };

    try {
      const res = await fetch("/api/admin/plans", {
        method: creating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível salvar o plano.");
      setEditing(null);
      setMessage(creating ? "Plano criado com sucesso." : "Plano atualizado com sucesso.");
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar plano.");
    } finally {
      setSaving(false);
    }
  }

  async function duplicatePlan(plan: Plan) {
    const name = window.prompt("Nome do novo plano:", `${plan.name} - Cópia`);
    if (!name?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", id: plan.id, name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível duplicar o plano.");
      setMessage("Plano duplicado com sucesso.");
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao duplicar plano.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(plan: Plan) {
    if ((plan._count?.organizations || 0) > 0 || (plan._count?.subscriptions || 0) > 0) {
      setError("Este plano possui empresas ou assinaturas vinculadas e não pode ser excluído.");
      return;
    }
    if (!window.confirm(`Excluir o plano ${plan.name}? Esta ação não pode ser desfeita.`)) return;

    setDeletingId(plan.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/plans?id=${encodeURIComponent(plan.id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir o plano.");
      setMessage("Plano excluído com sucesso.");
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir plano.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="min-h-80 flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-700">SaaS / Monetização</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Planos & Recursos</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">Crie, edite e duplique os planos usados pelo catálogo comercial e pelo faturamento do PAJOTREE.</p>
        </div>
        <button onClick={openCreate} className="min-h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition">
          <Plus className="w-4 h-4" /> Novo plano
        </button>
      </div>

      {message && <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4" />{message}</div>}
      {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {sortedPlans.map((plan) => (
          <section key={plan.id} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-extrabold text-slate-900">{plan.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">{plan._count?.organizations || 0} empresas</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{plan.description || "Sem descrição."}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(plan)} aria-label={`Editar ${plan.name}`} className="min-h-11 min-w-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => duplicatePlan(plan)} aria-label={`Duplicar ${plan.name}`} disabled={saving} className="min-h-11 min-w-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"><Copy className="w-4 h-4" /></button>
                <button onClick={() => deletePlan(plan)} aria-label={`Excluir ${plan.name}`} disabled={deletingId === plan.id || Boolean(plan._count?.organizations) || Boolean(plan._count?.subscriptions)} className="min-h-11 min-w-11 rounded-xl border border-rose-200 flex items-center justify-center text-rose-600 hover:bg-rose-50 disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><span className="text-[10px] text-slate-500 block">Mensal</span><strong className="text-sm">R$ {Number(plan.priceMonthly).toFixed(2).replace(".", ",")}</strong></div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><span className="text-[10px] text-slate-500 block">Anual</span><strong className="text-sm">R$ {Number(plan.priceYearly).toFixed(2).replace(".", ",")}</strong></div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><span className="text-[10px] text-slate-500 block">Teste</span><strong className="text-sm">{plan.trialDays} dias</strong></div>
              {(featureLabels.slice(0, 6)).map(([key, label]) => <div key={key} className="p-3 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-500 block">{label}</span><strong className="text-sm">{plan.features?.[key] ?? 0}</strong></div>)}
            </div>
          </section>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 sticky top-0 bg-white z-10">
                <div><h2 className="font-extrabold text-slate-900">{creating ? "Novo plano" : `Editar ${editing.name}`}</h2><p className="text-xs text-slate-500 mt-1">As alterações passam a refletir no catálogo de planos e no faturamento.</p></div>
                <button onClick={() => setEditing(null)} className="min-h-11 min-w-11 rounded-xl border border-slate-200 flex items-center justify-center"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="text-xs font-bold text-slate-700">Nome<input value={editing.name} onChange={(e) => updateEditing("name", e.target.value)} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>
                  <label className="text-xs font-bold text-slate-700">Dias de teste<input type="number" min="0" value={editing.trialDays} onChange={(e) => updateEditing("trialDays", Number(e.target.value))} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>
                  <label className="text-xs font-bold text-slate-700">Preço mensal<input type="number" min="0" step="0.01" value={editing.priceMonthly} onChange={(e) => updateEditing("priceMonthly", Number(e.target.value))} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>
                  <label className="text-xs font-bold text-slate-700">Preço anual<input type="number" min="0" step="0.01" value={editing.priceYearly} onChange={(e) => updateEditing("priceYearly", Number(e.target.value))} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>
                </div>
                <label className="text-xs font-bold text-slate-700 block">Descrição<textarea value={editing.description || ""} onChange={(e) => updateEditing("description", e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm resize-y" /></label>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3">Limites</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {featureLabels.map(([key, label]) => <label key={key} className="text-xs font-bold text-slate-700">{label}<input type="number" min="0" value={Number(editing.features?.[key] ?? 0)} onChange={(e) => updateFeature(key, e.target.value)} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>)}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3">Recursos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {booleanFeatures.map(([key, label]) => <label key={key} className="min-h-11 px-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700"><span>{label}</span><input type="checkbox" checked={Boolean(editing.features?.[key])} onChange={(e) => updateFeature(key, e.target.checked)} className="h-4 w-4" /></label>)}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end sticky bottom-0 bg-white">
                <button onClick={() => setEditing(null)} disabled={saving} className="min-h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-700">Cancelar</button>
                <button onClick={savePlan} disabled={saving} className="min-h-11 px-5 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"><Save className="w-4 h-4" />{saving ? "Salvando..." : "Salvar plano"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
