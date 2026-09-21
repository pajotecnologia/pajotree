"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Building,
  Save,
  Mail,
  Loader2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  RefreshCw,
  X,
} from "lucide-react";

const MAX_IMAGE_SIZE = 2.5 * 1024 * 1024; // 2.5 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
}

function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  } else {
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error("Formato não suportado. Use PNG, JPG ou WebP."));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error("A imagem deve ter no máximo 2.5 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Não foi possível ler a imagem."));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"company" | "smtp">("company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Company Fields
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [segment, setSegment] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);

  // SMTP State
  const [smtpForm, setSmtpForm] = useState({
    host: "",
    port: 587,
    user: "",
    pass: "",
    fromEmail: "",
    fromName: "Pajotree",
    secure: false,
    ativo: true,
  });
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadAllSettings() {
      try {
        const [orgRes, intRes] = await Promise.all([
          fetch("/api/organizations/settings"),
          fetch("/api/settings/integrations"),
        ]);

        if (orgRes.ok) {
          const json = await orgRes.json();
          const org = json.organization;
          if (org) {
            setName(org.name || "");
            setTradeName(org.tradeName || "");
            setDocument(org.document ? formatDocument(org.document) : "");
            setPhone(org.phone ? formatPhone(org.phone) : "");
            setWhatsapp(org.whatsapp ? formatWhatsApp(org.whatsapp) : "");
            setWebsite(org.website || "");
            setSegment(org.segment || "Serviços");
            setDescription(org.description || "");
            setLogoUrl(org.logoUrl || "");
            if (org.domains?.length > 0) {
              setCustomDomain(org.domains[0].domain || "");
            }
          }
        }

        if (intRes.ok) {
          const intData = await intRes.json();
          if (intData.smtp) {
            setSmtpForm({
              host: intData.smtp.host || "",
              port: intData.smtp.port || 587,
              user: intData.smtp.user || "",
              pass: "",
              fromEmail: intData.smtp.fromEmail || "",
              fromName: intData.smtp.fromName || "Pajotree",
              secure: Boolean(intData.smtp.secure),
              ativo: intData.smtp.ativo ?? true,
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllSettings();
  }, []);

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setError(null);
    try {
      const base64 = await readImage(file);
      setLogoUrl(base64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar logomarca.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/organizations/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tradeName,
          document,
          phone,
          whatsapp,
          website,
          segment,
          description,
          logoUrl,
          customDomain,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar dados da empresa");

      setSuccess("Dados da empresa atualizados com sucesso!");
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar dados.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "smtp",
          ...smtpForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar SMTP.");

      setSuccess("Configurações do Servidor SMTP salvas com sucesso!");
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar SMTP.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_smtp",
          testEmail: testEmailAddress,
          ...smtpForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no teste SMTP.");

      setSmtpTestResult({ success: true, message: data.message });
    } catch (err: any) {
      setSmtpTestResult({ success: false, message: err.message || "Erro de conexão SMTP." });
    } finally {
      setTestingSmtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configurações Gerais</h1>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie os dados cadastrais da empresa e servidor SMTP para envio de e-mails e recuperação de senha.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "company"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. Dados da Empresa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("smtp")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "smtp"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>2. Servidor SMTP (E-mails & Recuperação)</span>
        </button>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="p-1 rounded-lg text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-sm font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 rounded-lg text-rose-600 hover:text-rose-900 hover:bg-rose-100/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DADOS DA EMPRESA                                                   */}
      {/* ========================================================================= */}
      {activeTab === "company" && (
        <form onSubmit={handleSaveCompany} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Identificação & Logomarca</span>
            </h3>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Logomarca da Empresa
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0 relative group">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Carregar Logomarca</span>
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                        title="Remover logotipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG ou WebP até 2.5 MB. Esta logo será exibida nas suas páginas públicas e faturas.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Razão Social / Nome Oficial *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Minha Empresa LTDA"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Fantasia (Marca Comercial)
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: Pajotree Studio"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  CNPJ ou CPF
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(formatDocument(e.target.value))}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Segmento de Atuação
                </label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="Serviços">Serviços</option>
                  <option value="Comércio / Varejo">Comércio / Varejo</option>
                  <option value="Infoprodutos / Educação">Infoprodutos / Educação</option>
                  <option value="Saúde & Beleza">Saúde & Beleza</option>
                  <option value="Tecnologia & Software">Tecnologia & Software</option>
                  <option value="Agência & Marketing">Agência & Marketing</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telefone Comercial
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 3333-4444"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp Principal
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                  placeholder="(11) 99999-8888"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Website / Domínio Principal
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://meusite.com.br"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descrição Curta da Empresa
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Conte um pouco sobre sua empresa ou seus serviços..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Informações da Empresa</span>
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SERVIDOR SMTP                                                      */}
      {/* ========================================================================= */}
      {activeTab === "smtp" && (
        <form onSubmit={handleSaveSmtp} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">Configuração de Servidor SMTP</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                smtpForm.host ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
              }`}>
                {smtpForm.host ? "Configurado" : "Padrão do Sistema"}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Configure seu próprio servidor SMTP (HostGator, Locaweb, SendGrid, Amazon SES, Gmail, etc.) para que todos os e-mails de recuperação de senha, boas-vindas e faturas sejam enviados com o remetente oficial da sua empresa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Host SMTP *
                </label>
                <input
                  type="text"
                  value={smtpForm.host}
                  onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                  placeholder="smtp.seusite.com.br ou smtp.sendgrid.net"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Porta SMTP *
                </label>
                <input
                  type="number"
                  value={smtpForm.port}
                  onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                  placeholder="587 ou 465"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Usuário SMTP *
                </label>
                <input
                  type="text"
                  value={smtpForm.user}
                  onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                  placeholder="contato@seusite.com.br"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Senha SMTP *
                </label>
                <input
                  type="password"
                  value={smtpForm.pass}
                  onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail Remetente (FROM)
                </label>
                <input
                  type="email"
                  value={smtpForm.fromEmail}
                  onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                  placeholder="nao-responda@seusite.com.br"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome do Remetente
                </label>
                <input
                  type="text"
                  value={smtpForm.fromName}
                  onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                  placeholder="Ex: Pajotree Atendimento"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="smtp-secure"
                checked={smtpForm.secure}
                onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="smtp-secure" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Usar SSL/TLS Seguro (Porta 465). Deixe desmarcado para STARTTLS (Porta 587/25).
              </label>
            </div>

            {/* Teste de Envio */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Testar Conexão e Disparo de E-mail:</span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Insira seu e-mail para receber o teste"
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp || !smtpForm.host || !smtpForm.user}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {testingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Enviar E-mail de Teste</span>
                </button>
              </div>

              {smtpTestResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  smtpTestResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}>
                  {smtpTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{smtpTestResult.message}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Configurações SMTP</span>
          </button>
        </form>
      )}
    </div>
  );
}
