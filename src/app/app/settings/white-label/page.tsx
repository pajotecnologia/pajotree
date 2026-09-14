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
  domainStatus: "NOT_CONFIGURED",
  removeBrandingActive: false,
};

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
      else reject(new Error("Não foi possível processar a imagem."));
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export default function WhiteLabelPage() {
  const [form, setForm] = useState<WhiteLabelData>(DEFAULTS);
  const [original, setOriginal] = useState<WhiteLabelData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState({ name: "FREE", customDomainAllowed: false, removeBranding: false });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Background controls
  const [bgTab, setBgTab] = useState<"gradient" | "image">("gradient");
  const [uploadingBg, setUploadingBg] = useState(false);
  const [bgCustomUrl, setBgCustomUrl] = useState("");
  const bgInputRef = useRef<HTMLInputElement>(null);

  // DNS Verification
  const [verifyingDns, setVerifyingDns] = useState(false);
  const [dnsResult, setDnsResult] = useState<{ status: string; message: string; verified: boolean } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/white-label", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar as configurações.");
      
      const isImg =
        data.whiteLabel?.backgroundType === "image" ||
        Boolean(
          data.whiteLabel?.backgroundValue &&
            (data.whiteLabel.backgroundValue.startsWith("data:image/") ||
              data.whiteLabel.backgroundValue.startsWith("http://") ||
              data.whiteLabel.backgroundValue.startsWith("https://") ||
              data.whiteLabel.backgroundValue.startsWith("url("))
        );

      const merged: WhiteLabelData = {
        ...DEFAULTS,
        ...data.whiteLabel,
        backgroundType: isImg ? "image" : "gradient",
      };

      setForm(merged);
      setOriginal(merged);
      setBgTab(isImg ? "image" : "gradient");
      setPlan(data.plan || { name: "FREE", customDomainAllowed: false, removeBranding: false });
      setIsSuperAdmin(Boolean(data.isSuperAdmin));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const update = <K extends keyof WhiteLabelData>(key: K, value: WhiteLabelData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSuccess(false);
  };

  async function handleImageChange(file: File, field: "logoUrl" | "faviconUrl") {
    try {
      const value = await readImage(file);
      update(field, value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imagem inválida.");
    }
  }

  async function handleBgUpload(file: File) {
    setUploadingBg(true);
    try {
      const base64 = await readImage(file);
      update("backgroundType", "image");
      update("backgroundValue", base64);
      setBgTab("image");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar imagem de fundo.");
    } finally {
      setUploadingBg(false);
    }
  }

  const handleSyncCompany = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/organizations/settings");
      if (res.ok) {
        const json = await res.json();
        const org = json.organization;
        if (org) {
          setForm((prev) => ({
            ...prev,
            brandName: org.tradeName || org.name || prev.brandName,
            description: org.description || prev.description,
            logoUrl: org.logoUrl || prev.logoUrl,
            customDomain: org.domains?.[0]?.domain || prev.customDomain,
          }));
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2500);
        }
      }
    } catch (err) {
      setError("Não foi possível sincronizar os dados da empresa.");
    } finally {
      setLoading(false);
    }
  };

  async function verifyDomainDns() {
    if (!form.customDomain) {
      setError("Informe o domínio antes de testar a verificação.");
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao verificar DNS.");
      setDnsResult(json);
      if (json.status) {
        update("domainStatus", json.status);
      }
    } catch (err) {
      setDnsResult({
        status: "FAILED",
        verified: false,
        message: err instanceof Error ? err.message : "Erro na consulta DNS.",
      });
    } finally {
      setVerifyingDns(false);
    }
  }

  async function save() {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/settings/white-label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar White Label.");
      setOriginal(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar White Label.");
    } finally {
      setSaving(false);
    }
  }

  function restore() {
    setForm(original);
    setBgTab(original.backgroundType);
    setError(null);
    setSuccess(false);
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const buttonClass = useMemo(() => {
    switch (form.buttonStyle) {
      case "pill": return "rounded-full";
      case "square": return "rounded-none";
      case "rounded": return "rounded-md";
      case "glass": return "rounded-2xl backdrop-blur-md bg-white/10 border border-white/20";
      default: return "rounded-2xl";
    }
  }, [form.buttonStyle]);

  const isImgBg =
    form.backgroundType === "image" ||
    Boolean(
      form.backgroundValue &&
        (form.backgroundValue.startsWith("data:image/") ||
          form.backgroundValue.startsWith("http://") ||
          form.backgroundValue.startsWith("https://") ||
          form.backgroundValue.startsWith("url("))
    );

  const previewBgStyle: React.CSSProperties = {
    color: form.textColor,
    fontFamily: form.fontFamily,
    ...(isImgBg
      ? {
          backgroundImage: form.backgroundValue.startsWith("url(")
            ? form.backgroundValue
            : `url("${form.backgroundValue}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {
          background: form.backgroundValue || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        }),
  };

  const canUseCustomDomain = plan.customDomainAllowed || isSuperAdmin;
  const canRemoveBranding = plan.removeBranding || isSuperAdmin;

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Dynamic Google Font Link for Live Preview */}
      {form.fontFamily && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(
            form.fontFamily
          )}:wght@300;400;500;600;700;800&display=swap`}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">White Label & Domínio Próprio</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalize a identidade visual completa da sua página pública e configure seu domínio customizado.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncCompany}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Importa logotipo, nome e descrição configurados no perfil da empresa"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sincronizar com Empresa</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
            Plano {plan.name}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configurações White Label salvas com sucesso!</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="space-y-6">
          {/* 1. Identidade & Logomarca */}
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Identidade Visual da Marca</h2>
              </div>
              <span className="text-[11px] text-slate-400">Reutiliza dados cadastrais</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome da Marca / Título da Página *
                </label>
                <input
                  type="text"
                  value={form.brandName}
                  onChange={(e) => update("brandName", e.target.value)}
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                  placeholder="Ex: Pajotec Soluções"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Descrição Curta (Bio)
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                  placeholder="Ex: Transformamos negócios através da tecnologia"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Upload */}
              <div className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 transition bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800">Logomarca (Avatar)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG ou WebP até 2.5MB</p>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs">
                        <Upload className="w-3 h-3 text-indigo-600" />
                        <span>Trocar</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0], "logoUrl")}
                        />
                      </label>
                      {form.logoUrl && (
                        <button
                          type="button"
                          onClick={() => update("logoUrl", null)}
                          className="text-[11px] text-rose-600 hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 transition bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {form.faviconUrl ? (
                      <img src={form.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                    ) : (
                      <Globe className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800">Ícone da Aba (Favicon)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">32x32px ou PNG quadrado</p>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs">
                        <Upload className="w-3 h-3 text-indigo-600" />
                        <span>Trocar</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0], "faviconUrl")}
                        />
                      </label>
                      {form.faviconUrl && (
                        <button
                          type="button"
                          onClick={() => update("faviconUrl", null)}
                          className="text-[11px] text-rose-600 hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Tipografia e Estilo */}
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Tipografia & Estilo dos Botões</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fonte Principal (Google Fonts)
                </label>
                <select
                  value={form.fontFamily}
                  onChange={(e) => update("fontFamily", e.target.value as FontName)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                >
                  {FONTS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">A fonte é carregada e atualizada no preview em tempo real.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Formato dos Botões de Links
                </label>
                <select
                  value={form.buttonStyle}
                  onChange={(e) => update("buttonStyle", e.target.value as WhiteLabelData["buttonStyle"])}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                >
                  <option value="rounded-xl">Arredondado Moderno (Padrão)</option>
                  <option value="rounded">Suave (Bordas leves)</option>
                  <option value="pill">Pílula (Totalmente Curvado)</option>
                  <option value="square">Quadrado (Reto Minimalista)</option>
                  <option value="glass">Glassmorphism (Vidro Translúcido)</option>
                </select>
              </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cor Primária (Destaques)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-200 p-1 bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    maxLength={7}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cor Secundária (Gradiente)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => update("secondaryColor", e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-200 p-1 bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.secondaryColor}
                    onChange={(e) => update("secondaryColor", e.target.value)}
                    maxLength={7}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cor do Texto Principal</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.textColor}
                    onChange={(e) => update("textColor", e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-200 p-1 bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.textColor}
                    onChange={(e) => update("textColor", e.target.value)}
                    maxLength={7}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Fundo da Página (Gradiente vs Imagem HD) */}
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Plano de Fundo da Página</h2>
              </div>
              <div className="flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setBgTab("gradient");
                    update("backgroundType", "gradient");
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    bgTab === "gradient" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Gradientes & Cores
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBgTab("image");
                    update("backgroundType", "image");
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    bgTab === "image" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Imagem de Fundo HD
                </button>
              </div>
            </div>

            {bgTab === "gradient" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {GRADIENT_PRESETS.map((grad) => (
                    <button
                      key={grad.name}
                      type="button"
                      onClick={() => {
                        update("backgroundType", "gradient");
                        update("backgroundValue", grad.value);
                      }}
                      className={`h-14 rounded-xl p-2.5 text-left border flex flex-col justify-end transition-all ${
                        form.backgroundValue === grad.value
                          ? "border-indigo-600 ring-2 ring-indigo-500/30 scale-[1.02]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      style={{ background: grad.value }}
                    >
                      <span className="text-[10px] font-bold text-white drop-shadow-md">{grad.name}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    CSS Gradient ou Hex Customizado
                  </label>
                  <input
                    type="text"
                    value={form.backgroundValue}
                    onChange={(e) => {
                      update("backgroundType", "gradient");
                      update("backgroundValue", e.target.value);
                    }}
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload Box */}
                <div className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-5 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      {uploadingBg ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Enviar Imagem do seu Computador</h4>
                      <p className="text-[11px] text-slate-500">Aceita PNG, JPG, WebP em alta definição (até 2.5MB)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingBg}
                      onClick={() => bgInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Selecionar Arquivo</span>
                    </button>
                    <input
                      ref={bgInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleBgUpload(e.target.files[0])}
                    />
                  </div>
                </div>

                {/* Preset HD Images */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Ou escolha um Wallpaper HD Curado:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {HD_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          update("backgroundType", "image");
                          update("backgroundValue", preset.url);
                        }}
                        className={`h-20 rounded-xl relative overflow-hidden border transition-all ${
                          form.backgroundValue === preset.url
                            ? "border-indigo-600 ring-2 ring-indigo-500/30 scale-[1.02]"
                            : "border-slate-200 hover:opacity-90"
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/40 flex items-end p-2">
                          <span className="text-[10px] font-bold text-white drop-shadow-md">{preset.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ou cole a URL direta de uma imagem externa (HTTPS)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={bgCustomUrl}
                      onChange={(e) => setBgCustomUrl(e.target.value)}
                      placeholder="https://exemplo.com/fundo-hd.jpg"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (bgCustomUrl) {
                          update("backgroundType", "image");
                          update("backgroundValue", bgCustomUrl);
                        }
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 4. Domínio Próprio & Apontamento DNS */}
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Domínio Personalizado & DNS</h2>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  canUseCustomDomain ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {canUseCustomDomain ? "Habilitado no Plano" : "Disponível no Plano PRO/MASTER"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Seu Domínio ou Subdomínio Próprio
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={form.customDomain}
                  onChange={(e) => update("customDomain", e.target.value)}
                  placeholder="links.minhaempresa.com.br"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                />
                <button
                  type="button"
                  disabled={verifyingDns || !form.customDomain}
                  onClick={verifyDomainDns}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {verifyingDns ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Testar Apontamento DNS</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Exemplo: <code className="font-mono text-indigo-600">links.suaempresa.com.br</code> ou <code className="font-mono text-indigo-600">bio.suamarca.com.br</code>
              </p>
            </div>

            {/* DNS Check Result */}
            {dnsResult && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                  dnsResult.verified
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                {dnsResult.verified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{dnsResult.verified ? "DNS Verificado com Sucesso!" : "Status do Apontamento DNS:"}</p>
                  <p className="mt-0.5 text-[11px] opacity-90">{dnsResult.message}</p>
                </div>
              </div>
            )}

            {/* DNS Instructions Guide */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Como Configurar o DNS na sua Zona de Domínio (Registro.br / Cloudflare / GoDaddy)
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="pb-2">Tipo</th>
                      <th className="pb-2">Nome / Entrada (Host)</th>
                      <th className="pb-2">Destino / Valor</th>
                      <th className="pb-2">TTL</th>
                      <th className="pb-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 font-bold text-indigo-300">CNAME</td>
                      <td className="py-2.5 text-slate-200">links (ou seu subdomínio)</td>
                      <td className="py-2.5 text-emerald-400 font-bold">cname.pajotree.com.br</td>
                      <td className="py-2.5 text-slate-400">3600 (1 hora)</td>
                      <td className="py-2.5 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => copyText("cname.pajotree.com.br", "cname")}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white flex items-center gap-1 ml-auto"
                        >
                          {copiedKey === "cname" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === "cname" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-amber-300">A (Opcional para raiz)</td>
                      <td className="py-2.5 text-slate-200">@ (ou vazio)</td>
                      <td className="py-2.5 text-slate-200">76.76.21.21</td>
                      <td className="py-2.5 text-slate-400">3600</td>
                      <td className="py-2.5 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => copyText("76.76.21.21", "ip")}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white flex items-center gap-1 ml-auto"
                        >
                          {copiedKey === "ip" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === "ip" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-white/10 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <b>Dica de Propagação:</b> A propagação DNS costuma levar de 5 a 60 minutos dependendo do seu provedor (Cloudflare costuma ser imediato). O certificado SSL HTTPS é emitido automaticamente após a verificação do apontamento.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Remover Marca Pajotree */}
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Remover Marca "Criado com Pajotree"</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Oculte totalmente o selo e créditos do Pajotree no rodapé da sua página pública.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.removeBrandingActive}
                  onChange={(e) => update("removeBrandingActive", e.target.checked)}
                  disabled={!canRemoveBranding}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            {!canRemoveBranding && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Esta opção requer o plano PRO ou acesso Super Admin. Faça upgrade para remover a marca.</span>
              </div>
            )}
          </section>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={restore}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Descartar Alterações</span>
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Salvando Alterações..." : "Salvar White Label"}</span>
            </button>
          </div>
        </div>

        {/* Live Mobile Device Preview */}
        <aside className="xl:sticky xl:top-24 h-fit">
          <div className="bg-slate-950 p-4 rounded-[36px] shadow-2xl border border-slate-800">
            {/* Phone Speaker & Camera Bar */}
            <div className="flex items-center justify-between px-3 py-1 mb-2 text-[10px] text-slate-400 font-mono">
              <span>9:41</span>
              <div className="w-16 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-white/5">
                <div className="w-2 h-2 rounded-full bg-slate-950" />
              </div>
              <span>100% 5G</span>
            </div>

            {/* Live Phone Screen Container */}
            <div
              className="min-h-[580px] rounded-[28px] p-5 flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 shadow-inner"
              style={previewBgStyle}
            >
              {/* Image Dark Overlay */}
              {isImgBg && (
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[0.5px] pointer-events-none" />
              )}

              {/* Share pill top */}
              <div className="relative z-10 w-full flex justify-end">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-white/90 border border-white/10 font-medium">
                  Compartilhar
                </span>
              </div>

              {/* Profile Bio */}
              <div className="relative z-10 w-full flex flex-col items-center mt-2">
                <div
                  className="w-20 h-20 rounded-full p-1 shadow-xl transition-transform duration-300"
                  style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}
                >
                  <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-white text-xl font-bold">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      (form.brandName || "P").charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                <h3 className="mt-3 text-lg font-extrabold text-white tracking-tight">
                  {form.brandName || "Minha Empresa"}
                </h3>
                {form.description && (
                  <p className="mt-1 text-xs text-white/80 max-w-[240px] leading-relaxed">
                    {form.description}
                  </p>
                )}
              </div>

              {/* Buttons Mockup */}
              <div className="relative z-10 w-full mt-6 space-y-2.5">
                <div
                  className={`p-3.5 bg-slate-900/80 border text-white text-xs font-bold transition shadow-md flex items-center justify-center ${buttonClass}`}
                  style={{ borderColor: form.primaryColor }}
                >
                  🚀 Fale Conosco no WhatsApp
                </div>
                <div
                  className={`p-3.5 bg-slate-900/80 border border-white/10 text-white text-xs font-semibold ${buttonClass}`}
                >
                  🌐 Visite Nosso Website Oficial
                </div>
                <div
                  className={`p-3.5 bg-slate-900/80 border border-white/10 text-white text-xs font-semibold ${buttonClass}`}
                >
                  📍 Nossa Localização & Horários
                </div>
              </div>

              {/* Footer / Branding */}
              <div className="relative z-10 w-full mt-auto pt-8">
                {form.removeBrandingActive ? (
                  <div className="text-[10px] text-white/40 italic">
                    Marca Pajotree removida
                  </div>
                ) : (
                  <div className="text-[10px] text-white/60 font-medium">
                    Criado com <span className="font-bold text-indigo-400">Pajotree</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
