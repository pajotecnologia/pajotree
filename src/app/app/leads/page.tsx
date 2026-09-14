"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  MessageCircle,
  Loader2,
  UserCheck,
  FileText,
  Sparkles,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Filter,
  User,
  Check,
} from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"leads" | "customers">("leads");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  async function loadData() {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const json = await res.json();
        setLeads(json.leads || []);
        setCustomers(json.customers || []);
        setNewLeadsCount(json.newLeadsCount || 0);
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

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    setUpdatingStatusId(leadId);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", leadId, status: newStatus }),
      });
      if (res.ok) await loadData();
    } catch (err) {
      console.error("Erro ao atualizar status do lead:", err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.phone && l.phone.includes(search)) ||
      (l.whatsapp && l.whatsapp.includes(search)) ||
      (l.message && l.message.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ? true : l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search))
  );

  const formatPhoneHref = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, "");
    if (!digits) return "";
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">
              Leads & Base de Clientes
            </h1>
            {newLeadsCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold animate-pulse shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>{newLeadsCount} {newLeadsCount === 1 ? "Novo Lead" : "Novos Leads"}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualize contatos capturados pelo formulário público, mensagens enviadas e converta leads em clientes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex w-full sm:w-auto items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab("leads")}
            className={`min-h-11 flex-1 sm:flex-none px-4 rounded-lg transition flex items-center justify-center gap-2 whitespace-nowrap ${
              tab === "leads"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span>Leads Capturados</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              tab === "leads" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {leads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("customers")}
            className={`min-h-11 flex-1 sm:flex-none px-4 rounded-lg transition flex items-center justify-center gap-2 whitespace-nowrap ${
              tab === "customers"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span>Base de Clientes</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              tab === "customers" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {customers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, telefone ou mensagem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-11 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
          />
        </div>

        {tab === "leads" && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-[11px] font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Todos ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("NEW")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "NEW" ? "bg-emerald-600 text-white" : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
              <span>Novos ({leads.filter((l) => l.status === "NEW").length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CONTACTED")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === "CONTACTED" ? "bg-amber-600 text-white" : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              Contatados ({leads.filter((l) => l.status === "CONTACTED").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CONVERTED")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === "CONVERTED" ? "bg-indigo-600 text-white" : "text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              Convertidos ({leads.filter((l) => l.status === "CONVERTED").length})
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      {tab === "leads" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="responsive-data-table w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Lead / Contato</th>
                  <th className="p-4">Origem & Canal</th>
                  <th className="p-4">Mensagem do Formulário</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4 text-right pr-6">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => {
                    const isNew = lead.status === "NEW";
                    const isFromForm =
                      lead.source?.includes("form") ||
                      lead.source === "public_page_contact_block" ||
                      lead.message;

                    return (
                      <tr
                        key={lead.id}
                        className={`transition hover:bg-slate-50/80 ${
                          isNew ? "bg-emerald-50/25 border-l-4 border-l-emerald-500" : ""
                        }`}
                      >
                        {/* Lead / Contato */}
                        <td data-label="Lead / Contato" className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                isNew
                                  ? "bg-emerald-500 text-white ring-2 ring-emerald-200"
                                  : "bg-indigo-50 border border-indigo-100 text-indigo-700"
                              }`}
                            >
                              {lead.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 block break-words">
                                  {lead.name}
                                </span>
                                {isNew && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    NOVO
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-0.5 mt-0.5 text-[11px] text-slate-500">
                                {lead.whatsapp && (
                                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                    <Phone className="w-3 h-3" />
                                    {lead.whatsapp}
                                  </span>
                                )}
                                {lead.email && (
                                  <span className="flex items-center gap-1 text-slate-500 truncate">
                                    <Mail className="w-3 h-3" />
                                    {lead.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Origem & Canal */}
                        <td data-label="Origem & Canal" className="p-4">
                          {isFromForm ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Formulário do Site</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                              <span>{lead.source || "Página Pública"}</span>
                            </div>
                          )}
                          {lead.page?.title && (
                            <span className="block text-[10px] text-slate-400 mt-1 truncate max-w-[140px]">
                              Página: {lead.page.title}
                            </span>
                          )}
                        </td>

                        {/* Mensagem do Formulário */}
                        <td data-label="Mensagem" className="p-4 max-w-sm">
                          {lead.message ? (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 text-xs space-y-1">
                              <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold">
                                <MessageSquare className="w-3 h-3" />
                                <span>Mensagem enviada:</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed italic text-[11px]">
                                "{lead.message}"
                              </p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Sem mensagem</span>
                          )}
                        </td>

                        {/* Status */}
                        <td data-label="Status" className="p-4">
                          {lead.status === "NEW" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Novo Lead
                            </span>
                          )}
                          {lead.status === "CONTACTED" && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Contatado
                            </span>
                          )}
                          {lead.status === "CONVERTED" && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Convertido
                            </span>
                          )}
                        </td>

                        {/* Data / Hora */}
                        <td data-label="Data / Hora" className="p-4 text-slate-500 text-[11px]">
                          <span className="font-semibold text-slate-700 block">
                            {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(lead.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>

                        {/* Ações Rápidas */}
                        <td data-label="Ações" className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-start sm:justify-end flex-wrap gap-1.5">
                            {lead.whatsapp && (
                              <a
                                href={`https://wa.me/${formatPhoneHref(lead.whatsapp)}${
                                  lead.message ? `?text=${encodeURIComponent(`Olá ${lead.name}, recebemos sua mensagem através do nosso site!`)}` : ""
                                }`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1.5"
                                title="Iniciar Conversa no WhatsApp com DDI"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                                <span>WhatsApp</span>
                              </a>
                            )}

                            {lead.status === "NEW" && (
                              <button
                                type="button"
                                disabled={updatingStatusId === lead.id}
                                onClick={() => handleUpdateStatus(lead.id, "CONTACTED")}
                                className="min-h-10 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold transition flex items-center gap-1"
                                title="Marcar como Contatado"
                              >
                                <Check className="w-3.5 h-3.5 text-amber-600" />
                                <span className="hidden sm:inline">Atendido</span>
                              </button>
                            )}

                            {lead.status !== "CONVERTED" && (
                              <button
                                type="button"
                                onClick={() => handleConvertToCustomer(lead.id)}
                                disabled={convertingId === lead.id}
                                className="min-h-10 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                                title="Converter em Cliente na Base"
                              >
                                {convertingId === lead.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                                <span>Converter</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 text-xs">
                      Nenhum lead encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {tab === "customers" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="responsive-data-table w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Cliente</th>
                  <th className="p-4">Canais de Contato</th>
                  <th className="p-4">Empresa / Documento</th>
                  <th className="p-4">Data de Cadastro</th>
                  <th className="p-4 text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/60 transition">
                      <td data-label="Cliente" className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{customer.name}</span>
                            <span className="text-[10px] text-slate-400">Cliente Oficial</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Contato" className="p-4">
                        <div className="space-y-0.5 text-[11px]">
                          {customer.whatsapp && (
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <Phone className="w-3 h-3" />
                              {customer.whatsapp}
                            </span>
                          )}
                          {customer.email && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Empresa / Documento" className="p-4 text-slate-600 text-[11px]">
                        {customer.company || customer.document || "Pessoa Física"}
                      </td>
                      <td data-label="Data" className="p-4 text-slate-500 text-[11px]">
                        {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td data-label="Ações" className="p-4 pr-6 text-right">
                        {customer.whatsapp && (
                          <a
                            href={`https://wa.me/${formatPhoneHref(customer.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition items-center gap-1.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 text-xs">
                      Nenhum cliente cadastrado ainda. Converta seus leads para preencher esta lista!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
