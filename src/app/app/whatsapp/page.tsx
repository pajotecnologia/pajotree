"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Send,
  Lock,
  Sparkles,
  ArrowRight,
  Loader2,
  RefreshCw,
  Phone,
  User,
} from "lucide-react";

export default function WhatsAppPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [whatsappLocked, setWhatsappLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Chat Inbox State
  const [activeInstance, setActiveInstance] = useState<any>(null);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // New Connection Modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectionName, setConnectionName] = useState("");
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  async function loadData() {
    try {
      const res = await fetch("/api/whatsapp");
      const json = await res.json();
      if (!res.ok && json.whatsappLocked) {
        setWhatsappLocked(true);
      } else if (res.ok) {
        setInstances(json.instances || []);
        if (json.instances?.length > 0 && !activeInstance) {
          setActiveInstance(json.instances[0]);
          if (json.instances[0].conversations?.length > 0) {
            setActiveConversation(json.instances[0].conversations[0]);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar WhatsApp:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleStartConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setModalError(null);
    setQrCodeUrl(null);

    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_instance",
          name: connectionName || "Atendimento Principal",
          apiUrl: customApiUrl.trim() || undefined,
          apiKey: customApiKey.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erro ao gerar conexão");
      }

      setQrCodeUrl(json.qrCodeUrl);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "Falha ao iniciar conexão");
    } finally {
      setConnecting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeInstance || !activeConversation) return;

    setSendingMessage(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          instanceId: activeInstance.id,
          remoteJid: activeConversation.contact.remoteJid,
          text: chatInput,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        // Append local message to state
        setActiveConversation({
          ...activeConversation,
          messages: [json.message, ...(activeConversation.messages || [])],
        });
        setChatInput("");
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (whatsappLocked) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Desbloqueie o WhatsApp & Chat Inbox
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Conecte seu WhatsApp para receber mensagens dos leads diretamente no painel e responder em tempo real.
          </p>
        </div>
        <Link
          href="/app/billing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Fazer Upgrade Agora</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const conversations = activeInstance?.conversations || [];

  return (
    <div className="space-y-6 h-[calc(100vh-130px)] flex flex-col min-w-0 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              WhatsApp & Central de Mensagens
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Conexão com WhatsApp Web / Baileys via microserviço Evolution API para chat em tempo real.
          </p>
        </div>

        <button
          onClick={() => {
            setShowConnectModal(true);
            setQrCodeUrl(null);
            setModalError(null);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conexão WhatsApp</span>
        </button>
      </div>

      {/* Main Inbox Layout (2 columns) */}
      <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col md:flex-row min-h-0">
        {/* Left: Instances & Conversations */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
          <div className="p-3.5 border-b border-slate-200 bg-white">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Conexões Ativas ({instances.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {instances.length > 0 ? (
              instances.map((inst) => {
                const isSelected = activeInstance?.id === inst.id;
                const isConnected = inst.status === "CONNECTED";

                return (
                  <div
                    key={inst.id}
                    onClick={() => {
                      setActiveInstance(inst);
                      if (inst.conversations?.length > 0) {
                        setActiveConversation(inst.conversations[0]);
                      } else {
                        setActiveConversation(null);
                      }
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition border text-left ${
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-200 shadow-2xs"
                        : "bg-white border-slate-200/70 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                        {inst.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isConnected
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isConnected ? "Conectado" : "Aguardando"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1 truncate">
                      {inst.instanceName}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Nenhuma conexão WhatsApp configurada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
            {/* Chat Header */}
            <div className="p-3.5 px-6 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">
                    {activeConversation.contact?.name || activeConversation.contact?.remoteJid}
                  </h4>
                  <span className="text-[10px] text-emerald-600 block font-mono">
                    {activeConversation.contact?.remoteJid}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 flex flex-col-reverse">
              {activeConversation.messages && activeConversation.messages.length > 0 ? (
                activeConversation.messages.map((msg: any) => {
                  const isMe = msg.direction === "outgoing";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-br-xs"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Nenhuma mensagem trocada ainda nesta conversa.
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-slate-200 bg-white flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              />
              <button
                type="submit"
                disabled={sendingMessage || !chatInput.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition"
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
            <p>Selecione uma conversa ou conecte seu WhatsApp para começar a atender.</p>
          </div>
        )}
      </div>

      {/* Modal Conexão QR Code */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-center max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-slate-900 mb-1">Conectar Aparelho WhatsApp</h3>
            <p className="text-xs text-slate-500 mb-5">
              Conexão via WhatsApp Web / Baileys usando o microserviço <b>Evolution API</b>.
            </p>

            {modalError && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            {!qrCodeUrl ? (
              <form onSubmit={handleStartConnection} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nome da Conexão / Canal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: WhatsApp Comercial ou Atendimento"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Opções Avançadas de Servidor Evolution API */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>{showAdvanced ? "Ocultar Parâmetros de Servidor" : "⚙️ Configurar Servidor Evolution API Próprio (Opcional)"}</span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">URL do Servidor Evolution API</label>
                        <input
                          type="url"
                          placeholder="http://localhost:8080 ou https://evolution.seuservidor.com"
                          value={customApiUrl}
                          onChange={(e) => setCustomApiUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Global API Key do Evolution</label>
                        <input
                          type="password"
                          placeholder="Chave secreta configurada no seu Docker Evolution"
                          value={customApiKey}
                          onChange={(e) => setCustomApiKey(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
                  💡 <b>Como funciona:</b> Ao clicar em Gerar QR Code, a Evolution API cria uma sessão do WhatsApp Web. Abra seu WhatsApp no celular &gt; <b>Aparelhos Conectados</b> &gt; <b>Conectar um Aparelho</b> e aponte para o código.
                </div>

                <button
                  type="submit"
                  disabled={connecting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Iniciando Sessão Evolution...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Gerar QR Code de Conexão</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-xs">
                  <Image
                    src={qrCodeUrl}
                    alt="WhatsApp QR Code"
                    width={200}
                    height={200}
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-emerald-700 font-bold animate-pulse flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Aguardando leitura no WhatsApp...</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Abra o WhatsApp &gt; Configurações &gt; Aparelhos Conectados &gt; Conectar Aparelho.
                  </p>
                </div>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Concluído / Fechar
                </button>
              </div>
            )}

            {!qrCodeUrl && (
              <div className="mt-4">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
