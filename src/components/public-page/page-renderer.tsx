"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MessageCircle, Camera, Globe, ExternalLink, ChevronDown, Sparkles, Share2, Check, HelpCircle, Video, Share } from "lucide-react";
import { PublicContactForm } from "./contact-form";

interface BlockData { id: string; type: string; title?: string | null; contentJson: string; position: number; }

interface PageProps {
  page: {
    id: string;
    slug: string;
    name: string;
    title?: string | null;
    description?: string | null;
    organization: {
      name: string;
      logoUrl?: string | null;
      whatsapp?: string | null;
      removeBranding?: boolean;
    };
    settings?: {
      backgroundType: string;
      backgroundValue: string;
      primaryColor: string;
      secondaryColor: string;
      textColor: string;
      buttonStyle: string;
      fontFamily: string;
      layout: string;
    } | null;
    links: Array<{ id: string; title: string; url: string; description?: string | null; icon?: string | null; featured?: boolean; shortLinks: Array<{ code: string }> }>;
    blocks: BlockData[];
  };
}

export function PublicPageRenderer({ page }: PageProps) {
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const settings = page.settings || {
    backgroundType: "gradient",
    backgroundValue: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    primaryColor: "#6366f1",
    secondaryColor: "#ec4899",
    textColor: "#ffffff",
    buttonStyle: "rounded-xl",
    fontFamily: "Inter",
    layout: "classic",
  };

  const getButtonStyleClass = () => {
    switch (settings.buttonStyle) {
      case "pill": return "rounded-full";
      case "square": return "rounded-none";
      case "rounded": return "rounded-md";
      case "glass": return "rounded-2xl backdrop-blur-md bg-white/10 border border-white/20";
      default: return "rounded-2xl";
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderSocialIcon = (iconName: string) => {
    const iconClass = "w-5 h-5";
    switch (iconName?.toLowerCase()) {
      case "instagram": return <Camera className={iconClass} />;
      case "whatsapp": return <MessageCircle className={iconClass} />;
      case "youtube":
      case "video": return <Video className={iconClass} />;
      case "facebook":
      case "linkedin":
      case "share": return <Share className={iconClass} />;
      default: return <Globe className={iconClass} />;
    }
  };

  const displayName = page?.name || page?.title || "Minha Empresa";
  const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : "P";
  const logoUrl = page?.organization?.logoUrl;

  const isImageBackground =
    settings.backgroundType === "image" ||
    Boolean(
      settings.backgroundValue &&
      (settings.backgroundValue.startsWith("data:image/") ||
       settings.backgroundValue.startsWith("http://") ||
       settings.backgroundValue.startsWith("https://") ||
       settings.backgroundValue.startsWith("url("))
    );

  const containerStyle: React.CSSProperties = {
    color: settings.textColor,
    fontFamily: settings.fontFamily,
    ...(isImageBackground
      ? {
          backgroundImage: settings.backgroundValue.startsWith("url(")
            ? settings.backgroundValue
            : `url("${settings.backgroundValue}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {
          background: settings.backgroundValue || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        }),
  };

  return (
    <div
      style={containerStyle}
      className="min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-6 transition-colors duration-300 relative overflow-x-hidden"
    >
      {settings.fontFamily && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(
            settings.fontFamily
          )}:wght@300;400;500;600;700;800&display=swap`}
        />
      )}

      {isImageBackground && (
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[0.5px] pointer-events-none" />
      )}

      <div className="relative z-10 w-full max-w-md flex justify-end mb-2">
        <button onClick={handleShare} aria-label="Compartilhar página" className="p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition shadow-sm flex items-center gap-1.5 text-xs font-medium">
          {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-300">Copiado</span></> : <><Share2 className="w-3.5 h-3.5" /><span>Compartilhar</span></>}
        </button>
      </div>

      <main className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative group">
            <div style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }} className="p-1 rounded-full shadow-xl transition-transform duration-300 group-hover:scale-105">
              {logoUrl ? <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-900 relative"><Image src={logoUrl} alt={displayName} fill className="object-cover" unoptimized={logoUrl.startsWith("data:")} /></div> : <div className="w-24 h-24 rounded-full bg-slate-900/90 flex items-center justify-center text-2xl font-bold text-white shadow-inner">{initialLetter}</div>}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-slate-900 shadow-md flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-white animate-pulse" /></div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5"><span>{displayName}</span></h1>
            {page?.description && <p className="text-sm text-slate-300/90 max-w-xs mx-auto leading-relaxed">{page.description}</p>}
          </div>
        </div>

        <div className="w-full space-y-3.5">
          {(page?.links || []).map((link) => {
            const shortCode = link.shortLinks?.[0]?.code;
            const redirectUrl = shortCode ? `/go/${shortCode}` : link.url;
            return <a key={link.id} href={redirectUrl} target="_blank" rel="noopener noreferrer" style={{ borderColor: link.featured ? settings.primaryColor : "rgba(255,255,255,0.12)" }} className={`w-full group relative flex items-center justify-between p-4 bg-slate-900/70 hover:bg-slate-850 border backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5 ${getButtonStyleClass()} ${link.featured ? "ring-2 ring-indigo-500/40" : ""}`}>
              {link.featured && <span style={{ backgroundColor: settings.primaryColor }} className="absolute -top-2.5 left-4 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full text-white shadow-sm flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Destaque</span>}
              <div className="flex items-center gap-3.5 text-left">
                {link.icon && <div style={{ color: settings.primaryColor }} className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition">{renderSocialIcon(link.icon)}</div>}
                <div><span className="font-semibold text-sm text-white group-hover:text-indigo-300 transition block">{link.title}</span>{link.description && <span className="text-xs text-slate-400 block mt-0.5">{link.description}</span>}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition group-hover:translate-x-0.5" />
            </a>;
          })}
        </div>

        {page.blocks && page.blocks.length > 0 && <div className="w-full space-y-4">{page.blocks.map((block) => {
          let config: any = {};
          try { config = JSON.parse(block.contentJson); } catch { /* invalid block config */ }
          if (block.type === "FORM") return <div key={block.id} className="w-full"><PublicContactForm pageSlug={page.slug} buttonColor={settings.primaryColor} textColor="#ffffff" title={block.title || config.title || "Fale Conosco"} /></div>;
          if (block.type === "FAQ" && config.items) return <div key={block.id} className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md text-left space-y-3"><div className="flex items-center gap-2 mb-2 font-bold text-white text-sm"><HelpCircle className="w-4 h-4 text-indigo-400" /><span>{block.title || "Perguntas Frequentes"}</span></div><div className="space-y-2">{config.items.map((item: any, fIdx: number) => <div key={fIdx} className="border-b border-white/5 pb-2 last:border-0"><button onClick={() => setOpenFaqIndex(openFaqIndex === fIdx ? null : fIdx)} className="w-full flex items-center justify-between text-xs font-semibold text-slate-200 hover:text-white py-1.5 text-left"><span>{item.question}</span><ChevronDown className={`w-3.5 h-3.5 transition-transform ${openFaqIndex === fIdx ? "rotate-180 text-indigo-400" : ""}`} /></button>{openFaqIndex === fIdx && <p className="text-xs text-slate-400 mt-1 pl-1 leading-relaxed">{item.answer}</p>}</div>)}</div></div>;
          if (block.type === "TEXT") return <div key={block.id} className="w-full p-4 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md text-left text-xs text-slate-300 leading-relaxed">{block.title && <h4 className="font-bold text-white mb-1">{block.title}</h4>}<p>{config.text}</p></div>;
          return null;
        })}</div>}

        {!page.blocks?.some((b) => b.type === "FORM") && <div className="w-full"><PublicContactForm pageSlug={page.slug} buttonColor={settings.primaryColor} textColor="#ffffff" /></div>}
      </main>

      {!page.organization.removeBranding && <footer className="mt-8 text-center text-xs text-slate-400/80 flex items-center gap-1"><span>Criado com</span><a href="/" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">Pajotree</a></footer>}
    </div>
  );
}
