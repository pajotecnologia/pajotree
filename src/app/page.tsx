"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  MessageSquare,
  Users,
  Smartphone,
  ChevronDown,
  Globe,
  Check,
  MousePointerClick,
} from "lucide-react";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: "FREE",
      description: "Para quem está começando a organizar sua presença online.",
      price: "R$ 0",
      period: "para sempre",
      features: [
        "1 Página Personalizada",
        "Até 5 Links com Tracking",
        "Captura de até 50 Leads",
        "1 Meta Pixel Básico",
        "QR Code Padrão",
        "Analytics Essencial",
      ],
      cta: "Começar Grátis",
      popular: false,
      href: "/register",
    },
    {
      name: "START",
      description: "Ideal para autônomos e pequenos negócios que querem profissionalizar sua presença digital.",
      price: billingCycle === "monthly" ? "R$ 39,90" : "R$ 33,25",
      period: billingCycle === "monthly" ? "/mês" : "/mês (anual)",
      features: [
        "3 Páginas Personalizadas",
        "Até 25 Links com Tracking",
        "Botões Diretos para WhatsApp",
        "CRM Básico de Oportunidades",
        "Captura de até 500 Leads",
        "Domínio Próprio Personalizado",
        "2 Meta Pixels & UTMs",
      ],
      cta: "Testar 14 Dias Grátis",
      popular: false,
      href: "/register",
    },
    {
      name: "PRO",
      description: "A máquina completa de conversão com CRM, Analytics e formulários de captura.",
      price: billingCycle === "monthly" ? "R$ 89,90" : "R$ 74,90",
      period: billingCycle === "monthly" ? "/mês" : "/mês (anual)",
      features: [
        "10 Páginas Personalizadas",
        "Até 100 Links com Tracking",
        "CRM Kanban Completo & Automações",
        "Captura de até 5.000 Leads",
        "Meta Pixel Dedicado por Link",
        "Google Analytics 4 & TikTok Pixel",
        "Sem Marca Pajotree",
      ],
      cta: "Experimentar o PRO",
      popular: true,
      href: "/register",
    },
    {
      name: "BUSINESS",
      description: "Para agências e empresas de alta escala com múltiplos canais.",
      price: billingCycle === "monthly" ? "R$ 199,90" : "R$ 166,50",
      period: billingCycle === "monthly" ? "/mês" : "/mês (anual)",
      features: [
        "50 Páginas e 500 Links",
        "Até 50 Usuários na Equipe",
        "Leads Ilimitados",
        "Meta Conversions API (CAPI)",
        "Suporte Prioritário & SLA",
        "Relatórios Customizados",
      ],
      cta: "Falar com Consultor",
      popular: false,
      href: "/register",
    },
    {
      name: "WHITE LABEL",
      description: "Para agências e parceiros que querem oferecer o Pajotree com sua própria marca.",
      price: billingCycle === "monthly" ? "R$ 399,90" : "R$ 333,25",
      period: billingCycle === "monthly" ? "/mês" : "/mês (anual)",
      features: [
        "100 Páginas Personalizadas",
        "Até 1.000 Links com Tracking",
        "Até 100 Usuários na Equipe",
        "Até 100.000 Leads",
        "Domínio Próprio Personalizado",
        "CRM, Automações e Analytics Avançado",
        "50 GB de Armazenamento",
        "Sem Marca Pajotree",
      ],
      cta: "Quero White Label",
      popular: false,
      href: "/register",
    },
  ];

  const faqs = [
    {
      q: "O Pajotree é apenas mais um criador de links na bio?",
      a: "Não. O Pajotree é uma plataforma completa de vendas. Além da página de links ultra-rápida, você tem CRM integrado, rastreamento avançado com Meta Pixel por link, links diretos para WhatsApp e captura automática de leads.",
    },
    {
      q: "Como funcionam os links diretos para o WhatsApp?",
      a: "Você pode adicionar botões de contato direto para o WhatsApp com mensagens personalizadas. Cada clique é rastreado automaticamente no painel de Analytics e no CRM de leads.",
    },
    {
      q: "Posso usar meu próprio domínio?",
      a: "Sim. Nos planos START, PRO, BUSINESS e WHITE LABEL você pode apontar seu domínio próprio e trabalhar com a identidade da sua marca.",
    },
    {
      q: "O que é o plano WHITE LABEL?",
      a: "É o plano para agências e parceiros que querem oferecer a plataforma aos próprios clientes com identidade visual e domínio personalizados, sem a marca Pajotree.",
    },
    {
      q: "Como funciona o Meta Pixel por link?",
      a: "Você pode atribuir pixels e eventos específicos aos seus links e acompanhar melhor a origem e a conversão das campanhas de tráfego pago.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      <header className="relative z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">Pajo<span className="text-indigo-600">tree</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#recursos" className="hover:text-indigo-600 transition">Recursos</a>
            <a href="#whatsapp-crm" className="hover:text-indigo-600 transition">WhatsApp & CRM</a>
            <a href="#planos" className="hover:text-indigo-600 transition">Planos</a>
            <a href="#faq" className="hover:text-indigo-600 transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/80 rounded-xl transition">Entrar</Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition">Começar Grátis</Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 pt-20 pb-24 md:pt-28 md:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-xs"><Sparkles className="w-3.5 h-3.5 text-indigo-600" />Sua Empresa em um Único Link Inteligente</div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">Transforme seu link da bio em uma <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">máquina de vendas.</span></h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">Crie uma página profissional, reúna seus canais, capture clientes, conecte seu WhatsApp e transforme cada clique em oportunidade de negócio no CRM.</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-600/20 active:scale-98 transition flex items-center justify-center gap-2.5">Começar Grátis Agora <ArrowRight className="w-5 h-5" /></Link>
            <a href="#whatsapp-crm" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-base transition flex items-center justify-center gap-2 shadow-xs">Ver Demonstração</a>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Sem cartão de crédito inicial</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Links Diretos para WhatsApp & CRM</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Multi-Pixel & Tracking Server-side</div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-rose-50/60 border border-rose-200"><div className="inline-flex px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold uppercase mb-4">O Modo Antigo</div><h3 className="text-2xl font-bold text-slate-900 mb-4">Links comuns desperdiçam oportunidades de venda</h3><ul className="space-y-3.5 text-slate-600 text-sm"><li>✕ Links espalhados e sem rastreamento de origem.</li><li>✕ Visitantes entram no WhatsApp sem organização no CRM.</li><li>✕ Falta de pixel dedicado e perda de eventos de conversão.</li></ul></div>
          <div className="p-8 rounded-3xl bg-indigo-50/60 border border-indigo-200 shadow-sm"><div className="inline-flex px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold uppercase mb-4">A Solução Pajotree</div><h3 className="text-2xl font-bold text-slate-900 mb-4">Um ecossistema inteligente de aquisição, atendimento e conversão</h3><ul className="space-y-3.5 text-slate-700 text-sm"><li>✓ <strong>Tracking Automático:</strong> captura de UTMs e eventos.</li><li>✓ <strong>Funil CRM Integrado:</strong> leads e oportunidades organizados no Kanban.</li><li>✓ <strong>Links Inteligentes:</strong> redirecionamento direto com parâmetros e pixels.</li></ul></div>
        </div>
      </section>

      <section id="recursos" className="relative z-10 py-24"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center max-w-3xl mx-auto mb-16"><h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Recursos de Alta Performance</h2><p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Tudo o que sua empresa precisa para escalar conversões</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><Feature icon={<Smartphone />} title="Editor Visual & Live Preview" text="Personalize cores, temas, fontes e blocos com preview em tempo real." /><Feature icon={<MessageSquare />} title="Links para WhatsApp" text="Botões direcionados com mensagens personalizadas e rastreamento." /><Feature icon={<Users />} title="CRM Kanban de Vendas" text="Acompanhe leads desde o primeiro contato até o fechamento." /><Feature icon={<MousePointerClick />} title="Meta Pixel por Link" text="Configure pixels e eventos específicos para cada botão." /><Feature icon={<BarChart3 />} title="Analytics em Tempo Real" text="Métricas de visitantes, cliques, conversões e UTMs." /><Feature icon={<Globe />} title="Domínio Próprio & SSL" text="Conecte o domínio da sua marca com HTTPS." /></div></div></section>

      <section id="whatsapp-crm" className="relative z-10 py-24 bg-slate-900 text-white"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center"><div><div className="inline-flex px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase mb-5">WhatsApp Inteligente + CRM</div><h2 className="text-4xl md:text-5xl font-black tracking-tight">Seus links de WhatsApp conectados ao seu funil de vendas.</h2><p className="mt-6 text-slate-300 text-lg leading-relaxed">Direcione visitantes para conversas no WhatsApp com mensagens personalizadas, rastreie cada clique em tempo real e organize automaticamente seus leads no pipeline visual.</p></div><div className="grid sm:grid-cols-2 gap-4"><FeatureDark title="Links Diretos" text="Botões wa.me com mensagens pré-formatadas." /><FeatureDark title="Kanban" text="Pipeline visual de leads e oportunidades." /><FeatureDark title="Conversão" text="Rastreamento de cliques e pixels de anúncios." /><FeatureDark title="Controle" text="Gestão e histórico de contatos." /></div></div></section>

      <section id="planos" className="relative z-10 py-24 bg-white border-t border-slate-200"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center max-w-3xl mx-auto mb-12"><h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Planos Transparentes</h2><p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Escolha o plano ideal para a sua empresa crescer</p><div className="mt-8 inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-2xl"><button onClick={() => setBillingCycle("monthly")} className={`px-5 py-2 rounded-xl text-xs font-bold transition ${billingCycle === "monthly" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}>Mensal</button><button onClick={() => setBillingCycle("yearly")} className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${billingCycle === "yearly" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}>Anual <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">-20%</span></button></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">{plans.map((p) => <div key={p.name} className={`p-6 rounded-3xl flex flex-col relative ${p.popular ? "bg-white border-2 border-indigo-600 shadow-xl scale-[1.02] z-10" : "bg-slate-50 border border-slate-200"}`}>{p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-extrabold uppercase text-white shadow-md">Mais Popular</div>}<div><h4 className="text-xl font-bold text-slate-900 mb-1">{p.name}</h4><p className="text-xs text-slate-500 mb-5 min-h-[32px]">{p.description}</p><div className="mb-5"><span className="text-3xl font-extrabold text-slate-900">{p.price}</span><span className="text-xs text-slate-500 ml-1">{p.period}</span></div><div className="space-y-3 mb-8 text-xs text-slate-700">{p.features.map((feat) => <div key={feat} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>{feat}</span></div>)}</div></div><Link href={p.href} className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center transition ${p.popular ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"}`}>{p.cta}</Link></div>)}</div></div></section>

      <section id="faq" className="relative z-10 py-24"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12"><h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Dúvidas Comuns</h2><p className="text-3xl font-extrabold text-slate-900 tracking-tight">Perguntas Frequentes</p></div><div className="space-y-4">{faqs.map((faq, idx) => <div key={faq.q} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs"><button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-indigo-600 transition"><span>{faq.q}</span><ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === idx ? "rotate-180 text-indigo-600" : ""}`} /></button>{openFaq === idx && <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">{faq.a}</div>}</div>)}</div></div></section>

      <section className="relative z-10 py-20 bg-gradient-to-b from-slate-50 to-indigo-50/50 border-t border-slate-200"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">Transforme seu link da bio em uma máquina de vendas.</h2><p className="text-base text-slate-600 mb-8 max-w-xl mx-auto">Comece grátis e evolua para o plano ideal conforme sua operação cresce.</p><Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-600/20 active:scale-95 transition">Criar Minha Página Grátis <ArrowRight className="w-5 h-5" /></Link></div></section>

      <footer className="relative z-10 border-t border-slate-200 py-10 bg-white text-xs text-slate-500"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-600" /><span className="font-bold text-slate-800">Pajotree SaaS</span><span>&copy; {new Date().getFullYear()} Todos os direitos reservados.</span></div><div className="flex items-center gap-6"><Link href="/login" className="hover:text-indigo-600 transition">Entrar</Link><Link href="/register" className="hover:text-indigo-600 transition">Criar Conta</Link></div></div></footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition duration-200 group"><div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-5 group-hover:scale-110 transition">{icon}</div><h4 className="text-lg font-bold text-slate-900 mb-2">{title}</h4><p className="text-sm text-slate-600 leading-relaxed">{text}</p></div>;
}

function FeatureDark({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-slate-400">{text}</p></div>;
}
