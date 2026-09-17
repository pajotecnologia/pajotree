"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { QrCode, Download, Copy, Check, ExternalLink, Loader2, Sparkles } from "lucide-react";

export default function QrCodePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadQr() {
      try {
        const res = await fetch("/api/qr");
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
      a.download = `qrcode-${data.pageSlug || "bio"}.png`;
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          QR Code Personalizado
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gere e baixe QR Codes em alta resolução para materiais impressos, balcões, cartões de visita e campanhas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* QR Preview Card */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs inline-block mb-4">
            {data?.qrDataUrl ? (
              <Image
                src={data.qrDataUrl}
                alt="QR Code da Página"
                width={220}
                height={220}
                className="w-56 h-56 mx-auto rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                Erro ao gerar QR Code
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500 font-mono block truncate max-w-[280px]">
            {data?.targetUrl ? data.targetUrl.replace(/^https?:\/\//, "") : `/p/${data?.pageSlug}`}
          </span>
        </div>

        {/* Actions & Target Link Details */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-xs font-semibold text-slate-700 block">
              URL de Destino
            </span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-indigo-700 truncate shadow-2xs">
              {data?.targetUrl}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copiado!" : "Copiar Link"}</span>
              </button>
              <a
                href={data?.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition shadow-2xs"
                title="Abrir no Navegador"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <button
            onClick={handleDownloadPng}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Imagem PNG em Alta Resolução</span>
          </button>
        </div>
      </div>
    </div>
  );
}
