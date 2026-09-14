"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  Plus,
  Pencil,
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Plan = { id: string; name: string; priceMonthly: number };
type Address = {
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};
type Organization = {
  id: string;
  name: string;
  legalName?: string | null;
  tradeName?: string | null;
  document?: string | null;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  description?: string | null;
  segment?: string | null;
  status: string;
  planId?: string | null;
  plan?: Plan | null;
  addresses?: Address[];
  _count?: { links?: number; leads?: number; whatsappInstances?: number };
};

type FormState = {
  name: string;
  legalName: string;
  tradeName: string;
  document: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  description: string;
  segment: string;
  status: string;
  planId: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

const emptyForm: FormState = {
  name: "", legalName: "", tradeName: "", document: "", email: "", phone: "", whatsapp: "",
  website: "", description: "", segment: "", status: "TRIAL", planId: "", zipCode: "", street: "",
  number: "", complement: "", neighborhood: "", city: "", state: "", adminName: "", adminEmail: "", adminPassword: "",
};

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadOrgs() {
    try {
      const res = await fetch("/api/admin/organizations", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível carregar as empresas.");
      setOrganizations(json.organizations || []);
      setPlans(json.plans || []);
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao carregar empresas." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrgs(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFeedback(null);
    setModalOpen(true);
  }

  function openEdit(org: Organization) {
    const address = org.addresses?.[0] || {};
    setEditing(org);
    setFeedback(null);
    setForm({
      ...emptyForm,
      name: org.name || "",
      legalName: org.legalName || "",
      tradeName: org.tradeName || "",
      document: org.document || "",
      email: org.email || "",
      phone: org.phone || "",
      whatsapp: org.whatsapp || "",
      website: org.website || "",
      description: org.description || "",
      segment: org.segment || "",
      status: org.status || "TRIAL",
      planId: org.planId || "",
      zipCode: address.zipCode || "",
      street: address.street || "",
      number: address.number || "",
      complement: address.complement || "",
      neighborhood: address.neighborhood || "",
      city: address.city || "",
      state: address.state || "",
    });
    setModalOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      ...(editing ? { organizationId: editing.id } : {}),
      name: form.name,
      legalName: form.legalName || null,
      tradeName: form.tradeName || null,
      document: form.document || null,
      email: form.email,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      website: form.website || null,
      description: form.description || null,
      segment: form.segment || null,
      status: form.status,
      planId: form.planId || null,
      address: {
        zipCode: form.zipCode || null,
        street: form.street || null,
        number: form.number || null,
        complement: form.complement || null,
        neighborhood: form.neighborhood || null,
        city: form.city || null,
        state: form.state || null,
        country: "BR",
      },
      ...(editing ? {} : {
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      }),
    };

    try {
      const res = await fetch("/api/admin/organizations", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível salvar a empresa.");

      setModalOpen(false);
      setFeedback({ type: "success", text: editing ? "Empresa atualizada com sucesso." : "Empresa cadastrada com sucesso." });
      await loadOrgs();
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar empresa." });
    } finally {
      setSaving(false);
    }
  }

  const handleUpdateStatus = async (orgId: string, status: string) => {
    setUpdatingId(orgId);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao alterar status.");
      await loadOrgs();
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao alterar status." });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleChangePlan = async (orgId: string, planId: string) => {
    setUpdatingId(orgId);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, planId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao alterar plano.");
      await loadOrgs();
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao alterar plano." });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => organizations.filter((o) => {
    const query = search.toLowerCase();
    return o.name.toLowerCase().includes(query) || o.email.toLowerCase().includes(query) || (o.document || "").toLowerCase().includes(query);
  }), [organizations, search]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2"><Building2 className="w-4 h-4" /> Gestão de Empresas</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">Empresas & Organizações</h1>
          <p className="text-xs text-slate-500 mt-1">Cadastre, edite, altere planos e controle o acesso das empresas do SaaS.</p>
        </div>
        <button type="button" onClick={openCreate} className="min-h-11 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-sm inline-flex items-center justify-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Nova empresa
        </button>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {feedback.text}
        </div>
      )}

      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input type="text" placeholder="Buscar por nome, e-mail ou documento..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full min-h-11 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="responsive-data-table w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr><th className="p-4 pl-6">Empresa</th><th className="p-4">Plano</th><th className="p-4">Consumo</th><th className="p-4">Status</th><th className="p-4 text-right pr-6">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length > 0 ? filtered.map((org: any) => (
                <tr key={org.id} className="hover:bg-slate-50/60 transition">
                  <td data-label="Empresa" className="p-4 pl-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 block break-words">{org.name}</span>
                      {(org.isWhiteLabel || org.plan?.name?.toUpperCase().includes("WHITE")) && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                          White Label
                        </span>
                      )}
                      {org.whiteLabelParent && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                          Via: {org.whiteLabelParent.name}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block break-all">{org.email}</span>
                  </td>
                  <td data-label="Plano" className="p-4">
                    <select value={org.planId || ""} onChange={(e) => handleChangePlan(org.id, e.target.value)} disabled={updatingId === org.id} className="min-h-11 w-full sm:w-auto px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-amber-700 font-bold focus:outline-none focus:border-amber-500 shadow-sm">
                      <option value="">Sem plano</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td data-label="Consumo" className="p-4 text-slate-600 text-[11px]">{org._count?.links || 0} links &bull; {org._count?.leads || 0} leads &bull; {org._count?.whatsappInstances || 0} WA</td>
                  <td data-label="Status" className="p-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${org.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : org.status === "TRIAL" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>{org.status}</span></td>
                  <td data-label="Ações" className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-start sm:justify-end gap-2">
                      <button type="button" onClick={() => openEdit(org)} className="min-h-11 px-3 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-bold hover:bg-slate-100 transition inline-flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Editar</button>
                      {org.status === "SUSPENDED" ? <button type="button" onClick={() => handleUpdateStatus(org.id, "ACTIVE")} disabled={updatingId === org.id} className="min-h-11 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition">Reativar</button> : <button type="button" onClick={() => handleUpdateStatus(org.id, "SUSPENDED")} disabled={updatingId === org.id} className="min-h-11 px-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold hover:bg-rose-100 transition">Suspender</button>}
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-xs">Nenhuma empresa encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={editing ? "Editar empresa" : "Nova empresa"}>
          <div className="min-h-full flex items-start sm:items-center justify-center py-3 sm:py-8">
            <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
                <div><h2 className="text-lg font-bold text-slate-900">{editing ? "Editar empresa" : "Cadastrar nova empresa"}</h2><p className="text-[11px] text-slate-500 mt-0.5">{editing ? "Atualize os dados cadastrais e comerciais." : "Cadastre a empresa e seu primeiro administrador."}</p></div>
                <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 min-w-11 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                <section><h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Dados da empresa</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nome da empresa *" value={form.name} onChange={(v) => setField("name", v)} required />
                  <Field label="E-mail *" type="email" value={form.email} onChange={(v) => setField("email", v)} required />
                  <Field label="Razão social" value={form.legalName} onChange={(v) => setField("legalName", v)} />
                  <Field label="Nome fantasia" value={form.tradeName} onChange={(v) => setField("tradeName", v)} />
                  <Field label="CNPJ / CPF" value={form.document} onChange={(v) => setField("document", v)} />
                  <Field label="Segmento" value={form.segment} onChange={(v) => setField("segment", v)} placeholder="Ex.: Marketing, Restaurante..." />
                  <Field label="Telefone" value={form.phone} onChange={(v) => setField("phone", v)} />
                  <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setField("whatsapp", v)} />
                  <Field label="Website" value={form.website} onChange={(v) => setField("website", v)} />
                  <SelectField label="Plano" value={form.planId} onChange={(v) => setField("planId", v)} options={[{ value: "", label: "Sem plano" }, ...plans.map((p) => ({ value: p.id, label: p.name }))]} />
                  <SelectField label="Status" value={form.status} onChange={(v) => setField("status", v)} options={["TRIAL", "ACTIVE", "SUSPENDED", "BLOCKED"].map((v) => ({ value: v, label: v }))} />
                  <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Descrição</label><textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" /></div>
                </div></section>

                <section><h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Endereço</h3><div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Field label="CEP" value={form.zipCode} onChange={(v) => setField("zipCode", v)} /><div className="md:col-span-2"><Field label="Rua" value={form.street} onChange={(v) => setField("street", v)} /></div><Field label="Número" value={form.number} onChange={(v) => setField("number", v)} />
                  <Field label="Complemento" value={form.complement} onChange={(v) => setField("complement", v)} /><Field label="Bairro" value={form.neighborhood} onChange={(v) => setField("neighborhood", v)} /><Field label="Cidade" value={form.city} onChange={(v) => setField("city", v)} /><Field label="UF" value={form.state} onChange={(v) => setField("state", v)} maxLength={2} />
                </div></section>

                {!editing && <section className="rounded-2xl bg-slate-50 border border-slate-200 p-4"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Primeiro administrador</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Nome *" value={form.adminName} onChange={(v) => setField("adminName", v)} required /><Field label="E-mail de acesso *" type="email" value={form.adminEmail} onChange={(v) => setField("adminEmail", v)} required /><Field label="Senha inicial *" type="password" value={form.adminPassword} onChange={(v) => setField("adminPassword", v)} required minLength={6} />
                </div><p className="text-[10px] text-slate-500 mt-3">A conta será criada como Administrador da empresa, sem privilégios de Super Admin.</p></section>}
              </div>

              <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100">Cancelar</button>
                <button type="submit" disabled={saving} className="min-h-11 px-5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? "Salvar alterações" : "Cadastrar empresa"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder, maxLength, minLength }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string; maxLength?: number; minLength?: number }) {
  return <div><label className="block text-[11px] font-semibold text-slate-600 mb-1.5">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} maxLength={maxLength} minLength={minLength} className="w-full min-h-11 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400" /></div>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <div><label className="block text-[11px] font-semibold text-slate-600 mb-1.5">{label}</label><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-11 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}
