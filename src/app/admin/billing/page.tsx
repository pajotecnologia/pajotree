"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Loader2,
  ReceiptText,
  TrendingUp,
  UsersRound,
  Building2,
  ShieldCheck,
  Zap,
  Key,
  Globe,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

type Subscription = {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  organization: { id: string; name: string; email: string };
  plan: { id: string; name: string; priceMonthly: number | string; priceYearly: number | string };
};

type Payment = {
  id: string;
  amount: number | string;
  status: string;
  provider: string;
  createdAt: string;
  organization: { id: string; name: string };
  subscription: { plan: { name: string } };
};

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState<"metrics" | "inter">("metrics");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState({
    activeSubscriptions: 0,
    totalSubscriptions: 0,
    paidPayments: 0,
    paidAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Banco Inter Integration State
  const [interConfig, setInterConfig] = useState<any>(null);
  const [interClientId, setInterClientId] = useState("");
  const [interClientSecret, setInterClientSecret] = useState("");
  const [interCertCrt, setInterCertCrt] = useState("");
  const [interCertKey, setInterCertKey] = useState("");
  const [interAmbiente, setInterAmbiente] = useState<"PRODUCAO" | "SANDBOX">("PRODUCAO");
  const [interWebhookUrl, setInterWebhookUrl] = useState("");
  const [testingInter, setTestingInter] = useState(false);
  const [registeringWebhook, setRegisteringWebhook] = useState(false);
  const [interFeedback, setInterFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadData() {
    try {
      const [resBilling, resInter] = await Promise.all([
        fetch("/api/admin/billing", { cache: "no-store" }),
        fetch("/api/admin/banco-inter", { cache: "no-store" }),
      ]);

      if (resBilling.ok) {
        const json = await resBilling.json();
        setSubscriptions(json.subscriptions || []);
        setPayments(json.payments || []);
        setSummary(json.summary || { activeSubscriptions: 0, totalSubscriptions: 0, paidPayments: 0, paidAmount: 0 });
      }

      if (resInter.ok) {
        const interJson = await resInter.json();
        setInterConfig(interJson);
        if (interJson.ambiente) setInterAmbiente(interJson.ambiente);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar faturamento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      setInterWebhookUrl(`${window.location.origin}/api/webhooks/banco-inter`);
    }
  }, []);

  async function handleTestInterConnection() {
    setTestingInter(true);
    setInterFeedback(null);
    try {
      const res = await fetch("/api/admin/banco-inter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_connection",
          clientId: interClientId || undefined,
          clientSecret: interClientSecret || undefined,
          certCrt: interCertCrt || undefined,
          certKey: interCertKey || undefined,
          ambiente: interAmbiente,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na conexão mTLS.");
      setInterFeedback({ type: "success", text: data.message });
      await loadData();
    } catch (err: any) {
      setInterFeedback({ type: "error", text: err.message || "Erro de conexão mTLS." });
    } finally {
      setTestingInter(false);
    }
  }

  async function handleRegisterWebhook() {
    setRegisteringWebhook(true);
    setInterFeedback(null);
    try {
      const res = await fetch("/api/admin/banco-inter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_webhook",
          webhookUrl: interWebhookUrl,
          clientId: interClientId || undefined,
          clientSecret: interClientSecret || undefined,
          certCrt: interCertCrt || undefined,
          certKey: interCertKey || undefined,
          ambiente: interAmbiente,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao registrar webhook.");
      setInterFeedback({ type: "success", text: data.message || "Webhook registrado com sucesso no Banco Inter!" });
    } catch (err: any) {
      setInterFeedback({ type: "error", text: err.message || "Erro ao registrar webhook." });
    } finally {
      setRegisteringWebhook(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-700">SaaS / Financeiro</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Assinaturas & Faturamento
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe pagamentos, assinaturas e configure a integração bancária do SaaS.
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-2xs">
          <button
            onClick={() => setActiveTab("metrics")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "metrics"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Métricas & Assinaturas
          </button>
          <button
            onClick={() => setActiveTab("inter")}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === "inter"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Banco Inter (Bolepix)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">
          {error}
        </div>
      )}

      {activeTab === "metrics" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Metric icon={UsersRound} label="Assinaturas ativas" value={summary.activeSubscriptions} />
            <Metric icon={CreditCard} label="Assinaturas registradas" value={summary.totalSubscriptions} />
            <Metric icon={ReceiptText} label="Pagamentos pagos" value={summary.paidPayments} />
            <Metric
              icon={TrendingUp}
              label="Faturamento Total"
              value={`R$ ${Number(summary.paidAmount).toFixed(2).replace(".", ",")}`}
            />
          </div>

          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Assinaturas</h2>
              <p className="text-xs text-slate-500 mt-1">Últimas 100 assinaturas registradas.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-4">Empresa</th>
                    <th className="p-4">Plano</th>
                    <th className="p-4">Ciclo</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.length ? (
                    subscriptions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="p-4">
                          <strong className="text-slate-900 block">{item.organization.name}</strong>
                          <span className="text-[10px] text-slate-500">{item.organization.email}</span>
                        </td>
                        <td className="p-4 font-bold text-amber-700">{item.plan.name}</td>
                        <td className="p-4 capitalize">{item.billingCycle === "yearly" ? "Anual" : "Mensal"}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(item.currentPeriodStart).toLocaleDateString("pt-BR")} —{" "}
                          {new Date(item.currentPeriodEnd).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400">
                        Nenhuma assinatura registrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Pagamentos & Bolepix</h2>
              <p className="text-xs text-slate-500 mt-1">Últimos pagamentos e cobranças geradas.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-4">Empresa</th>
                    <th className="p-4">Plano / Ref</th>
                    <th className="p-4">Provedor</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length ? (
                    payments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="p-4 font-bold text-slate-900">{item.organization.name}</td>
                        <td className="p-4">{item.subscription?.plan?.name || "Upgrade / Recarga"}</td>
                        <td className="p-4 uppercase text-[10px] font-bold text-slate-600">{item.provider}</td>
                        <td className="p-4 font-bold">R$ {Number(item.amount).toFixed(2).replace(".", ",")}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              item.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "PENDING"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">
                        Nenhum pagamento registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === "inter" && (
        <div className="space-y-6">
          {interFeedback && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
                interFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {interFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{interFeedback.text}</span>
            </div>
          )}

          {/* Status Card */}
          <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black shadow-md shadow-amber-200">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Banco Inter API Cobrança v3 (Bolepix)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Emissão de boletos bancários com QR Code Pix integrado e liquidação instantânea por webhook.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  interConfig?.configured
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    interConfig?.configured ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {interConfig?.configured ? "Integração Configurada" : "Aguardando Certificados"}
              </span>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">Credenciais OAuth 2.0</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ambiente da API
                </label>
                <select
                  value={interAmbiente}
                  onChange={(e) => setInterAmbiente(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 shadow-2xs"
                >
                  <option value="PRODUCAO">Produção (cdpj.partners.bancointer.com.br)</option>
                  <option value="SANDBOX">Sandbox UAT (cdpj-sandbox.partners.uatinter.co)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  placeholder={interConfig?.clientIdMasked || "Ex: 279589d8-9df8-43d9-..."}
                  value={interClientId}
                  onChange={(e) => setInterClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Secret
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={interClientSecret}
                  onChange={(e) => setInterClientSecret(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Certificado Público (.crt)
                </label>
                <textarea
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  value={interCertCrt}
                  onChange={(e) => setInterCertCrt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 font-mono shadow-2xs resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chave Privada (.key)
                </label>
                <textarea
                  rows={4}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                  value={interCertKey}
                  onChange={(e) => setInterCertKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 font-mono shadow-2xs resize-y"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleTestInterConnection}
                  disabled={testingInter}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2"
                >
                  {testingInter ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>Testar Conexão mTLS</span>
                </button>
              </div>
            </section>

            {/* Webhook and Instructions */}
            <div className="space-y-6">
              <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Webhook de Baixa Automática em Tempo Real
                  </h3>
                </div>

                <p className="text-xs text-slate-500">
                  Quando o cliente paga o Boleto ou o Pix Copia e Cola, o Banco Inter notifica
                  este endpoint instantaneamente para ativação da assinatura.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL do Endpoint Webhook
                  </label>
                  <input
                    type="url"
                    value={interWebhookUrl}
                    onChange={(e) => setInterWebhookUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono shadow-2xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleRegisterWebhook}
                    disabled={registeringWebhook || !interWebhookUrl}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2"
                  >
                    {registeringWebhook ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCheck2 className="w-4 h-4" />
                    )}
                    <span>Registrar Webhook no Inter</span>
                  </button>
                </div>
              </section>

              <section className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Manual de Integração & Suporte</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>
                    O valor mínimo exigido pela FEBRABAN e Banco Inter é de{" "}
                    <strong className="text-slate-900">R$ 2,50</strong>.
                  </li>
                  <li>
                    O identificador (<code className="font-mono text-[11px]">seuNumero</code>)
                    é truncado para no máximo 15 caracteres alfanuméricos.
                  </li>
                  <li>
                    O download de PDF oficial está disponível em tempo real na rota{" "}
                    <code className="font-mono text-[11px]">/api/banco-inter/pdf</code>.
                  </li>
                  <li>
                    O token OAuth 2.0 Bearer possui renovação e cache automático em memória.
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <Icon className="w-4 h-4 text-amber-600 mb-3" />
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
        {label}
      </span>
      <strong className="text-xl text-slate-900 mt-1 block">{value}</strong>
    </div>
  );
}
