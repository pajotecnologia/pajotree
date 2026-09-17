"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  Check,
  Globe,
  Loader2,
  Palette,
  Save,
  Sparkles,
  Type,
  Upload,
  ExternalLink,
  HelpCircle,
  Copy,
  CheckCircle2,
  Info,
  X,
  Building2,
  RefreshCw,
  Layers,
  CreditCard,
  Package,
  Users,
  Key,
  Plus,
  Trash2,
  Edit3,
  MessageSquare,
} from "lucide-react";

const FONTS = [
  { label: "Inter (Moderno & Neutro)", value: "Inter" },
  { label: "Poppins (Geométrico & Jovial)", value: "Poppins" },
  { label: "Roboto (Clássico & Limpo)", value: "Roboto" },
  { label: "Montserrat (Elegante & Marcante)", value: "Montserrat" },
  { label: "DM Sans (Minimalista Tech)", value: "DM Sans" },
  { label: "Open Sans (Amigável & Legível)", value: "Open Sans" },
  { label: "Lato (Corporativo & Equilibrado)", value: "Lato" },
  { label: "Nunito (Arredondado & Suave)", value: "Nunito" },
  { label: "Playfair Display (Sofisticado & Editorial)", value: "Playfair Display" },
] as const;

type FontName = (typeof FONTS)[number]["value"];

type WhiteLabelData = {
  brandName: string;
  description: string;
  whatsapp: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundType: "gradient" | "image";
  backgroundValue: string;
  buttonStyle: "square" | "rounded" | "rounded-xl" | "pill" | "glass";
  fontFamily: FontName;
  customDomain: string;
  domainStatus?: string;
  removeBrandingActive: boolean;
};

const DEFAULTS: WhiteLabelData = {
  brandName: "Minha Empresa",
  description: "",
  whatsapp: "",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#0f172a",
  secondaryColor: "#334155",
  textColor: "#ffffff",
  backgroundType: "gradient",
  backgroundValue: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  buttonStyle: "rounded-xl",
  fontFamily: "Inter",
  customDomain: "",
  domainStatus: "PENDING",
  removeBrandingActive: false,
};

export default function WhiteLabelPage() {
  const [activeTab, setActiveTab] = useState<"branding" | "payments" | "plans" | "clients" | "landing">("branding");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(1);

  // Branding State
  const [form, setForm] = useState<WhiteLabelData>(DEFAULTS);
  const [copiedDns, setCopiedDns] = useState<string | null>(null);
  const [verifyingDns, setVerifyingDns] = useState(false);
  const [dnsResult, setDnsResult] = useState<{ verified: boolean; message: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Landing Page State
  const [landingConfig, setLandingConfig] = useState({
    headline: "",
    subtitle: "",
    badgeText: "A Plataforma de Gestão e Bio Links",
    ctaText: "Começar Gratuitamente",
    ctaSecondaryText: "Falar com Especialista",
    whatsappContact: "",
    themeColor: "#0f172a",
    showHero: true,
    showFeatures: true,
    showPricing: true,
    showTestimonials: true,
    showFaq: true,
  });
  const [landingPublicUrl, setLandingPublicUrl] = useState("");
  const [savingLanding, setSavingLanding] = useState(false);
  const [copiedLandingUrl, setCopiedLandingUrl] = useState(false);

  // Banco Inter / Gateway State
  const [gatewayForm, setGatewayForm] = useState({
    clientId: "",
    clientSecret: "",
    certCrt: "",
    certKey: "",
    chavePix: "",
    contaCorrente: "",
    ambiente: "PRODUCAO" as "PRODUCAO" | "SANDBOX",
    ativo: true,
    webhookUrl: "",
  });
  const [gatewayConfigured, setGatewayConfigured] = useState(false);
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingGateway, setSavingGateway] = useState(false);

  // Plans Management State
  const [customPlans, setCustomPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // Clients / Sub-Tenants State
  const [clientsData, setClientsData] = useState<{ summary: any; clients: any[] }>({
    summary: { totalClients: 0, activeClients: 0, trialClients: 0, monthlyRevenue: 0 },
    clients: [],
  });
  const [orgId, setOrgId] = useState<string>("");

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [wlRes, gwRes, plansRes, clientsRes, meRes, landRes] = await Promise.all([
        fetch("/api/settings/white-label"),
        fetch("/api/white-label/gateway"),
        fetch("/api/white-label/plans"),
        fetch("/api/white-label/clients"),
        fetch("/api/auth/me"),
        fetch("/api/white-label/landing"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setOrgId(meData.organization?.id || "");
      }

      if (wlRes.ok) {
        const data = await wlRes.json();
        setForm({
          ...DEFAULTS,
          ...data.whiteLabel,
          removeBrandingActive: Boolean(data.whiteLabel?.removeBrandingActive),
        });
      }

      if (landRes.ok) {
        const landData = await landRes.json();
        if (landData.config) {
          setLandingConfig((prev) => ({ ...prev, ...landData.config }));
        }
        if (landData.publicUrl) {
          setLandingPublicUrl(landData.publicUrl);
        }
      }

      if (gwRes.ok) {
        const gwData = await gwRes.json();
        setGatewayConfigured(Boolean(gwData.configured));
        if (gwData.gateway) {
          setGatewayForm((prev) => ({
            ...prev,
            ambiente: gwData.gateway.ambiente || "PRODUCAO",
            ativo: gwData.gateway.ativo ?? true,
            chavePix: gwData.gateway.chavePix || "",
            contaCorrente: gwData.gateway.contaCorrente || "",
            webhookUrl: gwData.gateway.webhookUrl || "",
          }));
        }
      }

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setCustomPlans(pData.plans || []);
      }

      if (clientsRes.ok) {
        const cData = await clientsRes.json();
        setClientsData(cData);
      }
    } catch {
      setError("Falha ao carregar configurações White Label.");
    } finally {
      setLoading(false);
    }
  }

  // Google Font Loader
  useEffect(() => {
    const linkId = "dynamic-google-fonts-preview";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const fontQuery = FONTS.map((f) => f.value.replace(/ /g, "+") + ":wght@400;600;700").join("&family=");
    link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
  }, []);

  const backgroundCss = useMemo(() => {
    if (form.backgroundType === "image" && form.backgroundValue) {
      const cleanVal = form.backgroundValue.startsWith("url(")
        ? form.backgroundValue
        : `url('${form.backgroundValue}')`;
      return `${cleanVal} center/cover no-repeat fixed`;
    }
    return form.backgroundValue || DEFAULTS.backgroundValue;
  }, [form.backgroundType, form.backgroundValue]);

  const buttonClass = useMemo(() => {
    switch (form.buttonStyle) {
      case "square": return "rounded-none";
      case "rounded": return "rounded-md";
      case "pill": return "rounded-full";
      case "glass": return "rounded-lg backdrop-blur-md bg-white/20 border border-white/30 text-white";
      default: return "rounded-lg";
    }
  }, [form.buttonStyle]);

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/settings/white-label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao salvar");

      setSuccess("Identidade visual e domínio salvos com sucesso.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyDns() {
    if (!form.customDomain) {
      setError("Informe o domínio próprio primeiro.");
      return;
    }
    setVerifyingDns(true);
    setDnsResult(null);

    try {
      const res = await fetch("/api/settings/white-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: form.customDomain }),
      });
      const data = await res.json();
      setDnsResult({
        verified: Boolean(data.verified),
        message: data.message || (data.verified ? "Domínio verificado com sucesso." : "Apontamento DNS ainda não propagado."),
      });
      if (data.verified) {
        setForm((prev) => ({ ...prev, domainStatus: "VERIFIED" }));
      }
    } catch {
      setDnsResult({ verified: false, message: "Erro ao testar conexão DNS." });
    } finally {
      setVerifyingDns(false);
    }
  }

  async function handleSaveGateway(e: React.FormEvent) {
    e.preventDefault();
    setSavingGateway(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/white-label/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gatewayForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao salvar credenciais do Banco Inter.");

      setSuccess("Credenciais do Banco Inter salvas com sucesso.");
      setGatewayConfigured(true);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar gateway.");
    } finally {
      setSavingGateway(false);
    }
  }

  async function handleTestGateway() {
    setTestingGateway(true);
    setGatewayTestResult(null);

    try {
      const res = await fetch("/api/white-label/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection", ...gatewayForm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no teste.");

      setGatewayTestResult({ success: true, message: data.message });
    } catch (err: any) {
      setGatewayTestResult({ success: false, message: err.message || "Falha na conexão mTLS." });
    } finally {
      setTestingGateway(false);
    }
  }

  async function handleRegisterWebhook() {
    if (!gatewayForm.webhookUrl) {
      setError("Informe a URL do Webhook.");
      return;
    }
    setTestingGateway(true);
    try {
      const res = await fetch("/api/white-label/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register_webhook", ...gatewayForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no registro do webhook.");
      setSuccess("Webhook registrado com sucesso no Banco Inter.");
    } catch (err: any) {
      setError(err.message || "Erro ao registrar webhook.");
    } finally {
      setTestingGateway(false);
    }
  }

  function handleOpenNewPlanModal(planToEdit?: any) {
    if (planToEdit) {
      setEditingPlan({
        ...planToEdit,
        priceMonthly: Number(planToEdit.priceMonthly),
        priceYearly: Number(planToEdit.priceYearly),
        features: planToEdit.features[0] || {
          maxPages: 3,
          maxLinks: 20,
          maxUsers: 2,
          maxLeads: 500,
          maxForms: 3,
          customDomainAllowed: true,
          crmAllowed: true,
          removeBranding: true,
        },
      });
    } else {
      setEditingPlan({
        name: "Plano Pro",
        description: "Acesso completo aos recursos com CRM e Tracking",
        priceMonthly: 49.90,
        priceYearly: 479.00,
        trialDays: 7,
        status: "ACTIVE",
        features: {
          maxPages: 5,
          maxLinks: 50,
          maxUsers: 3,
          maxLeads: 1000,
          maxForms: 5,
          maxMetaPixels: 2,
          maxAutomations: 5,
          maxStorageMb: 200,
          customDomainAllowed: true,
          crmAllowed: true,
          advancedAnalytics: true,
          removeBranding: true,
        },
      });
    }
    setIsPlanModalOpen(true);
  }

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    setSavingPlan(true);
    setError(null);

    try {
      const isEdit = Boolean(editingPlan.id);
      const res = await fetch("/api/white-label/plans", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar plano.");

      setSuccess(isEdit ? "Plano atualizado com sucesso." : "Novo plano criado com sucesso.");
      setIsPlanModalOpen(false);
      const plansRes = await fetch("/api/white-label/plans");
      if (plansRes.ok) {
        const pData = await plansRes.json();
        setCustomPlans(pData.plans || []);
      }
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar plano.");
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleDeletePlan(id: string) {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;
    try {
      const res = await fetch(`/api/white-label/plans?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir plano.");

      setSuccess("Plano excluído com sucesso.");
      setCustomPlans((prev) => prev.filter((p) => p.id !== id));
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Erro ao excluir plano.");
    }
  }

  async function handleSaveLanding(e: React.FormEvent) {
    e.preventDefault();
    setSavingLanding(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/white-label/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(landingConfig),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar página.");
      setSuccess("Landing Page salva com sucesso.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar landing page.");
    } finally {
      setSavingLanding(false);
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedDns(key);
    setTimeout(() => setCopiedDns(null), 2500);
  }

  const cleanCustomDomain = form.customDomain?.replace(/^https?:\/\//, "").trim();

  const referralUrl = cleanCustomDomain
    ? `https://${cleanCustomDomain}/register?ref=${orgId}`
    : (typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${orgId}`
      : `https://tree.pajotech.com.br/register?ref=${orgId}`);

  const defaultLandingUrl = cleanCustomDomain
    ? `https://${cleanCustomDomain}`
    : (landingPublicUrl || (typeof window !== "undefined"
      ? `${window.location.origin}/wl/${orgId}`
      : `/wl/${orgId}`));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
        <p className="text-slate-500 text-xs">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Top Header Card - Discreto, Limpo e Confortável */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-slate-600 text-xs font-medium">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Painel de Gerenciamento White Label</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Personalização & Revenda
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              Gerencie a identidade visual da sua agência, configure seu domínio próprio, pagamentos via Pix e planos de assinatura.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsGuideOpen(true);
                setGuideStep(1);
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Guia Passo a Passo</span>
            </button>
            <div className="bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Clientes Ativos</span>
              <span className="text-sm font-bold text-slate-900">{clientsData.summary.activeClients}</span>
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Faturamento Mensal</span>
              <span className="text-sm font-bold text-slate-900">
                R$ {Number(clientsData.summary.monthlyRevenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Discreta e Neutra */}
        <div className="flex flex-wrap gap-1 mt-5 pt-4 border-t border-slate-100">
          {[
            { id: "branding", label: "1. Marca & Domínio", icon: Palette },
            { id: "payments", label: "2. Pagamentos (Banco Inter)", icon: CreditCard, hasBadge: gatewayConfigured },
            { id: "plans", label: `3. Meus Planos (${customPlans.length})`, icon: Package },
            { id: "clients", label: `4. Meus Clientes (${clientsData.clients.length})`, icon: Users },
            { id: "landing", label: "5. Landing Page de Vendas", icon: Sparkles },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100/70 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.hasBadge && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: IDENTIDADE VISUAL & DOMÍNIO                                        */}
      {/* ========================================================================= */}
      {activeTab === "branding" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveBranding} className="lg:col-span-7 space-y-6">
            {/* Informações da Marca */}
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Marca & Logomarca</h2>
                  <p className="text-xs text-slate-500">Nome fantasia e logotipo para seus usuários</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nome da Sua Marca / Empresa
                  </label>
                  <input
                    type="text"
                    value={form.brandName}
                    onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                    placeholder="Ex: Agência Ignis"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    WhatsApp de Atendimento & Contato da Empresa
                  </label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="Ex: 87996836855"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Utilizado nos botões de WhatsApp e no rodapé das suas páginas.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Logomarca da Empresa
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {form.logoUrl ? (
                      <div className="relative group w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center shrink-0">
                        <img src={form.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, logoUrl: null })}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow hover:bg-rose-700 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        className="w-20 h-20 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition shrink-0"
                      >
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium">Enviar Logo</span>
                      </div>
                    )}

                    <div className="flex-1 text-xs text-slate-500 space-y-2">
                      <p>Formatos suportados: PNG, JPG ou WebP (máximo 2.5 MB). Recomendamos imagem com fundo transparente.</p>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Selecionar Arquivo</span>
                      </button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setForm({ ...form, logoUrl: reader.result as string });
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Domínio Próprio & DNS */}
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Domínio Próprio & DNS</h2>
                    <p className="text-xs text-slate-500">Conecte seu subdomínio exclusivo para a sua marca</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {form.domainStatus === "VERIFIED" || dnsResult?.verified ? (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Conectado</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pendente DNS</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card de Domínio Ativo */}
              {form.customDomain && (
                <div className="p-3.5 rounded-lg bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Endereço Configurado</span>
                    <span className="font-mono text-xs font-semibold text-white">
                      https://{form.customDomain.replace(/^https?:\/\//, "")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleCopy(`https://${form.customDomain.replace(/^https?:\/\//, "")}`, "custom-url")}
                      className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedDns === "custom-url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDns === "custom-url" ? "Copiado" : "Copiar"}</span>
                    </button>
                    <a
                      href={`https://${form.customDomain.replace(/^https?:\/\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-md bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Domínio ou Subdomínio
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.customDomain}
                      onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                      placeholder="Ex: bio.agenciaignis.com.br"
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyDns}
                      disabled={verifyingDns || !form.customDomain}
                      className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {verifyingDns ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Verificar DNS</span>
                    </button>
                  </div>
                </div>

                {dnsResult && (
                  <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    dnsResult.verified ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {dnsResult.verified ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Info className="w-4 h-4 text-slate-500 shrink-0" />}
                    <span>{dnsResult.message}</span>
                  </div>
                )}

                {/* Tabela de Apontamentos DNS */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 block text-xs">
                      Tabela de Apontamento DNS:
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                      CNAME
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase">
                          <th className="py-2 px-2.5">Tipo</th>
                          <th className="py-2 px-2.5">Nome / Host</th>
                          <th className="py-2 px-2.5">Destino / Valor</th>
                          <th className="py-2 px-2.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 font-mono text-xs">
                        <tr className="bg-white">
                          <td className="py-2.5 px-2.5 font-bold text-slate-900">CNAME</td>
                          <td className="py-2.5 px-2.5">bio</td>
                          <td className="py-2.5 px-2.5 font-semibold text-slate-800">tree.pajotech.com.br</td>
                          <td className="py-2.5 px-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy("tree.pajotech.com.br", "cname")}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              {copiedDns === "cname" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedDns === "cname" ? "Copiado" : "Copiar"}</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-600 space-y-1 text-[11px]">
                    <p className="font-semibold text-slate-800">Orientações de Configuração:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      <li><strong>Cloudflare:</strong> Ao criar o CNAME, configure como <em>DNS Only (Nuvem Cinza)</em> inicialmente ou <em>Proxied (Nuvem Laranja)</em> com SSL em modo Full.</li>
                      <li><strong>Coolify:</strong> No painel do Coolify, informe seu domínio <code>https://{form.customDomain || 'bio.agenciaignis.com.br'}</code>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipografia & Formato */}
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Tipografia & Botões</h2>
                  <p className="text-xs text-slate-500">Formato e fonte padrão das suas páginas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Fonte do Sistema & Páginas
                  </label>
                  <select
                    value={form.fontFamily}
                    onChange={(e) => setForm({ ...form, fontFamily: e.target.value as FontName })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Estilo dos Botões
                  </label>
                  <select
                    value={form.buttonStyle}
                    onChange={(e) => setForm({ ...form, buttonStyle: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="rounded-xl">Arredondado Moderno (Padrão)</option>
                    <option value="pill">Pílula Redonda</option>
                    <option value="rounded">Levemente Arredondado</option>
                    <option value="square">Quadrado Minimalista</option>
                    <option value="glass">Vidro Translúcido (Glass)</option>
                  </select>
                </div>
              </div>

              {/* Remover Marca */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-900 block">Ocultar Créditos no Rodapé</span>
                  <span className="text-[11px] text-slate-500 block">Remove quaisquer menções externas nas páginas e formulários públicos</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={form.removeBrandingActive}
                    onChange={(e) => setForm({ ...form, removeBrandingActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar Alterações</span>
            </button>
          </form>

          {/* Live Preview Discreto */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>Prévia em Tempo Real</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{form.fontFamily}</span>
              </div>

              <div
                className="w-full max-w-[320px] mx-auto rounded-3xl p-5 border border-slate-300 shadow-sm min-h-[520px] flex flex-col justify-between relative overflow-hidden transition-all duration-200"
                style={{
                  background: backgroundCss,
                  color: form.textColor,
                  fontFamily: form.fontFamily,
                }}
              >
                <div className="space-y-5 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/10 backdrop-blur-xs border border-white/20 p-2 flex items-center justify-center overflow-hidden">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 opacity-80" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base leading-tight">{form.brandName}</h3>
                    <p className="text-[11px] opacity-75 mt-0.5">Conecte-se conosco através dos canais oficiais</p>
                  </div>

                  <div className="space-y-2">
                    <div className={`p-2.5 text-xs font-medium text-center bg-white/15 backdrop-blur-xs border border-white/20 transition ${buttonClass}`}>
                      <span>Falar no WhatsApp</span>
                    </div>
                    <div className={`p-2.5 text-xs font-medium text-center bg-white/15 backdrop-blur-xs border border-white/20 transition ${buttonClass}`}>
                      <span>Conhecer Nossos Planos</span>
                    </div>
                    <div className={`p-2.5 text-xs font-medium text-center bg-white/15 backdrop-blur-xs border border-white/20 transition ${buttonClass}`}>
                      <span>Agendar Demonstração</span>
                    </div>
                  </div>
                </div>

                {!form.removeBrandingActive && (
                  <div className="text-center pt-4 opacity-60 text-[9px] font-medium">
                    <span>Criado com {form.brandName || "Minha Empresa"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GERENCIAR PAGAMENTOS (BANCO INTER)                                 */}
      {/* ========================================================================= */}
      {activeTab === "payments" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveGateway} className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Banco Inter PJ (Pix Automático)</h2>
                    <p className="text-xs text-slate-500">Receba mensalidades diretamente na sua conta corrente via mTLS</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium ${
                    gatewayConfigured ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                  }`}>
                    {gatewayConfigured ? "Configurado" : "Pendente"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ambiente
                    </label>
                    <select
                      value={gatewayForm.ambiente}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, ambiente: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                    >
                      <option value="PRODUCAO">Produção (Ambiente Real)</option>
                      <option value="SANDBOX">Sandbox (Ambiente de Testes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Chave Pix (Opcional)
                    </label>
                    <input
                      type="text"
                      value={gatewayForm.chavePix}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, chavePix: e.target.value })}
                      placeholder="CNPJ, E-mail ou Chave Aleatória"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Client ID (da sua aplicação no Banco Inter)
                  </label>
                  <input
                    type="text"
                    value={gatewayForm.clientId}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, clientId: e.target.value })}
                    placeholder="Ex: 12345678-abcd-1234-abcd-123456789abc"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={gatewayForm.clientSecret}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, clientSecret: e.target.value })}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                {/* Uploads ou Colagem dos Certificados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Certificado (.crt)
                    </label>
                    <textarea
                      value={gatewayForm.certCrt}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, certCrt: e.target.value })}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Chave Privada (.key)
                    </label>
                    <textarea
                      value={gatewayForm.certKey}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, certKey: e.target.value })}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    URL do Webhook (para baixa automática)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={gatewayForm.webhookUrl || `${typeof window !== "undefined" ? window.location.origin : "https://tree.pajotech.com.br"}/api/webhooks/banco-inter`}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, webhookUrl: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleRegisterWebhook}
                      className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition shrink-0 cursor-pointer"
                    >
                      Registrar
                    </button>
                  </div>
                </div>

                {gatewayTestResult && (
                  <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    gatewayTestResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}>
                    {gatewayTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{gatewayTestResult.message}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestGateway}
                  disabled={testingGateway}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {testingGateway ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  <span>Testar Conexão mTLS</span>
                </button>

                <button
                  type="submit"
                  disabled={savingGateway}
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingGateway ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar Credenciais</span>
                </button>
              </div>
            </div>
          </form>

          {/* Guia Discreto do Banco Inter */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Integração Banco Inter PJ</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gera cobranças Pix e Bolepix com conciliação automática diretamente na sua conta corrente PJ.
              </p>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <strong className="text-slate-800 block text-[11px]">1. Acesse o Internet Banking PJ</strong>
                  <span className="text-slate-500 text-[11px]">Vá em Conta Digital PJ &gt; Gestão de Acessos &gt; API</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <strong className="text-slate-800 block text-[11px]">2. Crie uma Nova Aplicação</strong>
                  <span className="text-slate-500 text-[11px]">Selecione o escopo Cobrança / Boletos e baixe o certificado (.crt e .key).</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <strong className="text-slate-800 block text-[11px]">3. Cole os Certificados</strong>
                  <span className="text-slate-500 text-[11px]">Abra os arquivos no bloco de notas e cole o conteúdo completo nos campos correspondentes.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GERENCIAR MEUS PLANOS                                              */}
      {/* ========================================================================= */}
      {activeTab === "plans" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Planos de Assinatura para Seus Clientes</h2>
              <p className="text-xs text-slate-500">Crie e edite os planos comercializados na sua plataforma</p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNewPlanModal()}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Plano</span>
            </button>
          </div>

          {customPlans.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200 space-y-3 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900">Nenhum plano cadastrado ainda</h3>
              <p className="text-xs text-slate-500">
                Cadastre seus pacotes de assinatura com limites e preços personalizados.
              </p>
              <button
                type="button"
                onClick={() => handleOpenNewPlanModal()}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition cursor-pointer"
              >
                Criar Primeiro Plano
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {customPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl p-5 border border-slate-200 transition flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
                        plan.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                      }`}>
                        {plan.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenNewPlanModal(plan)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Editar Plano"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Excluir Plano"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 min-h-[30px]">{plan.description || "Sem descrição."}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-semibold text-slate-500">R$</span>
                        <span className="text-xl font-bold text-slate-900">
                          {Number(plan.priceMonthly).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-slate-500">/mês</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Anual: R$ {Number(plan.priceYearly).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({plan.trialDays} dias trial)
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Até <strong>{plan.features?.[0]?.maxPages || 1}</strong> páginas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Até <strong>{plan.features?.[0]?.maxLinks || 10}</strong> links</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Até <strong>{plan.features?.[0]?.maxLeads || 100}</strong> leads</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{plan._count?.organizations || 0} assinantes</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de Criação / Edição de Plano */}
          {isPlanModalOpen && editingPlan && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingPlan.id ? "Editar Plano de Assinatura" : "Criar Novo Plano"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePlan} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nome do Plano
                      </label>
                      <input
                        type="text"
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Dias de Teste (Trial Grátis)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={editingPlan.trialDays}
                        onChange={(e) => setEditingPlan({ ...editingPlan, trialDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descrição do Plano
                    </label>
                    <input
                      type="text"
                      value={editingPlan.description || ""}
                      onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                      placeholder="Ex: Ideal para profissionais e pequenos negócios"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preço Mensal (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingPlan.priceMonthly}
                        onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preço Anual (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingPlan.priceYearly}
                        onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Limites e Recursos */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                    <span className="text-xs font-semibold text-slate-800 block">Limites Inclusos:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block uppercase">Máx. Páginas</label>
                        <input
                          type="number"
                          value={editingPlan.features.maxPages}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, maxPages: Number(e.target.value) } })}
                          className="w-full p-2 bg-white rounded-md border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block uppercase">Máx. Links</label>
                        <input
                          type="number"
                          value={editingPlan.features.maxLinks}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, maxLinks: Number(e.target.value) } })}
                          className="w-full p-2 bg-white rounded-md border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block uppercase">Máx. Leads</label>
                        <input
                          type="number"
                          value={editingPlan.features.maxLeads}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, maxLeads: Number(e.target.value) } })}
                          className="w-full p-2 bg-white rounded-md border border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(false)}
                      className="px-3.5 py-2 rounded-lg text-slate-600 font-medium text-xs hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingPlan}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {savingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Salvar Plano</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEUS CLIENTES (SUB-TENANTS)                                        */}
      {/* ========================================================================= */}
      {activeTab === "clients" && (
        <div className="space-y-5">
          {/* Link de Onboarding */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-900 block">Link de Cadastro para Seus Clientes</span>
              <p className="text-xs text-slate-500">
                Divulgue este link para novos clientes se cadastrarem na sua plataforma.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 w-full md:w-80 select-all outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(referralUrl, "ref")}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDns === "ref" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDns === "ref" ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
          </div>

          {/* Tabela de Clientes */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Empresas Cadastradas</h3>
                <p className="text-xs text-slate-500">Lista completa de clientes e faturamento</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                {clientsData.clients.length} {clientsData.clients.length === 1 ? "Cliente" : "Clientes"}
              </span>
            </div>

            {clientsData.clients.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Nenhum cliente cadastrado ainda</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Compartilhe seu link de cadastro ou configure seu domínio próprio para começar a receber novos assinantes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Empresa / Cliente</th>
                      <th className="py-3 px-4">Responsável</th>
                      <th className="py-3 px-4">WhatsApp</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {clientsData.clients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {c.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span>{c.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span>{c.owner?.name || c.name}</span>
                          <span className="text-[10px] text-slate-400 block">{c.email}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          {c.whatsapp ? (
                            <a
                              href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                              <span>{c.whatsapp}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                            {c.plan?.name || "START"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {c.status === "ACTIVE" ? "Ativo" : c.status === "TRIAL" ? "Período Teste" : "Inativo"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                          {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LANDING PAGE DE VENDAS                                             */}
      {/* ========================================================================= */}
      {activeTab === "landing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveLanding} className="lg:col-span-7 space-y-6">
            {/* Link Público */}
            <div className="bg-slate-900 p-4 sm:p-5 rounded-xl text-white space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Sua Landing Page de Vendas</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                  Ativa
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">
                  Link para novos clientes conhecerem seus serviços:
                </p>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1.5">
                  <input
                    type="text"
                    readOnly
                    value={defaultLandingUrl}
                    className="bg-transparent border-none text-xs text-slate-200 font-mono flex-1 outline-none px-2 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(defaultLandingUrl);
                      setCopiedLandingUrl(true);
                      setTimeout(() => setCopiedLandingUrl(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedLandingUrl ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLandingUrl ? "Copiado" : "Copiar"}</span>
                  </button>
                  <a
                    href={defaultLandingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition"
                    title="Abrir Página"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Configurações de Texto */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-slate-600" />
                  <span>Textos Principais</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Defina o título principal e a descrição da sua página
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selo de Destaque</label>
                  <input
                    type="text"
                    value={landingConfig.badgeText}
                    onChange={(e) => setLandingConfig({ ...landingConfig, badgeText: e.target.value })}
                    placeholder="Ex: Plataforma de Conversão & Bio Links"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título Principal (Headline) *</label>
                  <input
                    type="text"
                    required
                    value={landingConfig.headline}
                    onChange={(e) => setLandingConfig({ ...landingConfig, headline: e.target.value })}
                    placeholder={`Ex: Acelere as Vendas da sua Empresa com ${form.brandName}`}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subtítulo / Descrição</label>
                  <textarea
                    rows={3}
                    value={landingConfig.subtitle}
                    onChange={(e) => setLandingConfig({ ...landingConfig, subtitle: e.target.value })}
                    placeholder="Ex: Páginas de alta performance, links diretos para WhatsApp e gestão de oportunidades."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Texto do Botão Principal</label>
                    <input
                      type="text"
                      value={landingConfig.ctaText}
                      onChange={(e) => setLandingConfig({ ...landingConfig, ctaText: e.target.value })}
                      placeholder="Ex: Começar Agora"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp para Contato</label>
                    <input
                      type="text"
                      value={landingConfig.whatsappContact}
                      onChange={(e) => setLandingConfig({ ...landingConfig, whatsappContact: e.target.value })}
                      placeholder="Ex: 87996836855"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seções Ativas */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Seções Visíveis</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer hover:bg-slate-100 transition">
                  <span>Recursos e Apresentação</span>
                  <input
                    type="checkbox"
                    checked={landingConfig.showFeatures}
                    onChange={(e) => setLandingConfig({ ...landingConfig, showFeatures: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer hover:bg-slate-100 transition">
                  <span>Tabela de Preços</span>
                  <input
                    type="checkbox"
                    checked={landingConfig.showPricing}
                    onChange={(e) => setLandingConfig({ ...landingConfig, showPricing: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer hover:bg-slate-100 transition">
                  <span>Depoimentos</span>
                  <input
                    type="checkbox"
                    checked={landingConfig.showTestimonials}
                    onChange={(e) => setLandingConfig({ ...landingConfig, showTestimonials: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer hover:bg-slate-100 transition">
                  <span>Dúvidas Frequentes (FAQ)</span>
                  <input
                    type="checkbox"
                    checked={landingConfig.showFaq}
                    onChange={(e) => setLandingConfig({ ...landingConfig, showFaq: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingLanding}
              className="w-full py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {savingLanding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar Landing Page</span>
            </button>
          </form>

          {/* Preview da Landing Page */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 sticky top-24">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>Prévia da Página</span>
                </span>
                <a
                  href={defaultLandingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-700 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                >
                  <span>Abrir</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-2.5">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-7 h-7 rounded-md object-contain bg-white border border-slate-200" />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {form.brandName?.charAt(0) || "W"}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{form.brandName}</h4>
                    <span className="text-[10px] text-slate-400">Página de Apresentação</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 inline-block">
                    {landingConfig.badgeText || "Destaque"}
                  </span>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">
                    {landingConfig.headline || `Solução Completa para ${form.brandName}`}
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {landingConfig.subtitle || "Páginas com alta conversão, atendimento direto no WhatsApp e gestão de leads."}
                  </p>
                  <div className="pt-1.5 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-medium">
                      {landingConfig.ctaText || "Começar"}
                    </span>
                    {customPlans.length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {customPlans.length} {customPlans.length === 1 ? "plano" : "planos"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GUIA PASSO A PASSO (Discreto, Limpo e Confortável)                  */}
      {/* ========================================================================= */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden text-slate-900 max-h-[85vh] flex flex-col relative">
            {/* Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Guia de Configuração White Label</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-semibold">
                      Etapa {guideStep} de 5
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Orientações passo a passo para configurar sua plataforma
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="bg-white px-4 py-2.5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0">
              {[
                { step: 1, title: "1. Marca", icon: Palette },
                { step: 2, title: "2. Domínio", icon: Globe },
                { step: 3, title: "3. Banco Inter", icon: CreditCard },
                { step: 4, title: "4. Planos", icon: Package },
                { step: 5, title: "5. Landing Page", icon: Sparkles },
              ].map((s) => {
                const Icon = s.icon;
                const isActive = guideStep === s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setGuideStep(s.step)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-700 text-xs sm:text-sm">
              {guideStep === 1 && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Identidade Visual e Informações da Sua Marca
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Personalize o nome da sua empresa, envie a logomarca e configure o WhatsApp de atendimento.
                  </p>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Nome da Marca:</strong> Informe o nome comercial da sua empresa (ex: <em>Agência Ignis</em>).
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">WhatsApp de Atendimento:</strong> Insira o número com DDD (ex: <em>87996836855</em>). Ele é aplicado automaticamente nos rodapés e botões.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Logomarca:</strong> Envie um logotipo em PNG com fundo transparente.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Ocultar Créditos:</strong> Ative para remover menções externas das páginas dos seus clientes.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {guideStep === 2 && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Configuração de Domínio Próprio & DNS
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Aponte seu subdomínio exclusivo (ex: <code className="font-semibold text-slate-900">bio.agenciaignis.com.br</code>) para o servidor.
                  </p>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <span className="font-semibold text-slate-800 block">Tabela de Apontamento DNS:</span>
                    <div className="bg-white rounded-lg p-3 font-mono border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <span className="font-bold text-slate-900">Tipo:</span> CNAME &nbsp;|&nbsp;
                        <span className="text-slate-500">Host:</span> bio &nbsp;|&nbsp;
                        <span className="font-semibold text-slate-800">Destino:</span> tree.pajotech.com.br
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy("tree.pajotech.com.br", "guide-cname")}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-sans font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDns === "guide-cname" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedDns === "guide-cname" ? "Copiado" : "Copiar Destino"}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-600 space-y-1 text-xs">
                      <strong className="text-slate-800 block">Cloudflare:</strong>
                      <p className="leading-relaxed">
                        Configure o apontamento como <strong>DNS Only (Nuvem Cinza)</strong> ou como <strong>Proxied (Nuvem Laranja)</strong> com SSL em modo <strong>Full</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs">
                      <strong className="text-slate-800 block mb-0.5">Coolify:</strong>
                      <span>Adicione <code>https://bio.agenciaignis.com.br</code> nos domínios da aplicação.</span>
                    </div>
                  </div>
                </div>
              )}

              {guideStep === 3 && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Conta do Banco Inter PJ (Pix Automático mTLS)
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Integre sua conta do Banco Inter PJ para que todas as assinaturas caiam diretamente na sua conta corrente.
                  </p>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="text-slate-900">Internet Banking Banco Inter:</strong> Acesse <em>Conta Digital PJ &gt; Gestão de Acessos &gt; API</em>.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="text-slate-900">Nova Aplicação:</strong> Crie uma aplicação com o escopo de <em>Cobrança / Boletos / Pix</em>.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="text-slate-900">Certificados:</strong> Cole o <strong>Client ID</strong>, <strong>Client Secret</strong>, e os arquivos <strong>.crt</strong> e <strong>.key</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {guideStep === 4 && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Planos de Assinatura para Seus Clientes
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Defina pacotes comerciais com preços mensais/anuais, limites de páginas e dias de teste gratuito.
                  </p>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Preços & Condições:</strong> Defina valores mensais e anuais conforme seu mercado.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Limites:</strong> Estabeleça cotas de páginas, links e leads por plano.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Período de Teste:</strong> Configure 7 dias grátis para atrair novos clientes.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {guideStep === 5 && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      5
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Landing Page de Vendas & Divulgação
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sua página de vendas está pronta para apresentar seus serviços e converter visitantes em assinantes.
                  </p>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Link de Divulgação:</strong> Use <code>{defaultLandingUrl}</code> nas suas redes e campanhas.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Cadastro Direto:</strong> Compartilhe <code>{referralUrl}</code> para clientes diretos.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setGuideStep((prev) => Math.max(1, prev - 1))}
                disabled={guideStep === 1}
                className="px-3.5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    onClick={() => setGuideStep(s)}
                    className={`w-2 h-2 rounded-full cursor-pointer transition ${
                      guideStep === s ? "bg-slate-900 scale-125" : "bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>

              {guideStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setGuideStep((prev) => Math.min(5, prev + 1))}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer"
                >
                  Fechar Guia
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
