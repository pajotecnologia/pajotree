"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Link2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Globe,
  MessageCircle,
  Sparkles,
  Smartphone,
  HelpCircle,
  Zap,
  Pencil,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

export default function LinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [metaPixels, setMetaPixels] = useState<any[]>([]);
  const [planUsage, setPlanUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // Link Form State
  const [linkType, setLinkType] = useState<"custom" | "whatsapp">("custom");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("globe");
  const [featured, setFeatured] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState("");
  const [eventName, setEventName] = useState("LinkClick");

  // WhatsApp Generator State
  const [waPhone, setWaPhone] = useState("");
  const [waMessage, setWaMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      const res = await fetch("/api/links");
      if (res.ok) {
        const json = await res.json();
        setLinks(json.links || []);
        setMetaPixels(json.metaPixels || []);
        setPlanUsage(json.planUsage);
      }
    } catch (err) {
      console.error("Erro ao carregar links:", err);
    } finally {
      setLoading(false);
    }
  }

  const syncReorder = async (updatedLinks: any[]) => {
    try {
      setReordering(true);
      const res = await fetch("/api/links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkIds: updatedLinks.map((l) => l.id) }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao salvar nova ordem dos links");
      }
    } catch (err) {
      console.error("Erro ao reordenar links:", err);
      await loadData();
    } finally {
      setReordering(false);
    }
  };

  const handleMoveLink = async (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;

    const newLinks = [...links];
    const [movedLink] = newLinks.splice(currentIndex, 1);
    newLinks.splice(targetIndex, 0, movedLink);

    const remapped = newLinks.map((l, idx) => ({ ...l, position: idx }));
    setLinks(remapped);
    await syncReorder(remapped);
  };

  const handleSetPosition = async (currentIndex: number, targetIndex: number) => {
    if (targetIndex === currentIndex || targetIndex < 0 || targetIndex >= links.length) return;

    const newLinks = [...links];
    const [movedLink] = newLinks.splice(currentIndex, 1);
    newLinks.splice(targetIndex, 0, movedLink);

    const remapped = newLinks.map((l, idx) => ({ ...l, position: idx }));
    setLinks(remapped);
    await syncReorder(remapped);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyShortLink = (code: string, id: string) => {
    const fullUrl = `${window.location.origin}/go/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleIconChange = (newIcon: string) => {
    setIcon(newIcon);
    if (newIcon === "whatsapp") {
      setEventName("Contact");
    }
  };

  const handleUpdateWhatsAppUrl = (phone: string, msg: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      setUrl("");
      return;
    }
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const encodedMsg = msg.trim() ? `?text=${encodeURIComponent(msg.trim())}` : "";
    setUrl(`https://wa.me/${fullPhone}${encodedMsg}`);
  };

  const handleOpenCreate = () => {
    setEditingLinkId(null);
    setError(null);
    setTitle("");
    setUrl("");
    setDescription("");
    setIcon("globe");
    setFeatured(false);
    setMetaPixelId("");
    setEventName("LinkClick");
    setWaPhone("");
    setWaMessage("");
    setLinkType("custom");
    setShowModal(true);
  };

  const handleOpenEdit = (link: any) => {
    setEditingLinkId(link.id);
    setError(null);
    setTitle(link.title || "");
    setUrl(link.url || "");
    setDescription(link.description || "");
    setIcon(link.icon || "globe");
    setFeatured(!!link.featured);
    setMetaPixelId(link.trackingConfig?.metaPixelId || "");
    setEventName(link.trackingConfig?.eventName || "LinkClick");

    const isWa = link.icon === "whatsapp" || (link.url && link.url.includes("wa.me"));
    if (isWa) {
      setLinkType("whatsapp");
      try {
        const parsed = new URL(link.url);
        let p = parsed.pathname.replace(/^\//, "");
        if (p.startsWith("55") && p.length >= 12) {
          p = p.substring(2);
        }
        setWaPhone(p);
        setWaMessage(parsed.searchParams.get("text") || "");
      } catch {
        const match = (link.url || "").match(/wa\.me\/(\d+)/);
        if (match) {
          let p = match[1];
          if (p.startsWith("55") && p.length >= 12) p = p.substring(2);
          setWaPhone(p);
        }
        const textMatch = (link.url || "").match(/text=([^&]+)/);
        if (textMatch) {
          setWaMessage(decodeURIComponent(textMatch[1]));
        }
      }
    } else {
      setLinkType("custom");
      setWaPhone("");
      setWaMessage("");
    }

    setShowModal(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let finalUrl = url.trim();
    if (linkType === "whatsapp") {
      const cleanPhone = waPhone.replace(/\D/g, "");
      if (!cleanPhone) {
        setError("Por favor, digite o número do WhatsApp com DDD.");
        setSubmitting(false);
        return;
      }
      const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
      const encodedMsg = waMessage.trim() ? `?text=${encodeURIComponent(waMessage.trim())}` : "";
      finalUrl = `https://wa.me/${fullPhone}${encodedMsg}`;
    } else {
      if (!finalUrl) {
        setError("Por favor, informe a URL de destino.");
        setSubmitting(false);
        return;
      }
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = `https://${finalUrl}`;
      }
    }

    try {
      const endpoint = "/api/links";
      const method = editingLinkId ? "PUT" : "POST";
      const payload: any = {
        title: title.trim(),
        url: finalUrl,
        description: description.trim(),
        icon,
        featured,
        metaPixelId: metaPixelId || undefined,
        eventName,
      };

      if (editingLinkId) {
        payload.id = editingLinkId;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (editingLinkId ? "Erro ao editar link" : "Erro ao criar link"));

      setShowModal(false);
      setEditingLinkId(null);
      setTitle("");
      setUrl("");
      setDescription("");
      setIcon("globe");
      setFeatured(false);
      setMetaPixelId("");
      setEventName("LinkClick");
      setWaPhone("");
      setWaMessage("");
      setLinkType("custom");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar link");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este link?")) return;
    try {
      const res = await fetch(`/api/links?id=${id}`, { method: "DELETE" });
      if (res.ok) setLinks(links.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Erro ao excluir link:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const maxLinks = planUsage?.features?.maxLinks || 5;
  const currentCount = links.length;
  const isLimitReached = currentCount >= maxLinks;

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">
            Links & Tracking de Cliques
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Crie links inteligentes com redirecionamento rastreável, disparo automático de eventos no Meta Pixel e suporte a WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={isLimitReached}
          className="min-h-11 w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Link</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Link2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-800 block break-words">
              Consumo do Plano: {currentCount} de {maxLinks} links utilizados
            </span>
            <span className="text-[10px] text-slate-500 block">
              {isLimitReached
                ? "Limite máximo atingido. Faça upgrade do seu plano para criar mais links."
                : `Você ainda pode criar mais ${maxLinks - currentCount} link(s).`}
            </span>
          </div>
        </div>
        <div className="w-full sm:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.min((currentCount / maxLinks) * 100, 100)}%` }}
            className={`h-full transition-all ${isLimitReached ? "bg-rose-500" : "bg-indigo-600"}`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-slate-500">
            Arraste ou use os botões / seletor de posição (<span className="font-bold text-slate-700">#1, #2, #3...</span>) para definir a ordem na bio.
          </span>
          {reordering && (
            <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Salvando ordem...</span>
            </span>
          )}
        </div>

        {links.length > 0 ? (
          links.map((link, index) => {
            const shortCode = link.shortLinks?.[0]?.code;
            const clickCount = link._count?.analyticsEvents || 0;
            return (
              <div
                key={link.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 hover:border-indigo-200 transition min-w-0"
              >
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  {/* Reorder Buttons & Position Selector */}
                  <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <div className="flex flex-col items-center justify-center">
                      <button
                        type="button"
                        disabled={index === 0 || reordering}
                        onClick={() => handleMoveLink(index, "up")}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition"
                        title="Subir posição"
                        aria-label="Subir posição"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === links.length - 1 || reordering}
                        onClick={() => handleMoveLink(index, "down")}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition"
                        title="Descer posição"
                        aria-label="Descer posição"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative">
                      <select
                        value={index}
                        disabled={reordering}
                        onChange={(e) => handleSetPosition(index, parseInt(e.target.value, 10))}
                        className="appearance-none cursor-pointer w-9 h-9 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-xs font-black text-slate-800 text-center transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-2xs"
                        title={`Posição ${index + 1} de ${links.length}. Clique para alterar.`}
                      >
                        {links.map((_, i) => (
                          <option key={i} value={i}>
                            #{i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 text-indigo-600 shrink-0">
                    {link.icon === "whatsapp" ? (
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 break-words">{link.title}</span>
                      {link.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase border border-indigo-100 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Destaque
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block truncate max-w-full sm:max-w-md mt-0.5">
                      {link.url}
                    </span>
                    {shortCode && (
                      <span className="text-[10px] text-indigo-600 font-mono mt-0.5 block break-all">
                        Link de tracking: /go/{shortCode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5 border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0 justify-between md:justify-end flex-wrap">
                  <div className="min-h-10 px-3 py-1 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col justify-center">
                    <span className="text-xs font-extrabold text-slate-900 block leading-tight">{clickCount}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Cliques</span>
                  </div>
                  {shortCode && (
                    <button
                      type="button"
                      onClick={() => handleCopyShortLink(shortCode, link.id)}
                      className="min-h-10 min-w-10 p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition shadow-2xs flex items-center justify-center"
                      title="Copiar Link de Redirecionamento"
                      aria-label="Copiar Link de Redirecionamento"
                    >
                      {copiedId === link.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-10 min-w-10 p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition shadow-2xs flex items-center justify-center"
                    title="Acessar Destino Real"
                    aria-label="Acessar Destino Real"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(link)}
                    className="min-h-10 min-w-10 p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-indigo-600 transition shadow-2xs flex items-center justify-center"
                    title="Editar Link"
                    aria-label="Editar Link"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link.id)}
                    className="min-h-10 min-w-10 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition shadow-2xs flex items-center justify-center"
                    title="Excluir Link"
                    aria-label="Excluir Link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
            Nenhum link cadastrado ainda. Clique em &quot;Novo Link&quot; para começar.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingLinkId ? "Editar Link Rastreável" : "Adicionar Link Rastreável"}
              </h3>
              <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setLinkType("custom");
                    setIcon("globe");
                  }}
                  className={`px-2.5 py-1 rounded-md transition ${
                    linkType === "custom"
                      ? "bg-white text-indigo-600 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Link / Site
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLinkType("whatsapp");
                    setIcon("whatsapp");
                    setEventName("Contact");
                  }}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    linkType === "whatsapp"
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Título do Link *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    linkType === "whatsapp"
                      ? "Ex: Agende sua Consulta em Garanhuns"
                      : "Ex: Acesse nosso Site Oficial"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full min-h-11 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                />
              </div>

              {linkType === "whatsapp" ? (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Gerador Automático de Link WhatsApp</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Número com DDD (apenas números) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 87999999999"
                      value={waPhone}
                      onChange={(e) => {
                        setWaPhone(e.target.value);
                        handleUpdateWhatsAppUrl(e.target.value, waMessage);
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Mensagem Pronta (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Olá! Gostaria de agendar uma consulta em Garanhuns."
                      value={waMessage}
                      onChange={(e) => {
                        setWaMessage(e.target.value);
                        handleUpdateWhatsAppUrl(waPhone, e.target.value);
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {url && (
                    <div className="p-2 rounded-lg bg-white/80 border border-emerald-100 text-[10px] text-emerald-800 font-mono truncate">
                      Link gerado: {url}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    URL de Destino *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://meusite.com.br/oferta ou meusite.com.br"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full min-h-11 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Adicionaremos https:// automaticamente caso não informado.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ícone</label>
                  <select
                    value={icon}
                    onChange={(e) => handleIconChange(e.target.value)}
                    className="w-full min-h-11 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  >
                    <option value="globe">🌐 Globo / Site Geral</option>
                    <option value="whatsapp">📱 WhatsApp</option>
                    <option value="instagram">📸 Instagram</option>
                    <option value="facebook">📘 Facebook</option>
                    <option value="youtube">🎥 YouTube / Vídeo</option>
                    <option value="linkedin">💼 LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Evento de Conversão (Pixel)
                  </label>
                  <select
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full min-h-11 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium"
                  >
                    <option value="Contact">Contato no WhatsApp / Chat (Contact)</option>
                    <option value="Schedule">Agendamento de Consulta / Serviço (Schedule)</option>
                    <option value="Lead">Cadastro de Lead / Formulário (Lead)</option>
                    <option value="ViewContent">Visualização de Conteúdo / Catálogo (ViewContent)</option>
                    <option value="LinkClick">Clique Geral no Link (LinkClick)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="featured" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Destacar este link na bio com animação e borda colorida
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="min-h-11 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-11 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : editingLinkId ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{editingLinkId ? "Salvar Alterações" : "Criar Link"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
