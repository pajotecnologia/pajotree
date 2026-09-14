"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  Check,
  Globe,
  Image as ImageIcon,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Type,
  Upload,
  ExternalLink,
  ShieldCheck,
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
  Lock,
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  Link as LinkIcon,
  MessageSquare,
  FileCheck,
} from "lucide-react";

const MAX_IMAGE_SIZE = 2.5 * 1024 * 1024; // 2.5 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

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

const GRADIENT_PRESETS = [
  { name: "Galáxia Escura", value: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" },
  { name: "Obsidiana Minimal", value: "linear-gradient(135deg, #18181b 0%, #09090b 100%)" },
  { name: "Sunset Violet", value: "linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #831843 100%)" },
  { name: "Emerald Forest", value: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)" },
  { name: "Ocean Deep", value: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)" },
  { name: "Clean Pearl", value: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" },
];

const HD_IMAGE_PRESETS = [
  {
    name: "Dark Mesh Gradient",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Cyber Neon City",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Abstract Fluid Art",
    url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Deep Space Aurora",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Minimalist Geometry",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Nordic Sunset Mountains",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  },
];

type WhiteLabelData = {
  brandName: string;
  description: string;
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
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#6366f1",
  secondaryColor: "#ec4899",
  textColor: "#ffffff",
  backgroundType: "gradient",
  backgroundValue: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
  buttonStyle: "rounded-xl",
  fontFamily: "Inter",
  customDomain: "",
  domainStatus: "PENDING",
  removeBrandingActive: false,
};

export default function WhiteLabelPage() {
  const [activeTab, setActiveTab] = useState<"branding" | "payments" | "plans" | "clients">("branding");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Branding State
  const [form, setForm] = useState<WhiteLabelData>(DEFAULTS);
  const [hasPlanAccess, setHasPlanAccess] = useState(false);
  const [planName, setPlanName] = useState("START");
  const [copiedDns, setCopiedDns] = useState<string | null>(null);
  const [verifyingDns, setVerifyingDns] = useState(false);
  const [dnsResult, setDnsResult] = useState<{ verified: boolean; message: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

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
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // Clients / Sub-Tenants State
  const [clientsData, setClientsData] = useState<{ summary: any; clients: any[] }>({
    summary: { totalClients: 0, activeClients: 0, trialClients: 0, monthlyRevenue: 0 },
    clients: [],
  });
  const [loadingClients, setLoadingClients] = useState(false);
  const [orgId, setOrgId] = useState<string>("");

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [wlRes, gwRes, plansRes, clientsRes, meRes] = await Promise.all([
        fetch("/api/settings/white-label"),
        fetch("/api/white-label/gateway"),
        fetch("/api/white-label/plans"),
        fetch("/api/white-label/clients"),
        fetch("/api/auth/me"),
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
        setHasPlanAccess(Boolean(data.plan?.removeBranding || data.isSuperAdmin));
        setPlanName(data.plan?.name || "START");
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
    const fontQuery = FONTS.map((f) => f.value.replace(/ /g, "+") + ":wght@400;600;700;800").join("&family=");
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
      case "rounded": return "rounded-lg";
      case "pill": return "rounded-full";
      case "glass": return "rounded-xl backdrop-blur-md bg-white/20 border border-white/30 text-white shadow-lg";
      default: return "rounded-xl";
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

      setSuccess("Identidade visual e domínio salvos com sucesso!");
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
        message: data.message || (data.verified ? "Domínio verificado com sucesso!" : "Apontamento DNS ainda não propagado."),
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

      setSuccess("Credenciais do Banco Inter salvas com sucesso!");
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
      setSuccess("Webhook registrado com sucesso no Banco Inter!");
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
          maxWhatsappInstances: 1,
          customDomainAllowed: true,
          crmAllowed: true,
          whatsappInboxAllowed: true,
          removeBranding: true,
        },
      });
    } else {
      setEditingPlan({
        name: "Plano Pro",
        description: "Acesso completo aos recursos com WhatsApp e CRM",
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
          maxWhatsappInstances: 1,
          maxMetaPixels: 2,
          maxAutomations: 5,
          maxStorageMb: 200,
          customDomainAllowed: true,
          crmAllowed: true,
          whatsappInboxAllowed: true,
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

      setSuccess(isEdit ? "Plano atualizado com sucesso!" : "Novo plano criado com sucesso!");
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

      setSuccess("Plano excluído com sucesso!");
      setCustomPlans((prev) => prev.filter((p) => p.id !== id));
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Erro ao excluir plano.");
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedDns(key);
    setTimeout(() => setCopiedDns(null), 2500);
  }

  const referralUrl = typeof window !== "undefined"
    ? `${window.location.origin}/register?ref=${orgId}`
    : `https://pajotree.com/register?ref=${orgId}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium text-sm">Carregando painel White Label...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>PAINEL DE REVENDA & WHITE LABEL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gerenciamento White Label & Banco Inter
            </h1>
            <p className="text-purple-200/80 text-sm max-w-2xl">
              Personalize a marca da sua plataforma, configure sua própria conta do Banco Inter para receber pagamentos dos seus clientes e crie planos sob medida.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
              <span className="text-xs text-purple-200 block">Clientes Ativos</span>
              <span className="text-xl font-extrabold text-white">{clientsData.summary.activeClients}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
              <span className="text-xs text-purple-200 block">Faturamento Mensal</span>
              <span className="text-xl font-extrabold text-emerald-400">
                R$ {Number(clientsData.summary.monthlyRevenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("branding")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "branding"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>1. Marca & Domínio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "payments"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>2. Pagamentos (Banco Inter)</span>
            {gatewayConfigured && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "plans"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>3. Gerenciar Meus Planos ({customPlans.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("clients")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "clients"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>4. Meus Clientes ({clientsData.clients.length})</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: IDENTIDADE VISUAL & DOMÍNIO                                        */}
      {/* ========================================================================= */}
      {activeTab === "branding" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form onSubmit={handleSaveBranding} className="lg:col-span-7 space-y-6">
            {/* Informações da Marca */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Marca & Logomarca</h2>
                  <p className="text-xs text-slate-500">Defina o nome fantasia e o logotipo que aparecerão para seus usuários</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nome da Sua Marca / Empresa
                  </label>
                  <input
                    type="text"
                    value={form.brandName}
                    onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                    placeholder="Ex: Minha Agência Digital"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Logomarca da Empresa
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {form.logoUrl ? (
                      <div className="relative group w-24 h-24 rounded-2xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center shrink-0 shadow-xs">
                        <img src={form.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, logoUrl: null })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-purple-400 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 cursor-pointer transition shrink-0"
                      >
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Enviar Logo</span>
                      </div>
                    )}

                    <div className="flex-1 text-xs text-slate-500 space-y-2">
                      <p>Formatos suportados: PNG, JPG ou WebP (máximo 2.5 MB). Recomendamos logotipo com fundo transparente.</p>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs inline-flex items-center gap-1.5"
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Domínio Próprio & DNS</h2>
                    <p className="text-xs text-slate-500">Acesse o sistema diretamente no seu domínio (ex: app.seusite.com.br)</p>
                  </div>
                </div>

                {form.domainStatus === "VERIFIED" ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conectado</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Pendente DNS</span>
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Seu Domínio ou Subdomínio
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.customDomain}
                      onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                      placeholder="app.minhaempresa.com.br"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyDns}
                      disabled={verifyingDns || !form.customDomain}
                      className="px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition flex items-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {verifyingDns ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      <span>Verificar DNS</span>
                    </button>
                  </div>
                </div>

                {dnsResult && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    dnsResult.verified ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}>
                    {dnsResult.verified ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Info className="w-4 h-4 text-amber-600 shrink-0" />}
                    <span>{dnsResult.message}</span>
                  </div>
                )}

                {/* Tabela de Apontamentos DNS */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-3">
                  <span className="font-bold text-slate-800 block">Como configurar no seu provedor de domínio (Registro.br, Cloudflare, GoDaddy):</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                          <th className="py-2">Tipo</th>
                          <th className="py-2">Nome / Host</th>
                          <th className="py-2">Destino / Valor</th>
                          <th className="py-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 font-mono">
                        <tr>
                          <td className="py-2 font-bold text-indigo-600">CNAME</td>
                          <td className="py-2">app (ou @)</td>
                          <td className="py-2">cname.pajotree.com.br</td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy("cname.pajotree.com.br", "cname")}
                              className="text-slate-500 hover:text-indigo-600"
                              title="Copiar"
                            >
                              {copiedDns === "cname" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipografia & Estilo dos Botões */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Tipografia & Estilo</h2>
                  <p className="text-xs text-slate-500">Escolha a fonte Google Fonts e o formato dos botões</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Fonte do Sistema & Páginas
                  </label>
                  <select
                    value={form.fontFamily}
                    onChange={(e) => setForm({ ...form, fontFamily: e.target.value as FontName })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Estilo dos Botões
                  </label>
                  <select
                    value={form.buttonStyle}
                    onChange={(e) => setForm({ ...form, buttonStyle: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  >
                    <option value="rounded-xl">Arredondado Moderno (Padrão)</option>
                    <option value="pill">Pílula Totalmente Redonda</option>
                    <option value="rounded">Levemente Arredondado</option>
                    <option value="square">Quadrado Minimalista</option>
                    <option value="glass">Glassmorphism (Vidro Translúcido)</option>
                  </select>
                </div>
              </div>

              {/* Remover Marca Pajotree */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">Remover Marca "Criado com Pajotree"</span>
                  <span className="text-[11px] text-slate-500 block">Oculte os créditos do rodapé nas páginas e formulários públicos</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={form.removeBrandingActive}
                    onChange={(e) => setForm({ ...form, removeBrandingActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Salvar Alterações de Marca</span>
            </button>
          </form>

          {/* Live Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Preview em Tempo Real</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Fonte: {form.fontFamily}</span>
              </div>

              <div
                className="w-full max-w-[340px] mx-auto rounded-[38px] p-6 shadow-2xl border-4 border-slate-900 min-h-[580px] flex flex-col justify-between relative overflow-hidden transition-all duration-300"
                style={{
                  background: backgroundCss,
                  color: form.textColor,
                  fontFamily: form.fontFamily,
                }}
              >
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center overflow-hidden shadow-md">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 opacity-80" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg leading-tight">{form.brandName}</h3>
                    <p className="text-xs opacity-75 mt-1">Conecte-se conosco através dos nossos canais</p>
                  </div>

                  <div className="space-y-2.5">
                    <div className={`p-3 text-xs font-bold text-center bg-white/15 backdrop-blur-xs border border-white/25 shadow-sm transition hover:scale-[1.02] ${buttonClass}`}>
                      <span>Falar no WhatsApp</span>
                    </div>
                    <div className={`p-3 text-xs font-bold text-center bg-white/15 backdrop-blur-xs border border-white/25 shadow-sm transition hover:scale-[1.02] ${buttonClass}`}>
                      <span>Conhecer Nossos Planos</span>
                    </div>
                    <div className={`p-3 text-xs font-bold text-center bg-white/15 backdrop-blur-xs border border-white/25 shadow-sm transition hover:scale-[1.02] ${buttonClass}`}>
                      <span>Agendar Demonstração</span>
                    </div>
                  </div>
                </div>

                {!form.removeBrandingActive && (
                  <div className="text-center pt-6 opacity-60 text-[10px] font-bold">
                    <span>Criado com Pajotree</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form onSubmit={handleSaveGateway} className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Banco Inter PJ (Bolepix & Pix)</h2>
                    <p className="text-xs text-slate-500">Configure suas credenciais mTLS para receber pagamentos diretamente na sua conta</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    gatewayConfigured ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                  }`}>
                    {gatewayConfigured ? "Configurado" : "Não Configurado"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Ambiente
                    </label>
                    <select
                      value={gatewayForm.ambiente}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, ambiente: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    >
                      <option value="PRODUCAO">Produção (Ambiente Real)</option>
                      <option value="SANDBOX">Sandbox (Ambiente de Testes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Chave Pix (Opcional)
                    </label>
                    <input
                      type="text"
                      value={gatewayForm.chavePix}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, chavePix: e.target.value })}
                      placeholder="CNPJ, E-mail ou Chave Aleatória"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Client ID (da sua aplicação no Banco Inter)
                  </label>
                  <input
                    type="text"
                    value={gatewayForm.clientId}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, clientId: e.target.value })}
                    placeholder="Ex: 12345678-abcd-1234-abcd-123456789abc"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={gatewayForm.clientSecret}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, clientSecret: e.target.value })}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  />
                </div>

                {/* Uploads ou Colagem dos Certificados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Certificado (.crt)
                    </label>
                    <textarea
                      value={gatewayForm.certCrt}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, certCrt: e.target.value })}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      rows={5}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Chave Privada (.key)
                    </label>
                    <textarea
                      value={gatewayForm.certKey}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, certKey: e.target.value })}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                      rows={5}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white transition resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    URL do Webhook (para baixa automática)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={gatewayForm.webhookUrl || `${typeof window !== "undefined" ? window.location.origin : "https://seusite.com"}/api/webhooks/banco-inter`}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, webhookUrl: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={handleRegisterWebhook}
                      className="px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition shrink-0"
                    >
                      Registrar
                    </button>
                  </div>
                </div>

                {gatewayTestResult && (
                  <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                    gatewayTestResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}>
                    {gatewayTestResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                    <span>{gatewayTestResult.message}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestGateway}
                  disabled={testingGateway}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  {testingGateway ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>Testar Conexão mTLS</span>
                </button>

                <button
                  type="submit"
                  disabled={savingGateway}
                  className="w-full sm:w-auto flex-1 py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-amber-200"
                >
                  {savingGateway ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Salvar Credenciais do Banco Inter</span>
                </button>
              </div>
            </div>
          </form>

          {/* Guia & Manual do Banco Inter */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Manual de Integração Banco Inter PJ</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                O Banco Inter PJ permite emitir **Bolepix (Boleto com QR Code Pix dinâmico)** com taxa zero ou reduzida diretamente na sua conta corrente.
              </p>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">1. Acesse o Internet Banking PJ</strong>
                  <span>Vá em *Conta Digital PJ &gt; Gestão de Acessos &gt; API*</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">2. Crie uma Nova Aplicação</strong>
                  <span>Selecione o escopo **Cobrança / Boletos** e gere os certificados `.crt` e `.key`.</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">3. Cole as Chaves</strong>
                  <span>Abra os arquivos `.crt` e `.key` no bloco de notas e cole o conteúdo completo aqui.</span>
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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Planos de Assinatura para Seus Clientes</h2>
              <p className="text-xs text-slate-500">Crie e edite os planos que seus clientes poderão assinar na sua plataforma</p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNewPlanModal()}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-purple-200"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Plano</span>
            </button>
          </div>

          {customPlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Nenhum plano personalizado cadastrado</h3>
              <p className="text-xs text-slate-500">
                Crie seu primeiro plano de revenda (ex: Plano Básico, Pro, Agência) com seus próprios preços e limites.
              </p>
              <button
                type="button"
                onClick={() => handleOpenNewPlanModal()}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md hover:bg-purple-700 transition"
              >
                Criar Primeiro Plano
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        plan.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                      }`}>
                        {plan.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenNewPlanModal(plan)}
                          className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                          title="Editar Plano"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Excluir Plano"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description || "Sem descrição."}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-slate-500">R$</span>
                        <span className="text-2xl font-extrabold text-slate-900">
                          {Number(plan.priceMonthly).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-slate-500">/mês</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Anual: R$ {Number(plan.priceYearly).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({plan.trialDays} dias trial)
                      </span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Até <strong>{plan.features?.[0]?.maxPages || 1}</strong> páginas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Até <strong>{plan.features?.[0]?.maxLinks || 10}</strong> links</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Até <strong>{plan.features?.[0]?.maxLeads || 100}</strong> leads</span>
                      </li>
                      {plan.features?.[0]?.whatsappInboxAllowed && (
                        <li className="flex items-center gap-2 text-emerald-700 font-semibold">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>WhatsApp & Inbox Liberados</span>
                        </li>
                      )}
                      {plan.features?.[0]?.crmAllowed && (
                        <li className="flex items-center gap-2 text-indigo-700 font-semibold">
                          <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>CRM Kanban Liberado</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>{plan._count?.organizations || 0} assinantes</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de Criação / Edição de Plano */}
          {isPlanModalOpen && editingPlan && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {editingPlan.id ? "Editar Plano de Assinatura" : "Criar Novo Plano"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSavePlan} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Nome do Plano
                      </label>
                      <input
                        type="text"
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Dias de Teste (Trial Grátis)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={editingPlan.trialDays}
                        onChange={(e) => setEditingPlan({ ...editingPlan, trialDays: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Descrição do Plano
                    </label>
                    <input
                      type="text"
                      value={editingPlan.description || ""}
                      onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                      placeholder="Ex: Ideal para profissionais autônomos"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Preço Mensal (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingPlan.priceMonthly}
                        onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Preço Anual (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingPlan.priceYearly}
                        onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Limites e Recursos */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-bold text-slate-800 block">Limites e Recursos Inclusos:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase">Máx. Páginas</label>
                        <input
                          type="number"
                          value={editingPlan.features.maxPages}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, maxPages: Number(e.target.value) } })}
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase">Máx. Links</label>
                        <input
                          type="number"
                          value={editingPlan.features.maxLinks}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, maxLinks: Number(e.target.value) } })}
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase">Máx. Leads</label>
                        <input
                          type="number"
                          value={editingPlan.features.maxLeads}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, maxLeads: Number(e.target.value) } })}
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPlan.features.whatsappInboxAllowed}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, whatsappInboxAllowed: e.target.checked } })}
                          className="rounded text-purple-600"
                        />
                        <span>WhatsApp & Inbox Liberados</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPlan.features.crmAllowed}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, crmAllowed: e.target.checked } })}
                          className="rounded text-purple-600"
                        />
                        <span>CRM Kanban de Vendas</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPlan.features.customDomainAllowed}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, customDomainAllowed: e.target.checked } })}
                          className="rounded text-purple-600"
                        />
                        <span>Domínio Próprio</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPlan.features.removeBranding}
                          onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, removeBranding: e.target.checked } })}
                          className="rounded text-purple-600"
                        />
                        <span>Remover Créditos de Marca</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingPlan}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-purple-200"
                    >
                      {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
        <div className="space-y-6">
          {/* Link de Onboarding Exclusivo */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-3xl border border-indigo-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-900 block">Link Exclusivo de Cadastro para Seus Clientes</span>
              <p className="text-xs text-indigo-700/80">
                Divulgue este link ou cadastre em seu domínio próprio. Novos clientes cadastrados ficarão vinculados à sua revenda.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="px-4 py-2.5 rounded-xl bg-white border border-indigo-200 text-xs font-mono text-slate-800 w-full md:w-80 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => handleCopy(referralUrl, "ref")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-200"
              >
                {copiedDns === "ref" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDns === "ref" ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          {/* Tabela de Clientes */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Empresas Cadastradas na Sua Plataforma</h3>
                <p className="text-xs text-slate-500">Lista completa de clientes e status de faturamento</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {clientsData.clients.length} {clientsData.clients.length === 1 ? "Cliente" : "Clientes"}
              </span>
            </div>

            {clientsData.clients.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Nenhum cliente cadastrado ainda</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Compartilhe seu link de cadastro ou configure seu domínio próprio para começar a receber novos assinantes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Empresa / Cliente</th>
                      <th className="py-3.5 px-4">Responsável / E-mail</th>
                      <th className="py-3.5 px-4">WhatsApp</th>
                      <th className="py-3.5 px-4">Plano</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-6 text-right">Data de Cadastro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {clientsData.clients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {c.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span>{c.name}</span>
                              {c.document && <span className="text-[10px] text-slate-400 block font-mono">{c.document}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span>{c.owner?.name || c.name}</span>
                          <span className="text-[11px] text-slate-400 block">{c.email}</span>
                        </td>

                        <td className="py-4 px-4">
                          {c.whatsapp ? (
                            <a
                              href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{c.whatsapp}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold text-indigo-900 block">{c.planName}</span>
                          {c.planPrice > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              R$ {c.planPrice.toFixed(2)}/mês
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : c.status === "TRIAL"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {c.status}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right text-slate-400 font-mono text-[11px]">
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
    </div>
  );
}
