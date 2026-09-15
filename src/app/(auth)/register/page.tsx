"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Loader2, AlertCircle, ArrowRight, Building, Mail, Lock, User, Phone, Upload, Image as ImageIcon, X, Eye, EyeOff } from "lucide-react";
import { APP_VERSION } from "@/lib/app-meta";
import { useBranding } from "@/lib/use-branding";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

function RegisterForm() {
  const router = useRouter();
  const branding = useBranding();
  const [refParam, setRefParam] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [segment, setSegment] = useState("Serviços");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setRefParam(params.get("ref") || "");
    }
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError("A logomarca deve estar em PNG, JPG ou WebP.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setError("A logomarca deve ter no máximo 2 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoDataUrl(reader.result);
        setLogoName(file.name);
        setError(null);
      }
    };
    reader.onerror = () => setError("Não foi possível ler a logomarca selecionada.");
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoDataUrl(null);
    setLogoName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName,
          whatsapp,
          segment,
          logoDataUrl,
          whiteLabelRef: branding.orgId || refParam || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar empresa");
      }

      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta");
    } finally {
      setLoading(false);
    }
  }

  const effectiveRef = refParam || branding.orgId || "";
  const loginUrl = effectiveRef ? `/login?ref=${encodeURIComponent(effectiveRef)}` : "/login";
  const homeUrl = effectiveRef ? `/wl/${encodeURIComponent(effectiveRef)}` : "/";

  return (
    <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl relative z-10">
      <div className="text-center mb-8">
        <Link href={homeUrl} className="inline-flex items-center gap-2.5 mb-3 group">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.brandName}
              className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 shadow-md group-hover:scale-105 transition"
            />
          ) : branding.isWhiteLabel ? (
            <div
              className="w-10 h-10 rounded-xl text-white font-black text-lg flex items-center justify-center shadow-md group-hover:scale-105 transition"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {branding.brandName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
          )}

          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            {branding.isWhiteLabel ? (
              <span>{branding.brandName}</span>
            ) : (
              <>
                Pajo<span className="text-indigo-600">tree</span>
              </>
            )}
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">Crie sua conta profissional</h2>
        <p className="text-xs text-slate-500 mt-1">
          {branding.isWhiteLabel
            ? `Junte-se a ${branding.brandName} e impulsione seu negócio`
            : "Comece agora com 14 dias de teste grátis no plano PRO"}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Seu Nome *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input type="text" required placeholder="Ex: Carlos Mendes" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nome da Empresa *</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input type="text" required placeholder="Ex: Agência Alpha" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Logomarca da Empresa</label>
          {logoDataUrl ? (
            <div className="flex items-center gap-3 p-3 border border-indigo-100 bg-indigo-50/50 rounded-xl">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                <img src={logoDataUrl} alt="Pré-visualização da logomarca" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{logoName}</p>
                <p className="text-xs text-slate-500">PNG, JPG ou WebP · até 2 MB</p>
              </div>
              <button type="button" onClick={removeLogo} aria-label="Remover logomarca" className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-3 p-4 border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl cursor-pointer transition">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Adicionar logomarca</p>
                <p className="text-xs text-slate-500 mt-0.5">PNG, JPG ou WebP · até 2 MB</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold">
                <Upload className="w-3.5 h-3.5" /> Escolher
              </span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} className="sr-only" />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">E-mail Corporativo *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input type="email" required placeholder="seu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">WhatsApp Comercial</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input type="tel" placeholder="(11) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Segmento</label>
            <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm">
              <option value="Serviços">Prestador de Serviços</option>
              <option value="Comércio">Comércio / Loja</option>
              <option value="Saúde e Beleza">Saúde, Estética & Beleza</option>
              <option value="Infoprodutos">Infoprodutor / Criador</option>
              <option value="Restaurantes">Gastronomia / Restaurante</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="register-password" className="block text-xs font-semibold text-slate-700 mb-1.5">Senha de Acesso *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input id="register-password" type={showPassword ? "text" : "password"} required placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm" />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: branding.isWhiteLabel ? branding.primaryColor : undefined }}
          className="w-full py-3.5 px-4 bg-indigo-600 hover:opacity-90 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Configurando sua empresa...</span></>
          ) : (
            <><span>Criar Minha Empresa Grátis</span><ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
        <span>Já possui uma conta? </span>
        <Link href={loginUrl} className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">Fazer login</Link>
        <div className="mt-3 text-[10px] text-slate-400 leading-relaxed">
          <span>Versão {APP_VERSION}</span>
          <span className="mx-1.5">•</span>
          <span>By {branding.vendorName}</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
