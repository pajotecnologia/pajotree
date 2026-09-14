"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Link2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  MousePointerClick,
  Target,
  AlertCircle,
  Loader2,
  Globe,
  MessageCircle,
} from "lucide-react";

export default function LinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [metaPixels, setMetaPixels] = useState<any[]>([]);
  const [planUsage, setPlanUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("globe");
  const [featured, setFeatured] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState("");
  const [eventName, setEventName] = useState("LinkClick");
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

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyShortLink = (code: string, id: string) => {
    const fullUrl = `${window.location.origin}/go/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          description,
          icon,
          featured,
          metaPixelId: metaPixelId || undefined,
          eventName,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erro ao criar link");
      }

      setShowModal(false);
      setTitle("");
      setUrl("");
      setDescription("");
      setIcon("globe");
      setFeatured(false);
      setMetaPixelId("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Erro ao criar link");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este link?")) return;
    try {
      const res = await fetch(`/api/links?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setLinks(links.filter((l) => l.id !== id));
      }
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
    <div className="space-y-6">
      {/* Header & Limits Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Links & Tracking de Cliques
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Crie links rastreáveis com redirecionamento `/go/`, Meta Pixel dedicado e UTMs automáticas.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowModal(true);
          }}
          disabled={isLimitReached}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Link</span>
        </button>
      </div>

      {/* Quota Progress */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-800 block">
              Consumo do Plano: {currentCount} de {maxLinks} links utilizados
            </span>
            <span className="text-[10px] text-slate-500">
              {isLimitReached
                ? "Limite máximo atingido. Faça upgrade do seu plano para criar mais links."
                : `Você ainda pode criar mais ${maxLinks - currentCount} link(s).`}
            </span>
          </div>
        </div>

        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
          <div
            style={{ width: `${Math.min((currentCount / maxLinks) * 100, 100)}%` }}
            className={`h-full transition-all ${
              isLimitReached ? "bg-rose-500" : "bg-indigo-600"
            }`}
          />
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {links.length > 0 ? (
          links.map((link) => {
            const shortCode = link.shortLinks?.[0]?.code;
            const clickCount = link._count?.analyticsEvents || 0;

            return (
              <div
                key={link.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-200 transition"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-indigo-600 shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{link.title}</span>
                      {link.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase border border-indigo-100">
                          Destaque
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block truncate max-w-sm sm:max-w-md mt-0.5">
                      {link.url}
                    </span>
                    {shortCode && (
                      <span className="text-[10px] text-indigo-600 font-mono mt-1 block">
                        Link de tracking: /go/{shortCode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 justify-between md:justify-end">
                  {/* Clicks Badge */}
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {clickCount}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                      Cliques
                    </span>
                  </div>

                  {/* Copy Short Link */}
                  {shortCode && (
                    <button
                      onClick={() => handleCopyShortLink(shortCode, link.id)}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition shadow-2xs"
                      title="Copiar Link de Redirecionamento"
                    >
                      {copiedId === link.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* External Destination */}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition shadow-2xs"
                    title="Acessar Destino Real"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition shadow-2xs"
                    title="Excluir Link"
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

      {/* Modal Criar Link */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-base text-slate-900 mb-4">Adicionar Link Rastreável</h3>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Título do Link *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Agende sua Consultoria Grátis"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  URL de Destino *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://meusite.com.br/oferta"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ícone
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  >
                    <option value="globe">Globo / Site</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Evento de Conversão (Pixel)
                  </label>
                  <select
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  >
                    <option value="LinkClick">LinkClick (Padrão)</option>
                    <option value="Lead">Lead</option>
                    <option value="Contact">Contact</option>
                    <option value="Schedule">Schedule</option>
                    <option value="ViewContent">ViewContent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="featured" className="text-xs text-slate-700 font-medium">
                  Destacar este link na bio com animação e borda colorida
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Criar Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
