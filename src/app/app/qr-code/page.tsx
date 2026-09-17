"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Copy, Check, ExternalLink, Loader2, QrCode } from "lucide-react";

export default function QrCodePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadQr() {
      try {
        const currentHost = typeof window !== "undefined" ? window.location.host : "";
        const url = currentHost ? `/api/qr?host=${encodeURIComponent(currentHost)}` : "/api/qr";
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Erro ao carregar QR Code:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQr();
  }, []);

  const handleCopy = () => {
    if (data?.targetUrl) {
      navigator.clipboard.writeText(data.targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPng = () => {
    if (data?.qrDataUrl) {
      const a = document.createElement("a");
      a.href = data.qrDataUrl;
      const cleanName = (data.brandName || data.pageSlug || "bio")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      a.download = `qrcode-${cleanName}.png`;
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Gerando QR Code personalizado...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="inline-flex items-center gap-1.5 text-slate-600 text-xs font-medium mb-1">
          <QrCode className="w-4 h-4 text-slate-500" />
          <span>Compartilhamento Rápido</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          QR Code Personalizado
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gere e baixe seu QR Code em alta resolução para materiais impressos, cartões de visita e divulgação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* QR Preview Card */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block">
            {data?.qrDataUrl ? (
              <Image
                src={data.qrDataUrl}
                alt="QR Code da Página"
                width={220}
                height={220}
                className="w-52 h-52 mx-auto rounded-lg"
                unoptimized
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                Erro ao gerar QR Code
              </div>
            )}
          </div>
          <span className="text-xs text-slate-600 font-mono block truncate max-w-[260px]">
            {data?.targetUrl ? data.targetUrl.replace(/^https?:\/\//, "") : `/p/${data?.pageSlug}`}
          </span>
        </div>

        {/* Actions & Target Link Details */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-3">
            <span className="text-xs font-semibold text-slate-700 block">
              URL de Destino
            </span>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 truncate select-all">
              {data?.targetUrl}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copied ? "Copiado!" : "Copiar Link"}</span>
              </button>
              <a
                href={data?.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Abrir no Navegador"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadPng}
            className="w-full py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Imagem PNG em Alta Resolução</span>
          </button>
        </div>
      </div>
    </div>
  );
}
