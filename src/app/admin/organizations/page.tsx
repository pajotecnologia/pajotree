"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Loader2,
} from "lucide-react";

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadOrgs() {
    try {
      const res = await fetch("/api/admin/organizations");
      if (res.ok) {
        const json = await res.json();
        setOrganizations(json.organizations || []);
        setPlans(json.plans || []);
      }
    } catch (err) {
      console.error("Erro ao carregar organizações:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleUpdateStatus = async (orgId: string, status: string) => {
    setUpdatingId(orgId);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, status }),
      });
      if (res.ok) await loadOrgs();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
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
      if (res.ok) await loadOrgs();
    } catch (err) {
      console.error("Erro ao alterar plano:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">
            Gestão de Empresas & Organizações
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualize consumo, suspenda contas ou altere planos de qualquer cliente do SaaS.
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-h-11 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="responsive-data-table w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4 pl-6">Empresa</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Consumo</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Ações Mestre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition">
                    <td data-label="Empresa" className="p-4 pl-6">
                      <span className="font-bold text-slate-900 block break-words">{org.name}</span>
                      <span className="text-[11px] text-slate-500 block break-all">{org.email}</span>
                    </td>
                    <td data-label="Plano" className="p-4">
                      <select
                        value={org.planId || ""}
                        onChange={(e) => handleChangePlan(org.id, e.target.value)}
                        disabled={updatingId === org.id}
                        className="min-h-11 w-full sm:w-auto px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-amber-700 font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Consumo" className="p-4 text-slate-600 text-[11px]">
                      {org._count?.links || 0} links &bull; {org._count?.leads || 0} leads &bull; {org._count?.whatsappInstances || 0} WA
                    </td>
                    <td data-label="Status" className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        org.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : org.status === "TRIAL"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td data-label="Ações Mestre" className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-start sm:justify-end gap-2">
                        {org.status === "SUSPENDED" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(org.id, "ACTIVE")}
                            disabled={updatingId === org.id}
                            className="min-h-11 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition"
                          >
                            Reativar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(org.id, "SUSPENDED")}
                            disabled={updatingId === org.id}
                            className="min-h-11 px-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold hover:bg-rose-100 transition"
                          >
                            Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 text-xs">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
