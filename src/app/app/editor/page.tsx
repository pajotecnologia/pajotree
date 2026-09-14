"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { PublicPageRenderer } from "@/components/public-page/page-renderer";

export default function VisualEditorPage() {
  const [pageData, setPageData] = useState<any>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [activeTab, setActiveTab] = useState<"design" | "blocks" | "seo">("design");

  // Local editable state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [backgroundType, setBackgroundType] = useState("gradient");
  const [backgroundValue, setBackgroundValue] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#ec4899");
  const [textColor, setTextColor] = useState("#ffffff");
  const [buttonStyle, setButtonStyle] = useState("rounded-xl");
  const [fontFamily, setFontFamily] = useState("Inter");

  // New Block Modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newBlockType, setNewBlockType] = useState("TEXT");
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockText, setNewBlockText] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        const res = await fetch("/api/pages");
        if (res.ok) {
          const json = await res.json();
          setPageData(json.page);
          setThemes(json.themes || []);

          setTitle(json.page.title || "");
          setDescription(json.page.description || "");
          setSlug(json.page.slug || "");

          const settings = json.page.settings;
          if (settings) {
            setBackgroundType(settings.backgroundType || "gradient");
            setBackgroundValue(settings.backgroundValue || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)");
            setPrimaryColor(settings.primaryColor || "#6366f1");
            setSecondaryColor(settings.secondaryColor || "#ec4899");
            setTextColor(settings.textColor || "#ffffff");
            setButtonStyle(settings.buttonStyle || "rounded-xl");
            setFontFamily(settings.fontFamily || "Inter");
          }
        }
      } catch (err) {
        console.error("Erro ao carregar editor:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  }, []);

  const handleApplyTheme = (theme: any) => {
    try {
      const config = JSON.parse(theme.configJson);
      if (config.backgroundType) setBackgroundType(config.backgroundType);
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

  const handleSave = async () => {
    if (!pageData) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pageData.id,
          title,
          description,
          slug,
          settings: {
            backgroundType,
            backgroundValue,
            primaryColor,
            secondaryColor,
            textColor,
            buttonStyle,
            fontFamily,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setPageData(json.page);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
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
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
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
    },
    organization: pageData?.organization || { name: title || pageData?.name || "Minha Empresa" },
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
            <h2 className="text-base font-bold text-slate-900">Editor Visual</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs ${
                saveSuccess
                  ? "bg-emerald-600 text-white"
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
              <span>{saveSuccess ? "Salvo!" : "Salvar Alterações"}</span>
            </button>
          </div>
        </div>

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

              {/* Fundo Customizado */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Estilo de Fundo (CSS Background)
                </label>
                <input
                  type="text"
                  value={backgroundValue}
                  onChange={(e) => setBackgroundValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-2xs"
                  placeholder="linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)"
                />
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
            </div>
          )}

          {activeTab === "blocks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Blocos Ativos da Página
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
