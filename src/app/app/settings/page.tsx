"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Settings,
  Building,
  Save,
  Check,
  Globe,
  Phone,
  MessageCircle,
  Mail,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
  X,
  Server,
  Key,
  Send,
  CheckCircle2,
  Sparkles,
  Info,
  RefreshCw,
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
  const [activeTab, setActiveTab] = useState<"company" | "smtp" | "evolution">("company");
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

  // Evolution API State
  const [evolutionForm, setEvolutionForm] = useState({
    apiUrl: "http://localhost:8080",
    apiKey: "",
    instanceName: "",
    ativo: true,
  });
  const [testingEvolution, setTestingEvolution] = useState(false);
  const [evolutionTestResult, setEvolutionTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
          if (intData.evolution) {
            setEvolutionForm({
              apiUrl: intData.evolution.apiUrl || "http://localhost:8080",
              apiKey: "",
              instanceName: intData.evolution.instanceName || "",
              ativo: intData.evolution.ativo ?? true,
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
      setTimeout(() => setSuccess(null), 3000);
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
      setTimeout(() => setSuccess(null), 3000);
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

  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "evolution",
          ...evolutionForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar Evolution API.");

      setSuccess("Configurações da Evolution API salvas com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar Evolution API.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEvolution = async () => {
    setTestingEvolution(true);
    setEvolutionTestResult(null);

    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_evolution",
          ...evolutionForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na conexão com a Evolution API.");

      setEvolutionTestResult({ success: true, message: data.message });
    } catch (err: any) {
      setEvolutionTestResult({ success: false, message: err.message || "Não foi possível conectar à Evolution API." });
    } finally {
      setTestingEvolution(false);
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
          Gerencie os dados cadastrais da empresa, servidor SMTP para e-mails/recuperação de senha e conexão com a Evolution API.
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

        <button
          type="button"
          onClick={() => setActiveTab("evolution")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "evolution"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>3. Evolution API (WhatsApp Gateway)</span>
        </button>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
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
                Logomarca Oficial
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {logoUrl ? (
                  <div className="relative group w-24 h-24 rounded-2xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center shrink-0 shadow-xs">
                    <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 cursor-pointer transition shrink-0"
                  >
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Enviar Logo</span>
                  </div>
                )}

                <div className="flex-1 text-xs text-slate-500 space-y-2">
                  <p>Formatos suportados: PNG, JPG ou WebP (máximo 2.5 MB). Recomendamos imagem quadrada ou fundo transparente.</p>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs inline-flex items-center gap-1.5"
                  >
                    {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Selecionar Imagem</span>
                  </button>
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
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Razão Social</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nome Fantasia</label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">CNPJ ou CPF</label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(formatDocument(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Segmento de Atuação</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="Serviços">Serviços</option>
                  <option value="Tecnologia">Tecnologia / SaaS</option>
                  <option value="Comércio / Varejo">Comércio / Varejo</option>
                  <option value="Consultoria">Consultoria</option>
                  <option value="Saúde & Beleza">Saúde & Beleza</option>
                  <option value="Educação">Educação</option>
                  <option value="Imobiliário">Imobiliário</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">WhatsApp Principal</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                  placeholder="(00) 90000-0000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Telefone Fixo</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 0000-0000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Descrição da Empresa</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Breve resumo da sua empresa para exibição institucional..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Alterações da Empresa</span>
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SERVIDOR SMTP (E-MAILS & RECUPERAÇÃO DE SENHA)                     */}
      {/* ========================================================================= */}
      {activeTab === "smtp" && (
        <form onSubmit={handleSaveSmtp} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">Servidor SMTP de Envio de E-mails</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                smtpForm.host ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
              }`}>
                {smtpForm.host ? "Configurado" : "Padrão do Sistema"}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O servidor SMTP é utilizado para **recuperação de senhas**, notificações de novos leads e avisos do sistema.
              Você pode usar qualquer provedor SMTP (ex: Gmail, SendGrid, Amazon SES, Hostinger, Locaweb, etc.).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Host SMTP
                </label>
                <input
                  type="text"
                  value={smtpForm.host}
                  onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                  placeholder="smtp.gmail.com ou smtp.sendgrid.net"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Porta SMTP
                </label>
                <input
                  type="number"
                  value={smtpForm.port}
                  onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                  placeholder="587 ou 465"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Usuário / E-mail SMTP
                </label>
                <input
                  type="text"
                  value={smtpForm.user}
                  onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                  placeholder="seuemail@empresa.com"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Senha SMTP / Senha de Aplicativo
                </label>
                <input
                  type="password"
                  value={smtpForm.pass}
                  onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail Remetente (From)
                </label>
                <input
                  type="email"
                  value={smtpForm.fromEmail}
                  onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                  placeholder="no-reply@suaempresa.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                  placeholder="Minha Empresa"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Teste de Disparo */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Testar Conexão e Envio de E-mail:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Informe seu e-mail para receber o teste..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp || !smtpForm.host || !smtpForm.user}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {testingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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

      {/* ========================================================================= */}
      {/* TAB 3: EVOLUTION API (WHATSAPP GATEWAY)                                   */}
      {/* ========================================================================= */}
      {activeTab === "evolution" && (
        <form onSubmit={handleSaveEvolution} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">Servidor Evolution API (WhatsApp Baileys)</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                evolutionForm.apiUrl ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
              }`}>
                {evolutionForm.apiUrl ? "Ativo" : "Não Configurado"}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              A **Evolution API** é o microserviço responsável por gerar os QR Codes reais de pareamento do WhatsApp Web e controlar a caixa de entrada (Inbox).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  URL da Evolution API *
                </label>
                <input
                  type="text"
                  value={evolutionForm.apiUrl}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, apiUrl: e.target.value })}
                  placeholder="http://localhost:8080 ou https://evolution.seusite.com.br"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chave Global da API (AUTHENTICATION_API_KEY)
                </label>
                <input
                  type="password"
                  value={evolutionForm.apiKey}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, apiKey: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome da Instância Padrão (Instance Name)
                </label>
                <input
                  type="text"
                  value={evolutionForm.instanceName}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, instanceName: e.target.value })}
                  placeholder="Ex: minha_empresa_wpp ou comercial"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Identificador padrão da instância no servidor Evolution API. Se preenchido, será sugerido automaticamente ao conectar novos canais de WhatsApp.
                </span>
              </div>
            </div>

            {/* Teste de Conexão Evolution API */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">Verificar Conexão com o Servidor Evolution:</span>
                <button
                  type="button"
                  onClick={handleTestEvolution}
                  disabled={testingEvolution || !evolutionForm.apiUrl}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {testingEvolution ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Testar Conexão Evolution API</span>
                </button>
              </div>

              {evolutionTestResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  evolutionTestResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}>
                  {evolutionTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{evolutionTestResult.message}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Configurações Evolution API</span>
          </button>
        </form>
      )}
    </div>
  );
}
