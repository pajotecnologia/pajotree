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
            Desbloqueie o WhatsApp & Central de Atendimento
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Conecte números da Evolution API, converse com clientes direto pelo navegador e unifique suas mensagens com o CRM. Disponível nos planos START, PRO e BUSINESS.
          </p>
        </div>
        <Link
          href="/app/billing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition"
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
    <div className="space-y-6 h-[calc(100vh-130px)] flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            WhatsApp & Central de Atendimento
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie conexões da Evolution API e converse com clientes em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setModalError(null);
              setQrCodeUrl(null);
              setShowConnectModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Conectar WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Main Inbox Container */}
      <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col md:flex-row min-h-0">
        {/* Left Column: Conversations List */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50">
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
            <span className="text-xs font-bold text-slate-800">Conversas Recentes</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600">
              {conversations.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length > 0 ? (
              conversations.map((conv: any) => {
                const isSelected = activeConversation?.id === conv.id;
                const lastMsg = conv.messages?.[0];

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition ${
                      isSelected ? "bg-indigo-50/80 border-l-3 border-indigo-600" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {conv.contact.name?.charAt(0).toUpperCase() || "W"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.contact.name || conv.contact.remoteJid.split("@")[0]}
                        </span>
                        {conv.unread > 0 && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-[9px] font-extrabold text-white flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {lastMsg?.content || "Nenhuma mensagem recente"}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma conversa recebida ainda. Conecte seu número escaneando o QR Code.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs border border-emerald-100">
                  {activeConversation.contact.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    {activeConversation.contact.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {activeConversation.contact.remoteJid}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 flex flex-col-reverse bg-slate-50/30">
              {activeConversation.messages && activeConversation.messages.length > 0 ? (
                activeConversation.messages.map((msg: any) => {
                  const isMe = msg.direction === "outgoing";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-sm rounded-2xl p-3.5 text-xs shadow-2xs ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-xs"
                            : "bg-white text-slate-800 rounded-bl-xs border border-slate-200/80"
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <span className={`text-[9px] block text-right mt-1 ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Inicie a conversa enviando uma mensagem abaixo.
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
                placeholder="Digite sua mensagem de resposta..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              />
              <button
                type="submit"
                disabled={sendingMessage || !chatInput.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition"
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
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-center">
            <h3 className="font-bold text-base text-slate-900 mb-2">Conectar Novo WhatsApp</h3>
            <p className="text-xs text-slate-500 mb-6">
              Escaneie o QR Code no seu aplicativo WhatsApp (Aparelhos Conectados).
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
                    Nome da Conexão
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Comercial Principal"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={connecting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando QR Code...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Gerar QR Code</span>
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
                <p className="text-xs text-emerald-600 font-medium animate-pulse">
                  Aguardando leitura do QR Code...
                </p>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
                >
                  Fechar
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
