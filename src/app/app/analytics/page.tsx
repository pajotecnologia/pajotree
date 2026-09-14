"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  Smartphone,
  Globe,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [pixelsData, setPixelsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Pixel modal state
  const [showPixelModal, setShowPixelModal] = useState(false);
  const [pixelType, setPixelType] = useState<"meta" | "google">("meta");
  const [pixelName, setPixelName] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [savingPixel, setSavingPixel] = useState(false);

  async function loadMetrics() {
    try {
      const [resAnalytics, resPixels] = await Promise.all([
        fetch(`/api/analytics?range=${range}`),
        fetch("/api/pixels"),
      ]);
      if (resAnalytics.ok) {
        const json = await resAnalytics.json();
        setData(json);
      }
      if (resPixels.ok) {
        const pJson = await resPixels.json();
        setPixelsData(pJson);
      }
    } catch (err) {
      console.error("Erro ao carregar analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, [range]);

  const handleSavePixel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPixel(true);
    try {
      const res = await fetch("/api/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: pixelType,
          name: pixelName,
          pixelId: pixelType === "meta" ? pixelId : undefined,
          measurementId: pixelType === "google" ? pixelId : undefined,
        }),
      });

      if (res.ok) {
        setShowPixelModal(false);
        setPixelName("");
        setPixelId("");
        await loadMetrics();
      }
    } catch (err) {
      console.error("Erro ao salvar pixel:", err);
    } finally {
      setSavingPixel(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const summary = data?.summary || {
    pageViews: 0,
    linkClicks: 0,
    leads: 0,
    uniqueVisitors: 0,
    conversionRate: "0.0%",
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Analytics & Rastreamento
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de tráfego, origens de conversão e pixels de rastreamento integrados.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs">
          {[
            { label: "Hoje", val: "today" },
            { label: "7 Dias", val: "7d" },
            { label: "30 Dias", val: "30d" },
            { label: "90 Dias", val: "90d" },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setRange(item.val)}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === item.val
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Total de Visitas</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.pageViews}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Visitantes Únicos</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.uniqueVisitors}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Cliques nos Links</span>
            <MousePointerClick className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.linkClicks}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Leads Convertidos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.leads}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Taxa de Conversão</span>
            <TrendingUp className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.conversionRate}</div>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origem do Tráfego / UTMs */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Principais Fontes & UTMs</h3>
          </div>

          <div className="space-y-2.5">
            {data?.sources && data.sources.length > 0 ? (
              data.sources.map((src: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <span className="font-semibold text-xs text-slate-800 truncate max-w-xs">
                    {src.name}
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    {src.value} acessos
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum tráfego registrado no período selecionado.
              </div>
            )}
          </div>
        </div>

        {/* Dispositivos */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-5">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Acessos por Dispositivo</h3>
          </div>

          <div className="space-y-2.5">
            {data?.devices && data.devices.length > 0 ? (
              data.devices.map((dev: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <span className="font-semibold text-xs text-slate-800 capitalize">
                    {dev.name}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {dev.value} visualizações
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Sem dados de dispositivos.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pixels & Integrations Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Pixels de Rastreamento Conectados</h3>
          </div>

          <button
            onClick={() => setShowPixelModal(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Pixel</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Meta Pixels */}
          {pixelsData?.metaPixels?.map((pixel: any) => (
            <div
              key={pixel.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs"
            >
              <div>
                <span className="font-bold text-xs text-slate-900 block">{pixel.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Pixel ID: {pixel.pixelId}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                Meta Pixel
              </span>
            </div>
          ))}

          {/* Google Analytics */}
          {pixelsData?.googleIntegrations?.map((ga: any) => (
            <div
              key={ga.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs"
            >
              <div>
                <span className="font-bold text-xs text-slate-900 block">Google Analytics 4</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Measurement ID: {ga.measurementId}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                GA4
              </span>
            </div>
          ))}

          {(!pixelsData?.metaPixels?.length && !pixelsData?.googleIntegrations?.length) && (
            <div className="col-span-2 py-6 text-center text-xs text-slate-400">
              Nenhum pixel configurado. Clique em &quot;Adicionar Pixel&quot; para conectar seu Meta Pixel ou Google Analytics.
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Pixel */}
      {showPixelModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-base text-slate-900 mb-4">Adicionar Pixel de Rastreamento</h3>

            <form onSubmit={handleSavePixel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Plataforma
                </label>
                <select
                  value={pixelType}
                  onChange={(e) => setPixelType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-2xs"
                >
                  <option value="meta">Meta Pixel (Facebook/Instagram)</option>
                  <option value="google">Google Analytics 4 (GA4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Identificador (Nome)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pixel Principal da Agência"
                  value={pixelName}
                  onChange={(e) => setPixelName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {pixelType === "meta" ? "Meta Pixel ID" : "Google Measurement ID (G-XXXXX)"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={pixelType === "meta" ? "Ex: 123456789012345" : "Ex: G-ABC123XYZ"}
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono shadow-2xs"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPixelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPixel}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  {savingPixel ? "Salvando..." : "Salvar Pixel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
