"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Image as ImageIcon,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const FONTS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Nunito",
  "Playfair Display",
  "DM Sans",
] as const;

type WhiteLabelData = {
  brandName: string;
  description: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundValue: string;
  buttonStyle: "square" | "rounded" | "rounded-xl" | "pill" | "glass";
  fontFamily: (typeof FONTS)[number];
};

const DEFAULTS: WhiteLabelData = {
  brandName: "Minha Empresa",
  description: "",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#6366f1",
  secondaryColor: "#ec4899",
  textColor: "#ffffff",
  backgroundValue: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
  buttonStyle: "rounded-xl",
  fontFamily: "Inter",
};

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error("Use PNG, JPG ou WebP."));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error("A imagem deve ter no máximo 2 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Não foi possível ler a imagem."));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

export default function WhiteLabelPage() {
  const [form, setForm] = useState<WhiteLabelData>(DEFAULTS);
  const [original, setOriginal] = useState<WhiteLabelData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState({ name: "FREE", customDomainAllowed: false, removeBranding: false });

  useEffect(() => {
    fetch("/api/settings/white-label", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Não foi possível carregar o White Label.");
        setForm({ ...DEFAULTS, ...data.whiteLabel });
        setOriginal({ ...DEFAULTS, ...data.whiteLabel });
        setPlan(data.plan || { name: "FREE", customDomainAllowed: false, removeBranding: false });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar configurações."))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof WhiteLabelData>(key: K, value: WhiteLabelData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSuccess(false);
  };

  async function handleImageChange(file: File, field: "logoUrl" | "faviconUrl") {
    try {
      const value = await readImage(file);
      update(field, value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imagem inválida.");
    }
  }

  async function save() {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/settings/white-label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar White Label.");
      setOriginal(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar White Label.");
    } finally {
      setSaving(false);
    }
  }

  function restore() {
    setForm(original);
    setError(null);
    setSuccess(false);
  }

  const buttonClass = useMemo(() => {
    switch (form.buttonStyle) {
      case "pill": return "rounded-full";
      case "square": return "rounded-none";
      case "rounded": return "rounded-md";
      case "glass": return "rounded-2xl backdrop-blur-md bg-white/10 border border-white/20";
      default: return "rounded-2xl";
    }
  }, [form.buttonStyle]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">White Label</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Personalize sua página pública com a identidade da sua empresa.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold">
          Plano {plan.name}
        </span>
      </div>

      {success && <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"><Check className="w-4 h-4" /> White Label atualizado com sucesso.</div>}
      {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="space-y-6">
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-indigo-600" /><h2 className="text-sm font-bold text-slate-900">Identidade</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nome da marca</label>
                <input value={form.brandName} onChange={(e) => update("brandName", e.target.value)} maxLength={120} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Descrição</label>
                <input value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={500} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 cursor-pointer transition flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0"><p className="text-xs font-bold text-slate-800">Logomarca</p><p className="text-[11px] text-slate-500">PNG, JPG ou WebP · até 2 MB</p></div>
                <Upload className="w-4 h-4 text-slate-400 ml-auto" />
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0], "logoUrl")} />
              </label>
              <label className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 cursor-pointer transition flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {form.faviconUrl ? <img src={form.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" /> : <ImageIcon className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0"><p className="text-xs font-bold text-slate-800">Favicon</p><p className="text-[11px] text-slate-500">PNG, JPG ou WebP · até 2 MB</p></div>
                <Upload className="w-4 h-4 text-slate-400 ml-auto" />
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0], "faviconUrl")} />
              </label>
            </div>
          </section>

          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center gap-2"><Palette className="w-4 h-4 text-indigo-600" /><h2 className="text-sm font-bold text-slate-900">Cores e aparência</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([['primaryColor','Cor primária'],['secondaryColor','Cor secundária'],['textColor','Cor do texto']] as const).map(([key,label]) => (
                <label key={key} className="block"><span className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</span><div className="flex gap-2"><input type="color" value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-11 h-10 rounded-lg border border-slate-200 p-1 bg-white" /><input value={form[key]} onChange={(e) => update(key, e.target.value)} maxLength={7} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-mono uppercase" /></div></label>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-slate-700 mb-1.5">Fonte</label><select value={form.fontFamily} onChange={(e) => update("fontFamily", e.target.value as WhiteLabelData["fontFamily"])} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">{FONTS.map((font) => <option key={font}>{font}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1.5">Estilo dos botões</label><select value={form.buttonStyle} onChange={(e) => update("buttonStyle", e.target.value as WhiteLabelData["buttonStyle"])} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"><option value="rounded-xl">Arredondado</option><option value="rounded">Suave</option><option value="pill">Pílula</option><option value="square">Quadrado</option><option value="glass">Glass</option></select></div>
              </div>
            <div><label className="block text-xs font-semibold text-slate-700 mb-1.5">Fundo da página</label><input value={form.backgroundValue} onChange={(e) => update("backgroundValue", e.target.value)} maxLength={500} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono" placeholder="linear-gradient(...) ou #0f172a" /></div>
          </section>

          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-start gap-3"><Type className="w-4 h-4 text-indigo-600 mt-0.5" /><div><h2 className="text-sm font-bold text-slate-900">Recursos White Label</h2><p className="text-xs text-slate-500 mt-1">Os recursos avançados seguem as permissões do seu plano.</p></div></div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><b>Domínio personalizado</b><span className="block mt-1 text-slate-500">{plan.customDomainAllowed ? "Disponível no seu plano." : "Faça upgrade para habilitar."}</span></div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><b>Remover marca Pajotree</b><span className="block mt-1 text-slate-500">{plan.removeBranding ? "Disponível no seu plano." : "Faça upgrade para remover o branding."}</span></div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onClick={restore} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Restaurar</button>
            <button type="button" onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar White Label"}</button>
          </div>
        </div>

        <aside className="xl:sticky xl:top-24 h-fit">
          <div className="p-4 bg-slate-900 rounded-3xl shadow-xl overflow-hidden">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Preview da página pública</div>
            <div className="min-h-[540px] rounded-2xl p-4 flex flex-col items-center text-center" style={{ background: form.backgroundValue, color: form.textColor, fontFamily: form.fontFamily }}>
              <div className="w-full flex justify-end"><span className="text-[9px] px-2 py-1 rounded-full bg-black/20 text-white/70">Compartilhar</span></div>
              <div className="mt-8 w-20 h-20 rounded-full p-1" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}>
                <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-white text-xl font-bold">{form.logoUrl ? <img src={form.logoUrl} alt="Preview" className="w-full h-full object-cover" /> : form.brandName.charAt(0).toUpperCase()}</div>
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-white">{form.brandName || "Minha Empresa"}</h3>
              {form.description && <p className="mt-1 text-[10px] text-white/70 max-w-[240px]">{form.description}</p>}
              <div className="w-full mt-6 space-y-2">
                <div className={`p-3 bg-slate-900/70 border border-white/10 text-white text-xs font-semibold ${buttonClass}`} style={{ borderColor: form.primaryColor }}>Meu principal link</div>
                <div className={`p-3 bg-slate-900/70 border border-white/10 text-white text-xs font-semibold ${buttonClass}`}>Fale comigo</div>
              </div>
              {!plan.removeBranding && <div className="mt-auto pt-8 text-[9px] text-white/50">Criado com Pajotree</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
