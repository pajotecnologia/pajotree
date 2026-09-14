"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  Check,
  ArrowRight,
  MessageSquare,
  Link2,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Layers,
  HelpCircle,
  Phone,
  ExternalLink,
  ChevronDown,
  KanbanSquare,
  QrCode,
  Globe,
  Sliders,
  CheckCircle2,
  Star,
  Users,
  Smartphone,
  Eye,
  Lock,
} from "lucide-react";

interface PlanFeature {
  maxPages?: number;
  maxLinks?: number;
  maxUsers?: number;
  maxLeads?: number;
  maxForms?: number;
  maxWhatsappInstances?: number;
  maxMetaPixels?: number;
  customDomainAllowed?: boolean;
  crmAllowed?: boolean;
  whatsappInboxAllowed?: boolean;
  advancedAnalytics?: boolean;
  removeBranding?: boolean;
}

interface PlanItem {
  id: string;
  name: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly: number;
  trialDays: number;
  features?: PlanFeature | null;
}

interface LandingProps {
  org: {
    id: string;
    name: string;
    tradeName?: string | null;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    phone?: string | null;
    whiteLabelDomain?: string | null;
  };
  plans: PlanItem[];
  config: {
    headline: string;
    subtitle: string;
    badgeText: string;
    ctaText: string;
    ctaSecondaryText: string;
    whatsappContact: string;
    themeColor: string;
    showHero: boolean;
    showFeatures: boolean;
    showPricing: boolean;
    showTestimonials: boolean;
    showFaq: boolean;
  };
}

export default function WhiteLabelLandingClient({ org, plans, config }: LandingProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const brandName = org.tradeName || org.name || "Nossa Empresa";
  const registerUrl = `/register?ref=${org.id}`;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const whatsappClean = (config.whatsappContact || org.whatsapp || "").replace(/\D/g, "");
  const whatsappLink = whatsappClean
    ? `https://wa.me/55${whatsappClean.replace(/^55/, "")}?text=${encodeURIComponent(`Olá, gostaria de saber mais sobre os planos da ${brandName}!`)}`
    : null;

  const faqs = [
    {
      q: `Como funciona o período de teste com ${brandName}?`,
      a: "Você pode criar sua conta gratuitamente e testar todos os recursos da plataforma durante o período de trial sem compromisso e sem precisar cadastrar cartão de crédito.",
    },
    {
      q: "Posso conectar meu WhatsApp pessoal ou comercial?",
      a: "Sim! Nossa tecnologia é 100% compatível com WhatsApp padrão e WhatsApp Business através da conexão segura por QR Code.",
    },
    {
      q: "Posso usar meu próprio domínio personalizado?",
      a: "Com certeza! Você pode apontar seus domínios e subdomínios próprios para criar links totalmente profissionais com a sua marca.",
    },
    {
      q: "Como recebo os leads capturados nas minhas páginas?",
      a: "Todos os leads são salvos automaticamente no CRM integrado com notificações instantâneas no painel e no seu WhatsApp.",
    },
    {
      q: "Posso mudar de plano ou cancelar a qualquer momento?",
      a: "Sim, você tem total flexibilidade para fazer upgrade, downgrade ou cancelamento da assinatura diretamente pelo painel.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px]" />
        <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-[1600px] -right-40 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[160px]" />
      </div>

      {/* 1. Header & Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={`/wl/${org.whiteLabelDomain || org.id}`} className="flex items-center gap-3 group">
              {org.logoUrl ? (
                <div className="relative h-10 w-auto max-w-[180px] flex items-center">
                  <img
                    src={org.logoUrl}
                    alt={brandName}
                    className="max-h-10 max-w-[180px] object-contain group-hover:scale-105 transition"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
                    <Zap className="w-5 h-5 text-white fill-white" />
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-white">{brandName}</span>
                </div>
              )}
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
              <a href="#features" className="hover:text-white transition">Recursos</a>
              <a href="#pricing" className="hover:text-white transition">Planos & Preços</a>
              <a href="#testimonials" className="hover:text-white transition">Depoimentos</a>
              <a href="#faq" className="hover:text-white transition">Dúvidas</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Fazer Login
            </Link>
            <Link
              href={registerUrl}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition flex items-center gap-2 group"
            >
              <span>{config.ctaText || "Começar Agora"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      {config.showHero && (
        <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            {/* Hero Badge */}
            {config.badgeText && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm font-semibold text-indigo-300 shadow-xl backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{config.badgeText}</span>
              </div>
            )}

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
              {config.headline}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {config.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href={registerUrl}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition flex items-center justify-center gap-3 group"
              >
                <span>{config.ctaText || "Criar Minha Empresa Grátis"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-base transition flex items-center justify-center gap-3 backdrop-blur-md"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <span>{config.ctaSecondaryText || "Falar no WhatsApp"}</span>
                </a>
              )}
            </div>

            {/* Social Trust Metrics */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sem necessidade de cartão para testar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ativação Instantânea</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Suporte em Português</span>
              </div>
            </div>

            {/* Interactive Mockup / Product Hero Visual */}
            <div className="pt-12 relative max-w-5xl mx-auto">
              <div className="p-2 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
                <div className="rounded-2xl bg-slate-950 p-6 sm:p-8 border border-slate-800/80 text-left space-y-6">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                        <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-xs font-mono text-slate-500">painel.{org.whiteLabelDomain || "seunegocio.com"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        ● WhatsApp Conectado
                      </span>
                    </div>
                  </div>

                  {/* Mockup Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Leads Capturados</span>
                        <Users className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-2xl font-black text-white">1.842</p>
                      <span className="text-[10px] text-emerald-400 font-bold">+28.4% este mês</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Atendimentos WhatsApp</span>
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-white">654</p>
                      <span className="text-[10px] text-emerald-400 font-bold">Tempo médio: 1.2 min</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Taxa de Conversão</span>
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-2xl font-black text-white">18.6%</p>
                      <span className="text-[10px] text-indigo-400 font-bold">Páginas de Alta Conversão</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Features Grid */}
      {config.showFeatures && (
        <section id="features" className="py-24 relative z-10 border-t border-slate-800/80 bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Tecnologia Completa</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Tudo o que você precisa para crescer suas vendas
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Reunimos as melhores ferramentas de marketing, atendimento e vendas em uma única plataforma integrada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Link2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Páginas Bio Link & Landing Pages</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Crie páginas personalizadas com links, vídeos, produtos, mapas e botões animados com carregamento ultrarrápido.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 transition space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Central de Atendimento WhatsApp</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conecte seu WhatsApp via QR Code e atenda todos os seus clientes em tempo real direto da central integrada.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900 transition space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                  <KanbanSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">CRM & Gestão de Leads</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Organize seus contatos em funis visuais Kanban, adicione notas, marque tags e nunca mais perca uma oportunidade de venda.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900 transition space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Pixels de Rastreamento & Anúncios</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rastreie visualizações e cliques com Meta Pixel, Google Analytics e TikTok Ads para otimizar suas campanhas.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900 transition space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Domínio Próprio & SSL Grátis</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conecte seu domínio com certificado de segurança automático para transmitir máxima autoridade e confiança.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-pink-500/40 hover:bg-slate-900 transition space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-110 transition">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">QR Codes Personalizados</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gere QR Codes de alta qualidade para materiais impressos, cardápios, embalagens e estandes com download em alta resolução.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Reseller Custom Plans & Pricing Section */}
      {config.showPricing && (
        <section id="pricing" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Transparência Total</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Escolha o plano ideal para a sua empresa
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Preços simples e sem surpresas. Teste grátis e cancele a qualquer momento.
              </p>

              {/* Monthly / Yearly Switcher */}
              <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    billingCycle === "monthly"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    billingCycle === "yearly"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>Anual</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                    2 Meses Grátis
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className={`grid grid-cols-1 gap-8 max-w-6xl mx-auto ${
              plans.length === 1 ? "max-w-md" : plans.length === 2 ? "md:grid-cols-2 max-w-3xl" : "md:grid-cols-3"
            }`}>
              {plans.map((plan, idx) => {
                const isPopular = idx === 1 || plans.length === 1;
                const price = billingCycle === "monthly" ? plan.priceMonthly : (plan.priceYearly ? plan.priceYearly / 12 : plan.priceMonthly * 0.85);
                const feats = plan.features;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl p-8 transition-all flex flex-col justify-between ${
                      isPopular
                        ? "bg-slate-900/90 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105"
                        : "bg-slate-900/50 border border-slate-800/90 hover:border-slate-700"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                        Mais Popular
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                          {plan.description || "Perfeito para negócios que buscam alta conversão e presença profissional."}
                        </p>
                      </div>

                      {/* Pricing */}
                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-white">
                            {formatMoney(price)}
                          </span>
                          <span className="text-xs text-slate-400">/mês</span>
                        </div>
                        {billingCycle === "yearly" && (
                          <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                            Faturado anualmente ({formatMoney(plan.priceYearly || price * 12)})
                          </span>
                        )}
                      </div>

                      {/* Feature Checklist */}
                      <ul className="space-y-3 pt-4 border-t border-slate-800/80 text-xs">
                        <li className="flex items-center gap-2.5 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span><b>{feats?.maxPages ?? 1}</b> {feats?.maxPages === 1 ? "Página Personalizada" : "Páginas Personalizadas"}</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span><b>{feats?.maxLinks ?? 50}</b> Links & Botões Ilimitados</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span><b>{feats?.maxWhatsappInstances ?? 1}</b> {feats?.maxWhatsappInstances === 1 ? "Conexão WhatsApp Web" : "Conexões WhatsApp Web"}</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span><b>{feats?.maxLeads ?? "Ilimitados"}</b> Leads no CRM</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Central de Atendimento ao Vivo</span>
                        </li>
                        {feats?.customDomainAllowed && (
                          <li className="flex items-center gap-2.5 text-indigo-300 font-semibold">
                            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>Domínio Próprio Personalizado</span>
                          </li>
                        )}
                        {feats?.removeBranding && (
                          <li className="flex items-center gap-2.5 text-indigo-300 font-semibold">
                            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>Remoção de Marca</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="pt-8">
                      <Link
                        href={`/register?ref=${org.id}&planId=${plan.id}`}
                        className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                          isPopular
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                            : "bg-slate-800 hover:bg-slate-700 text-white"
                        }`}
                      >
                        <span>Começar {plan.trialDays > 0 ? `Trial ${plan.trialDays} Dias` : "Agora"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 5. Testimonials Section */}
      {config.showTestimonials && (
        <section id="testimonials" className="py-24 relative z-10 border-t border-slate-800/80 bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Depoimentos Reais</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Quem usa, recomenda e converte mais
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "O sistema de páginas com WhatsApp integrado dobrou nossos atendimentos já na primeira semana. Simplesmente indispensável."
                </p>
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-xs font-bold text-white">Renata Oliveira</p>
                  <p className="text-[10px] text-slate-400">CEO & Fundadora</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "O CRM com funil Kanban facilitou todo o acompanhamento dos nossos leads. Nunca mais perdemos um cliente por esquecimento."
                </p>
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-xs font-bold text-white">Lucas Fernandes</p>
                  <p className="text-[10px] text-slate-400">Diretor Comercial</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "Excelente custo-benefício. Usamos o domínio personalizado e os pixels do Facebook com rastreamento perfeito."
                </p>
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-xs font-bold text-white">Eduardo Ramos</p>
                  <p className="text-[10px] text-slate-400">Gestor de Tráfego</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. FAQ Section */}
      {config.showFaq && (
        <section id="faq" className="py-24 relative z-10 border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Tire suas Dúvidas</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-indigo-300 transition"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-indigo-400" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-950 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={brandName} className="max-h-7 max-w-[120px] object-contain" />
            ) : (
              <span className="font-extrabold text-sm text-white">{brandName}</span>
            )}
            <span>© {new Date().getFullYear()} {brandName}. Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition">Fazer Login</Link>
            <Link href={registerUrl} className="hover:text-white transition">Criar Conta</Link>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
