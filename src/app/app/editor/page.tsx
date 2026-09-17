"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Palette,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Trash2,
  Save,
  Check,
  Eye,
  Sparkles,
  Layout,
  Type,
  Link2,
  MessageSquare,
  HelpCircle,
  FileText,
  Loader2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  RefreshCw,
  Globe,
  Sliders,
  User,
} from "lucide-react";
import { PublicPageRenderer } from "@/components/public-page/page-renderer";

const FONT_OPTIONS = [
  { label: "Inter (Moderno & Neutro)", value: "Inter" },
  { label: "Poppins (Geométrico & Jovial)", value: "Poppins" },
  { label: "Roboto (Clássico & Limpo)", value: "Roboto" },
  { label: "Montserrat (Elegante & Marcante)", value: "Montserrat" },
  { label: "DM Sans (Minimalista Tech)", value: "DM Sans" },
  { label: "Open Sans (Amigável & Legível)", value: "Open Sans" },
  { label: "Lato (Corporativo & Equilibrado)", value: "Lato" },
  { label: "Nunito (Arredondado & Suave)", value: "Nunito" },
  { label: "Playfair Display (Sofisticado & Editorial)", value: "Playfair Display" },
];

const GRADIENT_PRESETS = [
  { name: "Galáxia Escura", value: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" },
  { name: "Obsidiana Minimal", value: "linear-gradient(135deg, #18181b 0%, #09090b 100%)" },
  { name: "Sunset Violet", value: "linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #831843 100%)" },
  { name: "Emerald Forest", value: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)" },
  { name: "Ocean Deep", value: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)" },
  { name: "Minimal Clean", value: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" },
];

const IMAGE_PRESETS = [
  {
    name: "Dark Gradient Mesh",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Cyber Neon City",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Abstract Fluid",
    url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Deep Space Night",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Studio Minimalist",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Nordic Mountain",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function VisualEditorPage() {
  const [pageData, setPageData] = useState<any>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [activeTab, setActiveTab] = useState<"design" | "blocks" | "seo">("design");

  // Local editable state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState("gradient");
  const [backgroundValue, setBackgroundValue] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#ec4899");
  const [textColor, setTextColor] = useState("#ffffff");
  const [buttonStyle, setButtonStyle] = useState("rounded-xl");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [showContactForm, setShowContactForm] = useState(false);

  // Logo / Avatar states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Background Image states
  const [bgMode, setBgMode] = useState<"gradient" | "image">("gradient");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Block Modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newBlockType, setNewBlockType] = useState("TEXT");
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockText, setNewBlockText] = useState("");

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPage = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/pages");
      if (!res.ok) {
        throw new Error("Erro ao carregar dados da página.");
      }
      const json = await res.json();
      if (!json.page) {
        throw new Error("Página não encontrada.");
      }
      setPageData(json.page);
      setThemes(json.themes || []);

      setTitle(json.page.title || json.page.name || "");
      setDescription(json.page.description || "");
      setSlug(json.page.slug || "");
      setLogoUrl(json.page?.organization?.logoUrl || null);

      const settings = json.page.settings;
      if (settings) {
        const isImage =
          settings.backgroundType === "image" ||
          Boolean(
            settings.backgroundValue &&
            (settings.backgroundValue.startsWith("data:image/") ||
             settings.backgroundValue.startsWith("http://") ||
             settings.backgroundValue.startsWith("https://") ||
             settings.backgroundValue.startsWith("url("))
          );

        setBackgroundType(settings.backgroundType || (isImage ? "image" : "gradient"));
        setBackgroundValue(settings.backgroundValue || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)");
        setBgMode(isImage ? "image" : "gradient");
        setPrimaryColor(settings.primaryColor || "#6366f1");
        setSecondaryColor(settings.secondaryColor || "#ec4899");
        setTextColor(settings.textColor || "#ffffff");
        setButtonStyle(settings.buttonStyle || "rounded-xl");
        setFontFamily(settings.fontFamily || "Inter");

        let customCfg: any = {};
        try {
          customCfg = JSON.parse(settings.customCss || "{}");
        } catch {}
        setShowContactForm(Boolean(settings.showContactForm ?? customCfg.showContactForm ?? false));
      }
    } catch (err: any) {
      console.error("Erro ao carregar editor:", err);
      setLoadError(err.message || "Erro ao carregar editor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const handleApplyTheme = (theme: any) => {
    try {
      const config = JSON.parse(theme.configJson);
      if (config.backgroundType) {
        setBackgroundType(config.backgroundType);
        setBgMode(config.backgroundType === "image" ? "image" : "gradient");
      }
      if (config.backgroundValue) setBackgroundValue(config.backgroundValue);
      if (config.primaryColor) setPrimaryColor(config.primaryColor);
      if (config.secondaryColor) setSecondaryColor(config.secondaryColor);
      if (config.textColor) setTextColor(config.textColor);
      if (config.buttonStyle) setButtonStyle(config.buttonStyle);
      if (config.fontFamily) setFontFamily(config.fontFamily);
    } catch (e) {
      console.error("Erro ao aplicar tema:", e);
    }
  };

  const handleLogoUpload = (file: File) => {
    setLogoError(null);
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setLogoError("Formato não suportado. Use PNG, JPG, WebP ou GIF.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setLogoError("A imagem deve ter no máximo 3 MB.");
      return;
    }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
        setLogoError(null);
      } else {
        setLogoError("Não foi possível processar a imagem.");
      }
      setUploadingLogo(false);
    };
    reader.onerror = () => {
      setLogoError("Erro ao ler o arquivo de foto.");
      setUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setLogoError(null);
  };

  const handleImageFileUpload = (file: File) => {
    setImageError(null);
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setImageError("Formato não suportado. Por favor, envie uma imagem PNG, JPG, WebP ou GIF.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setImageError("A imagem deve ter no máximo 3 MB.");
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBackgroundType("image");
        setBackgroundValue(reader.result);
        setBgMode("image");
        setImageError(null);
      } else {
        setImageError("Não foi possível processar a imagem.");
      }
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setImageError("Erro ao ler o arquivo de imagem.");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyImageUrl = () => {
    if (!customImageUrl.trim()) return;
    const url = customImageUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setImageError("Por favor, insira uma URL válida iniciando com https://");
      return;
    }
    setBackgroundType("image");
    setBackgroundValue(url);
    setBgMode("image");
    setCustomImageUrl("");
    setImageError(null);
  };

  const handleApplyPresetImage = (url: string) => {
    setBackgroundType("image");
    setBackgroundValue(url);
    setBgMode("image");
    setImageError(null);
  };

  const handleRemoveBackgroundImage = () => {
    setBackgroundType("gradient");
    setBackgroundValue("linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)");
    setBgMode("gradient");
    setImageError(null);
  };

  const handleSave = async () => {
    if (!pageData) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pageData.id,
          name: title || pageData.name,
          title,
          description,
          slug,
          logoUrl,
          settings: {
            backgroundType,
            backgroundValue,
            primaryColor,
            secondaryColor,
            textColor,
            buttonStyle,
            fontFamily,
            showContactForm,
          },
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setPageData(json.page);
        setSaveSuccess(true);
        setSaveError(null);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(json.error || "Não foi possível salvar as alterações.");
      }
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      setSaveError(err.message || "Erro de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = async () => {
    if (!pageData) return;
    try {
      let contentJson = "{}";
      if (newBlockType === "TEXT") {
        contentJson = JSON.stringify({ text: newBlockText || "Texto informativo." });
      } else if (newBlockType === "FAQ") {
        contentJson = JSON.stringify({
          items: [
            { question: "Qual o horário de atendimento?", answer: "De segunda a sexta, das 9h às 18h." },
            { question: "Como agendar um serviço?", answer: "Clique no botão do WhatsApp e nossa equipe responderá em minutos." },
          ],
        });
      } else if (newBlockType === "FORM") {
        contentJson = JSON.stringify({ title: newBlockTitle || "Envie sua mensagem" });
      }

      const res = await fetch("/api/pages/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: pageData.id,
          type: newBlockType,
          title: newBlockTitle,
          contentJson,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setPageData({
          ...pageData,
          blocks: [...(pageData.blocks || []), json.block],
        });
        setShowBlockModal(false);
        setNewBlockTitle("");
        setNewBlockText("");
      }
    } catch (err) {
      console.error("Erro ao criar bloco:", err);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const res = await fetch(`/api/pages/blocks?id=${blockId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPageData({
          ...pageData,
          blocks: pageData.blocks.filter((b: any) => b.id !== blockId),
        });
      }
    } catch (err) {
      console.error("Erro ao excluir bloco:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Carregando editor visual...</span>
      </div>
    );
  }

  if (loadError || !pageData) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto p-6 bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900">Não foi possível carregar a página</h3>
          <p className="text-xs text-slate-500">{loadError || "Erro ao conectar com o banco de dados."}</p>
        </div>
        <button
          type="button"
          onClick={loadPage}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tentar Novamente</span>
        </button>
      </div>
    );
  }

  // Prepara estado virtual para o Live Preview
  const previewPage = {
    ...pageData,
    name: title || pageData?.name || "Minha Empresa",
    slug,
    title,
    description,
    settings: {
      backgroundType,
      backgroundValue,
      primaryColor,
      secondaryColor,
      textColor,
      buttonStyle,
      fontFamily,
      layout: "classic",
      showContactForm,
    },
    organization: {
      ...(pageData?.organization || {}),
      name: title || pageData?.name || "Minha Empresa",
      logoUrl: logoUrl !== undefined ? logoUrl : pageData?.organization?.logoUrl,
      brandName:
        pageData?.organization?.whiteLabelParent?.tradeName ||
        pageData?.organization?.whiteLabelParent?.name ||
        (pageData?.organization?.isWhiteLabel
          ? (pageData?.organization?.tradeName || pageData?.organization?.name)
          : "Pajotree"),
      brandLogoUrl:
        pageData?.organization?.whiteLabelParent?.logoUrl ||
        (pageData?.organization?.isWhiteLabel ? pageData?.organization?.logoUrl : null),
      brandUrl:
        pageData?.organization?.whiteLabelParent?.whiteLabelDomain
          ? `https://${pageData.organization.whiteLabelParent.whiteLabelDomain}`
          : (pageData?.organization?.whiteLabelDomain ? `https://${pageData.organization.whiteLabelDomain}` : "/"),
    },
    links: pageData?.links || [],
    blocks: pageData?.blocks || [],
  };

  return (
    <div className="h-[calc(100vh-110px)] flex flex-col lg:flex-row gap-6">
      {/* Coluna Esquerda: Painel de Edição */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs overflow-hidden">
        {/* Header do Editor */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">Editor Visual</h2>
              <span className="text-[11px] text-slate-500">Personalize seu link na bio em tempo real</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs ${
                saveSuccess
                  ? "bg-emerald-600 text-white"
                  : saving
                  ? "bg-indigo-400 text-white cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? "Salvando..." : saveSuccess ? "Salvo com sucesso!" : "Salvar Alterações"}</span>
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {saveError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
            <button onClick={() => setSaveError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {saveSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Todas as alterações foram salvas com sucesso no banco de dados!</span>
          </div>
        )}

        {/* Abas do Editor */}
        <div className="flex items-center gap-2 py-3 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("design")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "design"
                ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Aparência & Cores
          </button>
          <button
            onClick={() => setActiveTab("blocks")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "blocks"
                ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Blocos & Conteúdo
          </button>
          <button
            onClick={() => setActiveTab("seo")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "seo"
                ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Slug & Informações
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {activeTab === "design" && (
            <div className="space-y-6">
              {/* Foto de Perfil / Logo */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Foto do Perfil / Logomarca</span>
                  </label>
                  <span className="text-[10px] text-slate-500">PNG, JPG ou WebP até 3 MB</span>
                </div>

                {logoError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{logoError}</span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 border-2 border-indigo-500/40 shadow-md flex items-center justify-center shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-white">
                          {(title || pageData?.name || "P").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{logoUrl ? "Trocar Foto" : "Enviar Foto"}</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Esta imagem será exibida no topo da sua página oficial de links.
                    </p>
                  </div>
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </div>
              {/* Temas Rápidos */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Temas Prontos
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleApplyTheme(theme)}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition group shadow-2xs"
                    >
                      <span className="text-xs font-semibold text-slate-900 block group-hover:text-indigo-700">
                        {theme.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {theme.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cores Principais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Cor Primária (Botões/Destaques)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Cor Secundária / Gradiente
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Personalização do Fundo */}
              <div className="space-y-4 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Fundo da Página</span>
                  </label>

                  {/* Tabs de Seleção de Tipo de Fundo */}
                  <div className="flex p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setBgMode("image");
                        setBackgroundType("image");
                      }}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        bgMode === "image"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Imagem de Fundo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBgMode("gradient");
                        setBackgroundType("gradient");
                        if (!backgroundValue || backgroundValue.startsWith("data:image/") || backgroundValue.startsWith("http")) {
                          setBackgroundValue("linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        bgMode === "gradient"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>Gradiente / Cor</span>
                    </button>
                  </div>
                </div>

                {imageError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {bgMode === "image" ? (
                  <div className="space-y-3.5">
                    {/* Imagem Atual / Upload */}
                    {backgroundType === "image" &&
                    backgroundValue &&
                    (backgroundValue.startsWith("data:image/") ||
                      backgroundValue.startsWith("http://") ||
                      backgroundValue.startsWith("https://") ||
                      backgroundValue.startsWith("url(")) ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 p-3 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-14 h-14 rounded-lg bg-cover bg-center border border-white/20 shadow-inner shrink-0"
                            style={{
                              backgroundImage: backgroundValue.startsWith("url(")
                                ? backgroundValue
                                : `url("${backgroundValue}")`,
                            }}
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block">
                              Imagem Ativa
                            </span>
                            <span className="text-[10px] text-slate-300 block truncate max-w-[170px]">
                              {backgroundValue.startsWith("data:image/")
                                ? "Imagem carregada localmente"
                                : backgroundValue}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${uploadingImage ? "animate-spin" : ""}`} />
                            <span>Trocar</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveBackgroundImage}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition"
                            title="Remover Imagem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-xl p-5 text-center cursor-pointer transition group"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
                          {uploadingImage ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          {uploadingImage ? "Carregando imagem..." : "Clique para enviar imagem de fundo"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          PNG, JPG, WebP ou GIF · até 3 MB
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileUpload(file);
                      }}
                    />

                    {/* URL Externa de Imagem */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Ou inserir URL direta da imagem
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="url"
                            placeholder="https://exemplo.com/fundo.jpg"
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 shadow-2xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyImageUrl}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>

                    {/* Sugestões de Imagens Curadas */}
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                        Sugestões de Imagens em Alta Qualidade
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {IMAGE_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyPresetImage(preset.url)}
                            className="group relative h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-500 transition shadow-2xs text-left"
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1">
                              <span className="text-[9px] font-bold text-white truncate drop-shadow-sm">
                                {preset.name}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Presets de Gradiente */}
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                        Gradientes Pré-definidos
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {GRADIENT_PRESETS.map((grad, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setBackgroundType("gradient");
                              setBackgroundValue(grad.value);
                            }}
                            className={`h-11 rounded-lg border p-1.5 flex flex-col justify-end transition shadow-2xs text-left ${
                              backgroundValue === grad.value
                                ? "ring-2 ring-indigo-500 border-indigo-500"
                                : "border-slate-200 hover:opacity-90"
                            }`}
                            style={{ background: grad.value }}
                          >
                            <span className="text-[9px] font-bold text-white drop-shadow-md">
                              {grad.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom CSS Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Código CSS de Fundo (Gradient ou Cor)
                      </label>
                      <input
                        type="text"
                        value={backgroundValue}
                        onChange={(e) => {
                          setBackgroundType("gradient");
                          setBackgroundValue(e.target.value);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 shadow-2xs"
                        placeholder="linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Estilo do Botão */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Formato dos Botões
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Arredondado", value: "rounded-xl" },
                    { label: "Pílula", value: "pill" },
                    { label: "Vidro (Glass)", value: "glass" },
                    { label: "Reto", value: "square" },
                  ].map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setButtonStyle(style.value)}
                      className={`py-2 px-2 text-center text-xs font-medium rounded-xl border transition ${
                        buttonStyle === style.value
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipografia & Fontes */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tipografia & Fonte da Página</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {fontFamily}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => setFontFamily(font.value)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        fontFamily === font.value
                          ? "bg-indigo-50/90 border-indigo-500 ring-1 ring-indigo-500 shadow-xs"
                          : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className="text-sm font-semibold text-slate-900 block"
                        style={{ fontFamily: font.value }}
                      >
                        {font.value}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {font.label.split("(")[1]?.replace(")", "") || font.value}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "blocks" && (
            <div className="space-y-5">
              {/* Toggle de Ativação do Formulário de Contato */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <label className="text-xs font-bold text-slate-800">
                      Formulário de Mensagem Direta / Contato
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        showContactForm
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {showContactForm ? "Exibindo na Página" : "Oculto"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Permite que os visitantes enviem nome, WhatsApp e mensagem diretamente pela sua página pública.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContactForm(!showContactForm)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showContactForm ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={showContactForm}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      showContactForm ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-800">
                  Blocos Adicionais & Conteúdo
                </span>
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Bloco</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {pageData?.blocks && pageData.blocks.length > 0 ? (
                  pageData.blocks.map((block: any) => (
                    <div
                      key={block.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          {block.type === "FORM" ? (
                            <FileText className="w-4 h-4" />
                          ) : block.type === "FAQ" ? (
                            <HelpCircle className="w-4 h-4" />
                          ) : (
                            <Type className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">
                            {block.title || block.type}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            Tipo: {block.type}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    Nenhum bloco extra adicionado. Clique no botão acima para adicionar formulários, FAQs ou textos.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Endereço Público (Slug)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500">
                    /p/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-r-xl text-xs text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Título da Bio
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Bio / Descrição Curta
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-2xs resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita: Live Preview Responsivo */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs items-center justify-between relative overflow-hidden">
        {/* Preview Device Controls */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-4 z-10">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`p-1.5 rounded-lg transition ${
                previewMode === "mobile"
                  ? "bg-white text-indigo-600 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Visualização Celular"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode("tablet")}
              className={`p-1.5 rounded-lg transition ${
                previewMode === "tablet"
                  ? "bg-white text-indigo-600 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Visualização Tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`p-1.5 rounded-lg transition ${
                previewMode === "desktop"
                  ? "bg-white text-indigo-600 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Visualização Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <a
            href={`/p/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            <span>Abrir Link Real</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Device Frame */}
        <div
          className={`flex-1 w-full overflow-hidden flex items-center justify-center transition-all duration-300 ${
            previewMode === "mobile"
              ? "max-w-[360px]"
              : previewMode === "tablet"
              ? "max-w-[500px]"
              : "max-w-full"
          }`}
        >
          <div className="w-full h-full max-h-[580px] rounded-3xl overflow-y-auto border-4 border-slate-800 shadow-xl bg-slate-950 relative">
            <PublicPageRenderer page={previewPage as any} />
          </div>
        </div>
      </div>

      {/* Modal Adicionar Bloco */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-base text-slate-900 mb-4">Adicionar Novo Bloco</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipo de Bloco
                </label>
                <select
                  value={newBlockType}
                  onChange={(e) => setNewBlockType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-2xs"
                >
                  <option value="TEXT">Bloco de Texto</option>
                  <option value="FORM">Formulário de Captação de Lead</option>
                  <option value="FAQ">FAQ / Perguntas Frequentes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Título do Bloco
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sobre Nossa Empresa"
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-2xs"
                />
              </div>

              {newBlockType === "TEXT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Conteúdo
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Digite a mensagem..."
                    value={newBlockText}
                    onChange={(e) => setNewBlockText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-2xs resize-none"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBlock}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
