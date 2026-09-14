"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Settings,
  Building,
  Save,
  Check,
  Globe,
  Phone,
  MessageCircle,
  Mail,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
  X,
} from "lucide-react";

const MAX_IMAGE_SIZE = 2.5 * 1024 * 1024; // 2.5 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
}

function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    // CPF
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  } else {
    // CNPJ
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
}

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
      else reject(new Error("Não foi possível ler a imagem."));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fields
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [segment, setSegment] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/organizations/settings");
        if (res.ok) {
          const json = await res.json();
          const org = json.organization;
          if (org) {
            setName(org.name || "");
            setTradeName(org.tradeName || "");
            setDocument(org.document ? formatDocument(org.document) : "");
            setPhone(org.phone ? formatPhone(org.phone) : "");
            setWhatsapp(org.whatsapp ? formatWhatsApp(org.whatsapp) : "");
            setWebsite(org.website || "");
            setSegment(org.segment || "Serviços");
            setDescription(org.description || "");
            setLogoUrl(org.logoUrl || "");
            if (org.domains?.length > 0) {
              setCustomDomain(org.domains[0].domain || "");
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setError(null);
    try {
      const base64 = await readImage(file);
      setLogoUrl(base64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar logomarca.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/organizations/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tradeName,
          document,
          phone,
          whatsapp,
          website,
          segment,
          description,
          logoUrl,
          customDomain,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar alterações");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar dados");
    } finally {
      setSaving(false);
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
    <div className="space-y-6 max-w-4xl pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Configurações da Empresa
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Atualize dados cadastrais, informações de contato, logotipo e domínio personalizado.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Configurações atualizadas com sucesso!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
        {/* Identidade Visual / Logomarca */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span>Logomarca da Empresa</span>
          </h3>

          <div className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-5 bg-slate-50/50 transition">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Preview Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0 relative group">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo da empresa" className="w-full h-full object-contain p-1" />
                ) : (
                  <Building className="w-8 h-8 text-slate-400" />
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Actions */}
              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <h4 className="text-xs font-bold text-slate-800">Enviar Imagem da Logomarca</h4>
                <p className="text-[11px] text-slate-500">
                  Formatos recomendados: PNG, JPG ou WebP de alta qualidade (até 2.5 MB).
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoUrl ? "Trocar Logomarca" : "Upload Logomarca"}</span>
                  </button>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  />

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Identificação Comercial</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Razão Social / Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Minha Empresa LTDA"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nome Fantasia (Marca)
              </label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex: Minha Empresa"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>CNPJ / CPF</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-formatação CNPJ ou CPF</span>
              </label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={document}
                onChange={(e) => setDocument(formatDocument(e.target.value))}
                maxLength={18}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Ex: 00.000.000/0001-00 (14 dígitos) ou CPF (11 dígitos)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Segmento de Atuação
              </label>
              <input
                type="text"
                placeholder="Ex: Consultoria, E-commerce, Saúde"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Contact Info with Masked Inputs */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-600" />
            <span>Canais de Contato</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Telefone Fixo
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="(00) 0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={14}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Formato: (00) 0000-0000</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>WhatsApp Oficial</span>
                <span className="text-[10px] text-emerald-600 font-bold">Com 9 dígitos</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="(00) 90000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                  maxLength={15}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Formato: (00) 90000-0000</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Website Oficial
              </label>
              <input
                type="url"
                placeholder="https://empresa.com.br"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">Link para seu site institucional</p>
            </div>
          </div>
        </div>

        {/* Branding & Custom Domain */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Descrição Institucional & Domínio</span>
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Domínio Próprio (Opcional)
              </label>
              <input
                type="text"
                placeholder="bio.minhaempresa.com.br"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Configure apontamento CNAME para <code className="text-indigo-600 font-mono">cname.pajotree.com.br</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Descrição Institucional (Bio da Empresa)
              </label>
              <textarea
                rows={3}
                placeholder="Breve resumo sobre a sua empresa, história e serviços prestados..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs resize-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
}
