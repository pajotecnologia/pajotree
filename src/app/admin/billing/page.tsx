"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2, ReceiptText, TrendingUp, UsersRound } from "lucide-react";

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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState({ activeSubscriptions: 0, totalSubscriptions: 0, paidPayments: 0, paidAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/billing", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Não foi possível carregar o faturamento.");
        setSubscriptions(json.subscriptions || []);
        setPayments(json.payments || []);
        setSummary(json.summary || { activeSubscriptions: 0, totalSubscriptions: 0, paidPayments: 0, paidAmount: 0 });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar faturamento."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-80 flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-600 animate-spin" /></div>;
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">{error}</div>;

  return (
    <div className="space-y-6">
      <div><p className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-700">SaaS / Financeiro</p><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Assinaturas & Faturamento</h1><p className="text-sm text-slate-500 mt-1">Acompanhe assinaturas, ciclos e pagamentos de todas as empresas.</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric icon={UsersRound} label="Assinaturas ativas" value={summary.activeSubscriptions} />
        <Metric icon={CreditCard} label="Assinaturas registradas" value={summary.totalSubscriptions} />
        <Metric icon={ReceiptText} label="Pagamentos pagos" value={summary.paidPayments} />
        <Metric icon={TrendingUp} label="Pagamentos listados" value={`R$ ${Number(summary.paidAmount).toFixed(2).replace(".", ",")}`} />
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100"><h2 className="font-bold text-slate-900">Assinaturas</h2><p className="text-xs text-slate-500 mt-1">Últimas 100 assinaturas registradas.</p></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-4">Empresa</th><th className="p-4">Plano</th><th className="p-4">Ciclo</th><th className="p-4">Status</th><th className="p-4">Período</th></tr></thead><tbody className="divide-y divide-slate-100">{subscriptions.length ? subscriptions.map((item) => <tr key={item.id} className="hover:bg-slate-50/60"><td className="p-4"><strong className="text-slate-900 block">{item.organization.name}</strong><span className="text-[10px] text-slate-500">{item.organization.email}</span></td><td className="p-4 font-bold text-amber-700">{item.plan.name}</td><td className="p-4 capitalize">{item.billingCycle === "yearly" ? "Anual" : "Mensal"}</td><td className="p-4"><span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">{item.status}</span></td><td className="p-4 text-slate-500">{new Date(item.currentPeriodStart).toLocaleDateString("pt-BR")} — {new Date(item.currentPeriodEnd).toLocaleDateString("pt-BR")}</td></tr>) : <tr><td colSpan={5} className="p-10 text-center text-slate-400">Nenhuma assinatura registrada.</td></tr>}</tbody></table></div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100"><h2 className="font-bold text-slate-900">Pagamentos</h2><p className="text-xs text-slate-500 mt-1">Últimos 100 pagamentos registrados.</p></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-4">Empresa</th><th className="p-4">Plano</th><th className="p-4">Valor</th><th className="p-4">Status</th><th className="p-4">Data</th></tr></thead><tbody className="divide-y divide-slate-100">{payments.length ? payments.map((item) => <tr key={item.id} className="hover:bg-slate-50/60"><td className="p-4 font-bold text-slate-900">{item.organization.name}</td><td className="p-4">{item.subscription?.plan?.name || "—"}</td><td className="p-4 font-bold">R$ {Number(item.amount).toFixed(2).replace(".", ",")}</td><td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{item.status}</span></td><td className="p-4 text-slate-500">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td></tr>) : <tr><td colSpan={5} className="p-10 text-center text-slate-400">Nenhum pagamento registrado.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string | number }) {
  return <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><Icon className="w-4 h-4 text-amber-600 mb-3" /><span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">{label}</span><strong className="text-xl text-slate-900 mt-1 block">{value}</strong></div>;
}
