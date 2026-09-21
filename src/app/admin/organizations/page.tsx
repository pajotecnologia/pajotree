"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  Plus,
  Pencil,
  X,
  Building,
  Building2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  User,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Crown,
  Layers,
} from "lucide-react";

type Plan = { id: string; name: string; priceMonthly: number; organizationId?: string | null };
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
  isWhiteLabel?: boolean;
  whiteLabelParentId?: string | null;
  whiteLabelParent?: { id: string; name: string; tradeName?: string | null } | null;
  addresses?: Address[];
  users?: Array<{
    user: {
      id: string;
      name: string;
      username?: string | null;
      email: string;
      phone?: string | null;
      status: string;
      createdAt?: string;
    };
    role?: { id?: string; name: string };
  }>;
  _count?: { links?: number; leads?: number; users?: number; whiteLabelClients?: number };
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
  adminUserId: string;
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
};

const emptyForm: FormState = {
  name: "", legalName: "", tradeName: "", document: "", email: "", phone: "", whatsapp: "",
  website: "", description: "", segment: "", status: "TRIAL", planId: "", zipCode: "", street: "",
  number: "", complement: "", neighborhood: "", city: "", state: "",
  adminUserId: "", adminName: "", adminUsername: "", adminEmail: "", adminPassword: "",
};

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "whitelabel">("all");
  const [collapsedAgencies, setCollapsedAgencies] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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

  const toggleAgencyCollapse = (agencyId: string) => {
    setCollapsedAgencies((prev) => ({
      ...prev,
      [agencyId]: !prev[agencyId],
    }));
  };

  // Map sub-clients by whiteLabelParentId
  const subClientsMap = useMemo(() => {
    const map: Record<string, Organization[]> = {};
    organizations.forEach((org) => {
      if (org.whiteLabelParentId) {
        if (!map[org.whiteLabelParentId]) map[org.whiteLabelParentId] = [];
        map[org.whiteLabelParentId].push(org);
      }
    });
    return map;
  }, [organizations]);

  const isWhiteLabelPartner = (org: Organization) => {
    return Boolean(
      org.isWhiteLabel ||
      (org.plan?.name && org.plan.name.toUpperCase().includes("WHITE")) ||
      (subClientsMap[org.id] && subClientsMap[org.id].length > 0)
    );
  };

  const rootOrganizations = useMemo(() => {
    return organizations.filter((org) => !org.whiteLabelParentId);
  }, [organizations]);

  const directCount = useMemo(() => {
    return rootOrganizations.filter((o) => !isWhiteLabelPartner(o)).length;
  }, [rootOrganizations, subClientsMap]);

  const wlPartnerCount = useMemo(() => {
    return rootOrganizations.filter((o) => isWhiteLabelPartner(o)).length;
  }, [rootOrganizations, subClientsMap]);

  const subClientsCount = useMemo(() => {
    return organizations.filter((o) => !!o.whiteLabelParentId).length;
  }, [organizations]);

  const filteredRoots = useMemo(() => {
    const q = search.toLowerCase().trim();

    return rootOrganizations.filter((root) => {
      const isWl = isWhiteLabelPartner(root);
      if (activeTab === "direct" && isWl) return false;
      if (activeTab === "whitelabel" && !isWl) return false;

      if (!q) return true;

      const matchRoot =
        root.name.toLowerCase().includes(q) ||
        root.email.toLowerCase().includes(q) ||
        (root.document || "").toLowerCase().includes(q) ||
        (root.users?.[0]?.user.username || "").toLowerCase().includes(q);

      if (matchRoot) return true;

      const children = subClientsMap[root.id] || [];
      const matchChild = children.some(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.document || "").toLowerCase().includes(q) ||
          (c.users?.[0]?.user.username || "").toLowerCase().includes(q)
      );

      return matchChild;
    });
  }, [rootOrganizations, activeTab, search, subClientsMap]);

  // Orphan sub-clients (if parent does not exist in root)
  const orphanSubClients = useMemo(() => {
    const rootIds = new Set(rootOrganizations.map((r) => r.id));
    return organizations.filter((o) => o.whiteLabelParentId && !rootIds.has(o.whiteLabelParentId));
  }, [organizations, rootOrganizations]);

  // Planos disponíveis no Modal de edição/criação:
  // Se for sub-cliente de uma agência White Label -> exibe apenas os planos criados por essa agência White Label.
  // Se for empresa direta ou a própria agência White Label -> exibe apenas os planos globais da plataforma.
  const availableModalPlans = useMemo(() => {
    if (editing?.whiteLabelParentId) {
      return plans.filter((p) => p.organizationId === editing.whiteLabelParentId);
    }
    return plans.filter((p) => !p.organizationId);
  }, [plans, editing]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFeedback(null);
    setModalFeedback(null);
    setModalOpen(true);
  }

  function openEdit(org: Organization) {
    const address = org.addresses?.[0] || {};
    const primaryUser = org.users?.find((u) => u.role?.name === "Administrador")?.user || org.users?.[0]?.user;
    setEditing(org);
    setFeedback(null);
    setModalFeedback(null);
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
      adminUserId: primaryUser?.id || "",
      adminName: primaryUser?.name || "",
      adminUsername: primaryUser?.username || "",
      adminEmail: primaryUser?.email || "",
      adminPassword: "",
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
    setModalFeedback(null);

    const payload: any = {
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
    };

    if (editing) {
      if (form.adminUserId) payload.adminUserId = form.adminUserId;
      if (form.adminName) payload.adminName = form.adminName;
      if (form.adminUsername) payload.adminUsername = form.adminUsername.trim().toLowerCase();
      if (form.adminEmail) payload.adminEmail = form.adminEmail.trim().toLowerCase();
      if (form.adminPassword && form.adminPassword.trim()) payload.adminPassword = form.adminPassword.trim();
    } else {
      payload.adminName = form.adminName;
      payload.adminUsername = form.adminUsername.trim().toLowerCase() || null;
      payload.adminEmail = form.adminEmail.trim().toLowerCase();
      payload.adminPassword = form.adminPassword;
    }

    try {
      const res = await fetch("/api/admin/organizations", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível salvar a empresa.");

      setModalOpen(false);
      setModalFeedback(null);
      setFeedback({
        type: "success",
        text: editing
          ? `Empresa "${form.name}" e dados de acesso salvos com sucesso!`
          : `Empresa "${form.name}" cadastrada com sucesso!`,
      });
      await loadOrgs();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao salvar empresa.";
      setModalFeedback({ type: "error", text: errorMsg });
      setFeedback({ type: "error", text: errorMsg });
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
      const statusLabel = status === "ACTIVE" ? "Ativo" : status === "SUSPENDED" ? "Suspenso" : status;
      setFeedback({ type: "success", text: `Status da empresa alterado para "${statusLabel}" com sucesso!` });
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
      const planName = plans.find((p) => p.id === planId)?.name || "Sem plano";
      setFeedback({ type: "success", text: `Plano da empresa alterado para "${planName}" com sucesso!` });
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
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-4 h-4" /> Gestão de Empresas
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">
            Empresas & Organizações
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre, edite, altere planos e controle o acesso das empresas do SaaS e das agências White Label com seus sub-clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="min-h-11 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-sm inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nova empresa
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-xs font-semibold shadow-sm transition-all duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-rose-50 text-rose-800 border-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div className="break-words">
              <span className="font-bold mr-1.5">
                {feedback.type === "success" ? "Sucesso:" : "Atenção:"}
              </span>
              <span>{feedback.text}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition shrink-0 cursor-pointer"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl max-w-full overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Todas as Empresas ({organizations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("direct")}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
              activeTab === "direct"
                ? "bg-white text-indigo-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            <span>Clientes Diretos do App ({directCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("whitelabel")}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
              activeTab === "whitelabel"
                ? "bg-purple-600 text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Parceiros White Label ({wlPartnerCount} agências • {subClientsCount} clientes)</span>
          </button>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por nome, login, e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-11 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
          />
        </div>
      </div>

      {/* Hierarchical Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="responsive-data-table w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4 pl-6">Empresa & Hierarquia</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Consumo</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRoots.length > 0 ? (
                filteredRoots.map((root: Organization) => {
                  const isWl = isWhiteLabelPartner(root);
                  const subClients = subClientsMap[root.id] || [];
                  const isCollapsed = collapsedAgencies[root.id];
                  const primaryAdmin = root.users?.[0]?.user;

                  return (
                    <React.Fragment key={root.id}>
                      {/* Root Organization Row */}
                      <tr
                        className={`transition ${
                          isWl
                            ? "bg-purple-50/30 hover:bg-purple-50/60 font-medium"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td data-label="Empresa" className="p-4 pl-6">
                          <div className="flex items-start gap-2.5">
                            {isWl && (
                              <button
                                type="button"
                                onClick={() => toggleAgencyCollapse(root.id)}
                                className="mt-0.5 p-1 rounded-md text-purple-700 hover:bg-purple-100 transition shrink-0"
                                title={isCollapsed ? "Expandir sub-clientes" : "Recolher sub-clientes"}
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 block break-words">
                                  {root.name}
                                </span>
                                {isWl ? (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-extrabold flex items-center gap-1">
                                      <Crown className="w-3 h-3 text-amber-500" />
                                      Agência White Label
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                                      {subClients.length} sub-cliente(s)
                                    </span>
                                  </>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
                                    Cliente Direto
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px] text-slate-500">
                                <span>{root.email}</span>
                                {primaryAdmin?.username && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-900 font-mono text-[10px] font-bold border border-amber-200">
                                    login: @{primaryAdmin.username}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Plano" className="p-4">
                          <select
                            value={root.planId || ""}
                            onChange={(e) => handleChangePlan(root.id, e.target.value)}
                            disabled={updatingId === root.id}
                            className="min-h-11 w-full sm:w-auto px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-amber-700 font-bold focus:outline-none focus:border-amber-500 shadow-sm cursor-pointer"
                          >
                            <option value="">Sem plano</option>
                            {plans
                              .filter((p) => !p.organizationId)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td data-label="Consumo" className="p-4 text-slate-600 text-[11px]">
                          {root._count?.links || 0} links &bull; {root._count?.leads || 0} leads &bull;{" "}
                          {root._count?.users || 1} usuários
                        </td>
                        <td data-label="Status" className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              root.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : root.status === "TRIAL"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {root.status}
                          </span>
                        </td>
                        <td data-label="Ações" className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-start sm:justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(root)}
                              className="min-h-11 px-3 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-bold hover:bg-slate-100 transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Editar
                            </button>
                            {root.status === "SUSPENDED" ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(root.id, "ACTIVE")}
                                disabled={updatingId === root.id}
                                className="min-h-11 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition cursor-pointer"
                              >
                                Reativar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(root.id, "SUSPENDED")}
                                disabled={updatingId === root.id}
                                className="min-h-11 px-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold hover:bg-rose-100 transition cursor-pointer"
                              >
                                Suspender
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Nested White Label Sub-clients (rendered directly below the parent) */}
                      {isWl && !isCollapsed && subClients.length > 0 && (
                        subClients.map((child: Organization) => {
                          const childAdmin = child.users?.[0]?.user;
                          return (
                            <tr
                              key={child.id}
                              className="bg-purple-50/15 hover:bg-purple-50/40 border-l-4 border-l-purple-400 transition"
                            >
                              <td data-label="Empresa" className="p-3.5 pl-10 sm:pl-14">
                                <div className="flex items-start gap-2.5">
                                  <CornerDownRight className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-800 block break-words">
                                        {child.name}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full bg-purple-100/90 text-purple-900 border border-purple-200 text-[9px] font-bold uppercase tracking-wider">
                                        Sub-cliente White Label
                                      </span>
                                      <span className="text-[10px] text-purple-700 font-medium">
                                        (Agência: {root.tradeName || root.name})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px] text-slate-500">
                                      <span>{child.email}</span>
                                      {childAdmin?.username && (
                                        <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-900 font-mono text-[10px] font-bold border border-amber-200">
                                          login: @{childAdmin.username}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td data-label="Plano" className="p-3.5">
                                <select
                                  value={child.planId || ""}
                                  onChange={(e) => handleChangePlan(child.id, e.target.value)}
                                  disabled={updatingId === child.id}
                                  className="min-h-10 w-full sm:w-auto px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-xs text-purple-700 font-bold focus:outline-none focus:border-purple-500 shadow-sm cursor-pointer"
                                >
                                  <option value="">Sem plano</option>
                                  {plans
                                    .filter((p) => p.organizationId === root.id)
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td data-label="Consumo" className="p-3.5 text-slate-600 text-[11px]">
                                {child._count?.links || 0} links &bull; {child._count?.leads || 0} leads &bull;{" "}
                                {child._count?.users || 1} usuários
                              </td>
                              <td data-label="Status" className="p-3.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    child.status === "ACTIVE"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : child.status === "TRIAL"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  {child.status}
                                </span>
                              </td>
                              <td data-label="Ações" className="p-3.5 pr-6 text-right">
                                <div className="flex items-center justify-start sm:justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(child)}
                                    className="min-h-10 px-2.5 rounded-lg bg-white text-slate-700 border border-slate-200 text-[11px] font-bold hover:bg-slate-50 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Editar
                                  </button>
                                  {child.status === "SUSPENDED" ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(child.id, "ACTIVE")}
                                      disabled={updatingId === child.id}
                                      className="min-h-10 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition cursor-pointer"
                                    >
                                      Reativar
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(child.id, "SUSPENDED")}
                                      disabled={updatingId === child.id}
                                      className="min-h-10 px-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold hover:bg-rose-100 transition cursor-pointer"
                                    >
                                      Suspender
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 text-xs">
                    Nenhuma empresa encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={editing ? "Editar empresa" : "Nova empresa"}>
          <div className="min-h-full flex items-start sm:items-center justify-center py-3 sm:py-8">
            <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
                <div><h2 className="text-lg font-bold text-slate-900">{editing ? "Editar empresa" : "Cadastrar nova empresa"}</h2><p className="text-[11px] text-slate-500 mt-0.5">{editing ? "Atualize os dados cadastrais, comerciais e credenciais de acesso." : "Cadastre a empresa e seu primeiro administrador."}</p></div>
                <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 min-w-11 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {modalFeedback && (
                  <div
                    className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-xs font-semibold shadow-xs ${
                      modalFeedback.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-rose-50 text-rose-800 border-rose-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {modalFeedback.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold">
                          {modalFeedback.type === "success" ? "Operação realizada com sucesso!" : "Não foi possível salvar:"}
                        </div>
                        <div className="mt-0.5 font-normal">{modalFeedback.text}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalFeedback(null)}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title="Fechar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <section><h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Dados da empresa</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nome da empresa *" value={form.name} onChange={(v) => setField("name", v)} required />
                  <Field label="E-mail da empresa *" type="email" value={form.email} onChange={(v) => setField("email", v)} required />
                  <Field label="Razão social" value={form.legalName} onChange={(v) => setField("legalName", v)} />
                  <Field label="Nome fantasia" value={form.tradeName} onChange={(v) => setField("tradeName", v)} />
                  <Field label="CNPJ / CPF" value={form.document} onChange={(v) => setField("document", v)} />
                  <Field label="Segmento" value={form.segment} onChange={(v) => setField("segment", v)} placeholder="Ex.: Marketing, Restaurante..." />
                  <Field label="Telefone" value={form.phone} onChange={(v) => setField("phone", v)} />
                  <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setField("whatsapp", v)} />
                  <Field label="Website" value={form.website} onChange={(v) => setField("website", v)} />
                  <SelectField
                    label={
                      editing?.whiteLabelParentId
                        ? `Plano (Planos da Agência White Label: ${editing.whiteLabelParent?.tradeName || editing.whiteLabelParent?.name || "Agência"})`
                        : "Plano"
                    }
                    value={form.planId}
                    onChange={(v) => setField("planId", v)}
                    options={[
                      {
                        value: "",
                        label:
                          availableModalPlans.length === 0 && editing?.whiteLabelParentId
                            ? "Sem plano (Nenhum plano cadastrado por esta agência)"
                            : "Sem plano",
                      },
                      ...availableModalPlans.map((p) => ({
                        value: p.id,
                        label: p.priceMonthly > 0 ? `${p.name} (R$ ${Number(p.priceMonthly).toFixed(2)}/mês)` : p.name,
                      })),
                    ]}
                  />
                  <SelectField label="Status" value={form.status} onChange={(v) => setField("status", v)} options={["TRIAL", "ACTIVE", "SUSPENDED", "BLOCKED"].map((v) => ({ value: v, label: v }))} />
                  <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Descrição</label><textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" /></div>
                </div></section>

                <section><h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Endereço</h3><div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Field label="CEP" value={form.zipCode} onChange={(v) => setField("zipCode", v)} /><div className="md:col-span-2"><Field label="Rua" value={form.street} onChange={(v) => setField("street", v)} /></div><Field label="Número" value={form.number} onChange={(v) => setField("number", v)} />
                  <Field label="Complemento" value={form.complement} onChange={(v) => setField("complement", v)} /><Field label="Bairro" value={form.neighborhood} onChange={(v) => setField("neighborhood", v)} /><Field label="Cidade" value={form.city} onChange={(v) => setField("city", v)} /><Field label="UF" value={form.state} onChange={(v) => setField("state", v)} maxLength={2} />
                </div></section>

                {editing ? (
                  <section className="rounded-2xl bg-amber-50/50 border border-amber-200/80 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <KeyRound className="w-4 h-4 text-amber-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        Acesso & Credenciais do Administrador
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Field
                        label="Nome do administrador"
                        value={form.adminName}
                        onChange={(v) => setField("adminName", v)}
                        placeholder="Nome do usuário"
                      />
                      <Field
                        label="Login de acesso (Usuário)"
                        value={form.adminUsername}
                        onChange={(v) => setField("adminUsername", v.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                        placeholder="Ex.: admin.empresa"
                      />
                      <Field
                        label="E-mail do administrador"
                        type="email"
                        value={form.adminEmail}
                        onChange={(v) => setField("adminEmail", v)}
                      />
                      <Field
                        label="Nova Senha de Acesso"
                        type="password"
                        value={form.adminPassword}
                        onChange={(v) => setField("adminPassword", v)}
                        placeholder="Deixar em branco para manter"
                        minLength={6}
                      />
                    </div>
                    <p className="text-[10px] text-amber-900/70 mt-2.5">
                      💡 Para redefinir a senha de acesso da empresa, basta digitar a nova senha no campo acima e clicar em &quot;Salvar alterações&quot;. Deixe em branco para não alterar a senha atual.
                    </p>
                  </section>
                ) : (
                  <section className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Primeiro administrador</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Field label="Nome *" value={form.adminName} onChange={(v) => setField("adminName", v)} required />
                      <Field label="Login de acesso *" value={form.adminUsername} onChange={(v) => setField("adminUsername", v.toLowerCase().replace(/[^a-z0-9._-]/g, ""))} required placeholder="Ex.: admin.empresa" />
                      <Field label="E-mail *" type="email" value={form.adminEmail} onChange={(v) => setField("adminEmail", v)} required />
                      <Field label="Senha inicial *" type="password" value={form.adminPassword} onChange={(v) => setField("adminPassword", v)} required minLength={6} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3">A conta será criada com login e senha para acesso ao painel da empresa, sem privilégios de Super Admin.</p>
                  </section>
                )}
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
