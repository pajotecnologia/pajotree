"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  MessageCircle,
  Loader2,
  UserCheck,
} from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"leads" | "customers">("leads");
  const [search, setSearch] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  async function loadData() {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const json = await res.json();
        setLeads(json.leads || []);
        setCustomers(json.customers || []);
      }
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleConvertToCustomer = async (leadId: string) => {
    setConvertingId(leadId);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert_to_customer", leadId }),
      });
      if (res.ok) await loadData();
    } catch (err) {
      console.error("Erro ao converter lead:", err);
    } finally {
      setConvertingId(null);
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.phone && l.phone.includes(search))
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">Leads & Base de Clientes</h1>
          <p className="text-xs text-slate-500 mt-1">Visualize contatos capturados, mensagens enviadas e converta leads em clientes.</p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold overflow-x-auto">
          <button type="button" onClick={() => setTab("leads")} className={`min-h-11 flex-1 sm:flex-none px-3.5 rounded-lg transition whitespace-nowrap ${tab === "leads" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
            Leads ({leads.length})
          </button>
          <button type="button" onClick={() => setTab("customers")} className={`min-h-11 flex-1 sm:flex-none px-3.5 rounded-lg transition whitespace-nowrap ${tab === "customers" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
            Clientes ({customers.length})
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input type="text" placeholder="Buscar por nome, e-mail ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full min-h-11 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs" />
      </div>

      {tab === "leads" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="responsive-data-table w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Nome / Contato</th>
                  <th className="p-4">Mensagem / Origem</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Data</th>
                  <th className="p-4 text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredLeads.length > 0 ? filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition">
                    <td data-label="Nome / Contato" className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">{lead.name.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block break-words">{lead.name}</span>
                          <span className="text-[11px] text-slate-500 block break-all">{lead.email || lead.phone || lead.whatsapp || "Sem contato direto"}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Mensagem / Origem" className="p-4 max-w-xs">
                      <p className="text-slate-700 truncate text-[11px]">{lead.message || "Nenhuma mensagem preenchida"}</p>
                      <span className="text-[10px] text-slate-400 font-mono">Origem: {lead.source || "Página"}</span>
                    </td>
                    <td data-label="Status" className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${lead.status === "CONVERTED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>{lead.status}</span>
                    </td>
                    <td data-label="Data" className="p-4 text-slate-500 text-[11px]">{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td data-label="Ações" className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-start sm:justify-end flex-wrap gap-2">
                        {lead.whatsapp && (
                          <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="min-h-11 min-w-11 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition flex items-center justify-center" title="Abrir no WhatsApp" aria-label="Abrir no WhatsApp">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.status !== "CONVERTED" && (
                          <button type="button" onClick={() => handleConvertToCustomer(lead.id)} disabled={convertingId === lead.id} className="min-h-11 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs" title="Converter para Cliente">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Converter</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-xs">Nenhum lead encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "customers" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="responsive-data-table w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Cliente</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Data de Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredCustomers.length > 0 ? filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition">
                    <td data-label="Cliente" className="p-4 pl-6 font-semibold text-slate-900 break-words">{cust.name}</td>
                    <td data-label="Contato" className="p-4 text-slate-600 break-all">{cust.email || cust.whatsapp || cust.phone || "-"}</td>
                    <td data-label="Empresa" className="p-4 text-slate-500">{cust.company || "Pessoa Física"}</td>
                    <td data-label="Data de Conversão" className="p-4 text-slate-400 text-[11px]">{new Date(cust.createdAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400 text-xs">Nenhum cliente cadastrado ainda. Converta seus leads para visualizá-los aqui!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
