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
  ShieldCheck,
  Smartphone,
  ChevronDown,
  Layers,
  Globe,
  Share2,
  Check,
  MousePointerClick,
  TrendingUp,
  Cpu,
  Lock,
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
      description: "Ideal para autônomos e pequenos negócios que atendem no WhatsApp.",
      price: billingCycle === "monthly" ? "R$ 39,90" : "R$ 33,25",
      period: billingCycle === "monthly" ? "/mês" : "/mês (anual)",
      features: [
        "3 Páginas Personalizadas",
        "Até 25 Links com Tracking",
        "1 Conexão WhatsApp (Evolution API)",
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
      description: "A máquina completa de conversão com WhatsApp, CRM e Analytics.",
      price: billingCycle === "monthly" ? "R$ 89,90" : "R$ 74,90",
      period: billingCycle === "monthly" ? "/mês" : "/mês (anual)",
      features: [
        "10 Páginas Personalizadas",
        "Até 100 Links com Tracking",
        "3 Conexões WhatsApp Simultâneas",
        "Central de Atendimento Multiatendente",
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
        "10 Conexões WhatsApp",
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
  ];

  const faqs = [
    {
      q: "O Pajotree é apenas mais um criador de links na bio?",
      a: "Não. O Pajotree é uma plataforma completa de vendas. Além da página de links ultra-rápida, você tem CRM integrado, conexão direta com WhatsApp (Evolution API), rastreamento avançado com Meta Pixel por link e captura automática de leads.",
    },
    {
      q: "Como funciona a conexão com o WhatsApp?",
      a: "Você conecta seu número de WhatsApp escaneando o QR Code da Evolution API direto no painel. Mensagens, novos leads e contatos caem automaticamente na sua Central de Atendimento e no seu funil de CRM.",
    },
    {
      q: "Posso usar meu próprio domínio (ex: bio.minhaempresa.com.br)?",
      a: "Sim! Nos planos START, PRO e BUSINESS você pode apontar seu domínio próprio e nós geramos o certificado SSL automaticamente.",
    },
    {
      q: "Como funciona o Meta Pixel por link?",
      a: "Você pode atribuir um Pixel diferente para cada botão/link ou disparar eventos específicos (Lead, Purchase, Contact) antes do redirecionamento, otimizando suas campanhas de tráfego pago.",
    },
    {
      q: "O sistema roda em servidor próprio ou Coolify?",
      a: "O Pajotree foi arquitetado para rodar com máxima eficiência em containers Docker, PostgreSQL e Coolify, garantindo soberania total dos seus dados e performance inigualável.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Pajo<span className="text-indigo-600">tree</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#recursos" className="hover:text-indigo-600 transition">Recursos</a>
            <a href="#whatsapp-crm" className="hover:text-indigo-600 transition">WhatsApp & CRM</a>
            <a href="#planos" className="hover:text-indigo-600 transition">Planos</a>
            <a href="#faq" className="hover:text-indigo-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/80 rounded-xl transition"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative z-10 pt-20 pb-24 md:pt-28 md:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Sua Empresa em um Único Link Inteligente
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Transforme seu link da bio em uma{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              máquina de vendas.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Crie uma página profissional, reúna seus canais, capture clientes, conecte seu WhatsApp e transforme cada clique em oportunidade de negócio no CRM.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-600/20 active:scale-98 transition flex items-center justify-center gap-2.5"
            >
              <span>Começar Grátis Agora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#whatsapp-crm"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-base transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Ver Demonstração</span>
            </a>
          </div>

          {/* Social Proof Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sem cartão de crédito inicial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Conexão WhatsApp Evolution API</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Multi-Pixel & Tracking Server-side</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEMA vs SOLUÇÃO */}
      <section className="relative z-10 py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* O Problema */}
            <div className="p-8 rounded-3xl bg-rose-50/60 border border-rose-200">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold uppercase mb-4">
                O Modo Antigo
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Links comuns desperdiçam até 80% dos seus potenciais clientes
              </h3>
              <ul className="space-y-3.5 text-slate-600 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                  <span>Links espalhados e sem rastreamento de origem (UTMs perdidas).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                  <span>Visitantes entram em contato no WhatsApp e ninguém registra no CRM.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                  <span>Falta de pixel dedicado por anúncio e perda de eventos de conversão.</span>
                </li>
              </ul>
            </div>

            {/* A Solução Pajotree */}
            <div className="p-8 rounded-3xl bg-indigo-50/60 border border-indigo-200 shadow-sm relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold uppercase mb-4">
                A Solução Pajotree
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Um ecossistema inteligente de aquisição, atendimento e conversão
              </h3>
              <ul className="space-y-3.5 text-slate-700 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Tracking Automático:</strong> Redirecionamento `/go/` rápido com captura de UTMs e disparo para Meta CAPI.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Funil CRM Integrado:</strong> Cada formulário preenchido ou clique vira oportunidade no Kanban.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>WhatsApp Centralizado:</strong> Atenda clientes com histórico unificado e múltiplos atendentes.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RECURSOS / FUNCIONALIDADES */}
      <section id="recursos" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
              Recursos de Alta Performance
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tudo o que sua empresa precisa para escalar conversões
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-5 group-hover:scale-110 transition">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Editor Visual & Live Preview</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Personalize cores, temas, fontes e blocos com preview em tempo real para Desktop, Tablet e Mobile.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Conexão WhatsApp (Evolution)</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pareamento via QR Code, webhook instantâneo e Central de Atendimento organizada com tags e histórico.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-lg transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-5 group-hover:scale-110 transition">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">CRM Kanban de Vendas</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Acompanhe seus leads desde o primeiro contato até o fechamento da proposta comercial.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-pink-300 hover:shadow-lg transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 mb-5 group-hover:scale-110 transition">
                <MousePointerClick className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Meta Pixel por Link</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Configure pixels e eventos específicos para cada botão de produto, serviço ou WhatsApp.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-cyan-300 hover:shadow-lg transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 mb-5 group-hover:scale-110 transition">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Analytics em Tempo Real</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Métricas de visitantes únicos, cliques, taxas de conversão, UTMs, origens e dispositivos.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-lg transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Domínio Próprio & SSL</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Conecte o domínio ou subdomínio da sua marca com emissão automática de certificado HTTPS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TABELA DE PLANOS */}
      <section id="planos" className="relative z-10 py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
              Planos Transparentes
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Escolha o plano ideal para a sua empresa crescer
            </p>
            
            {/* Toggle Mensal / Anual */}
            <div className="mt-8 inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-2xl">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                  billingCycle === "monthly"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  billingCycle === "yearly"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Anual</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  -20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p, idx) => (
              <div
                key={idx}
                className={`p-7 rounded-3xl flex flex-col justify-between transition duration-300 relative ${
                  p.popular
                    ? "bg-white border-2 border-indigo-600 shadow-xl scale-105 z-10"
                    : "bg-slate-50 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
                    Mais Popular
                  </div>
                )}

                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-1">{p.name}</h4>
                  <p className="text-xs text-slate-500 mb-6 min-h-[32px]">{p.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-slate-900">{p.price}</span>
                    <span className="text-xs text-slate-500 ml-1">{p.period}</span>
                  </div>

                  <div className="space-y-3 mb-8 text-xs text-slate-700">
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={p.href}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center transition ${
                    p.popular
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                      : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section id="faq" className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
              Dúvidas Comuns
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Perguntas Frequentes
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-indigo-600 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      openFaq === idx ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA FINAL */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-slate-50 to-indigo-50/50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Transforme seu link da bio em uma máquina de vendas.
          </h2>
          <p className="text-base text-slate-600 mb-8 max-w-xl mx-auto">
            Junte-se a empresas que já transformaram acessos casuais em clientes fiéis.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-600/20 active:scale-95 transition"
          >
            <span>Criar Minha Página Grátis</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-10 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800">Pajotree SaaS</span>
            <span>&copy; {new Date().getFullYear()} Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-indigo-600 transition">Entrar</Link>
            <Link href="/register" className="hover:text-indigo-600 transition">Criar Conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
