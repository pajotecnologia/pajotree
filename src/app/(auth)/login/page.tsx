"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Loader2, AlertCircle, ArrowRight, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { APP_VERSION } from "@/lib/app-meta";
import { useBranding } from "@/lib/use-branding";

interface LoginErrorResponse {
  error?: {
    code?: string;
    message?: string;
  } | string;
}

function LoginForm() {
  const router = useRouter();
  const branding = useBranding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginErrorResponse & {
        user?: { isSuperAdmin?: boolean };
      } = await res.json();

      if (!res.ok) {
        const apiError = data.error;
        const message =
          typeof apiError === "string"
            ? apiError
            : apiError?.message || "Erro ao efetuar login";
        throw new Error(message);
      }

      if (data.user?.isSuperAdmin) {
        router.push("/admin");
      } else {
        router.push("/app");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative z-10">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
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
        <h2 className="text-xl font-bold text-slate-900">Acesse sua conta</h2>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie sua página, leads, WhatsApp e CRM
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">E-mail</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">Senha</label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input id="login-password" type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm" />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: branding.isWhiteLabel ? branding.primaryColor : undefined }}
          className="w-full py-3.5 px-4 bg-indigo-600 hover:opacity-90 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Entrando...</span></>
          ) : (
            <><span>Entrar no Painel</span><ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
        <span>Ainda não possui uma conta? </span>
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">Cadastre sua empresa</Link>
        <div className="mt-3 text-[10px] text-slate-400 leading-relaxed">
          <span>Versão {APP_VERSION}</span>
          <span className="mx-1.5">•</span>
          <span>By {branding.vendorName}</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
