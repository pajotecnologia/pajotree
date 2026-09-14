"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function FormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadForms() {
    try {
      const res = await fetch("/api/forms");
      if (res.ok) {
        const json = await res.json();
        setForms(json.forms || []);
      }
    } catch (err) {
      console.error("Erro ao carregar formulários:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForms();
  }, []);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          fields: [
            { label: "Nome Completo", type: "text", required: true },
            { label: "WhatsApp", type: "phone", required: true },
            { label: "E-mail", type: "email", required: false },
            { label: "Mensagem", type: "textarea", required: false },
          ],
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erro ao criar formulário");
      }

      setShowModal(false);
      setTitle("");
      setDescription("");
      await loadForms();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setCreating(false);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Formulários de Captação
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Crie formulários inteligentes para coletar dados de visitantes e enviar direto ao seu funil CRM.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Formulário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.length > 0 ? (
          forms.map((form) => (
            <div
              key={form.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    {form._count?.submissions || 0} envios
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900">{form.title}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                  {form.description || "Formulário de contato direto."}
                </p>

                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                    Campos ({form.fields?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {form.fields?.map((f: any) => (
                      <span
                        key={f.id}
                        className="px-2 py-0.5 rounded-md bg-slate-50 text-[10px] text-slate-700 font-medium border border-slate-200"
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
            Nenhum formulário customizado criado. Clique em &quot;Novo Formulário&quot; para adicionar.
          </div>
        )}
      </div>

      {/* Modal Criar Formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-base text-slate-900 mb-4">Novo Formulário de Contato</h3>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Título do Formulário
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Solicite um Orçamento Rápido"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Preencha os campos abaixo e entraremos em contato."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs resize-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {creating ? "Criando..." : "Criar Formulário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
