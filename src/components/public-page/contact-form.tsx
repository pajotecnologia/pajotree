"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ContactFormProps {
  pageSlug: string;
  buttonColor?: string;
  textColor?: string;
  title?: string;
}

export function PublicContactForm({
  pageSlug,
  buttonColor = "#6366f1",
  textColor = "#ffffff",
  title = "Envie uma mensagem direta",
}: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leads/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug,
          name,
          email,
          whatsapp,
          message,
          source: "public_page_contact_block",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setWhatsapp("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Não foi possível enviar sua mensagem.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center backdrop-blur-md animate-fade-in">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <h4 className="text-emerald-300 font-semibold text-lg">Mensagem Recebida!</h4>
        <p className="text-emerald-200/80 text-sm mt-1">
          Agradecemos o contato. Responderemos o mais breve possível.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-xs font-medium text-emerald-400 hover:underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl text-left space-y-4"
    >
      <div className="text-center mb-2">
        <h3 className="font-bold text-lg text-white">{title}</h3>
        <p className="text-xs text-slate-400">Preencha os campos para falar conosco</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Seu Nome *</label>
        <input
          type="text"
          required
          placeholder="Ex: Ana Silva"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp</label>
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
          <input
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Mensagem ou Dúvida</label>
        <textarea
          rows={3}
          placeholder="Como podemos te ajudar?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{ backgroundColor: buttonColor, color: textColor }}
        className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enviando...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Enviar Mensagem</span>
          </>
        )}
      </button>
    </form>
  );
}
