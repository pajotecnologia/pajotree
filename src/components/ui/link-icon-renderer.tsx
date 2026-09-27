"use client";

import React from "react";
import {
  Globe,
  MessageCircle,
  Camera,
  Video,
  Share2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  DollarSign,
  Star,
  Heart,
  Flame,
  Zap,
  Award,
  HelpCircle,
  Music,
  Download,
  Link2,
  Newspaper,
  Building2,
  Home,
  Activity,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  Headphones,
  Bot,
  Tag,
  Gift,
  Truck,
  Code,
  Cpu,
  Server,
  Layers,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  Store,
  Clock,
  Fingerprint,
  Key,
  ExternalLink,
  Send,
  Play,
  Mic,
  Radio,
  FileSpreadsheet,
  Banknote,
  Wallet,
  Percent,
  Crown,
  Lock,
  LifeBuoy,
  Info,
  Calendar,
  Package,
  CheckCircle2,
  Monitor,
  Laptop,
} from "lucide-react";

export interface LinkIconRendererProps {
  icon?: string | null;
  className?: string;
  defaultColor?: string;
  size?: number | string;
}

// Brand SVG Icons
export function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function YoutubeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedinIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function TwitterIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768m2.464-2.464L20 4" />
    </svg>
  );
}

export function LinkIconRenderer({
  icon,
  className = "w-5 h-5",
  defaultColor,
  size,
}: LinkIconRendererProps) {
  if (!icon || icon === "default") {
    return <Globe className={className} style={defaultColor ? { color: defaultColor } : undefined} />;
  }

  // 1. Check if icon is an image URL or base64 Data URL or preset SVG data
  const isImage =
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("data:image/") ||
    icon.startsWith("/uploads/") ||
    icon.startsWith("/");

  if (isImage) {
    return (
      <img
        src={icon}
        alt="Ícone do link"
        className={`object-contain rounded-lg shrink-0 ${className}`}
        style={{
          width: typeof size === "number" ? `${size}px` : size,
          height: typeof size === "number" ? `${size}px` : size,
        }}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
        }}
      />
    );
  }

  // 2. Named Icons
  const normalized = icon.toLowerCase().trim();

  switch (normalized) {
    // Redes Sociais & Mensagens
    case "whatsapp":
      return <MessageCircle className={className} />;
    case "instagram":
      return <InstagramIcon className={className} />;
    case "facebook":
      return <FacebookIcon className={className} />;
    case "youtube":
    case "video":
      return <YoutubeIcon className={className} />;
    case "linkedin":
      return <LinkedinIcon className={className} />;
    case "twitter":
    case "x":
      return <TwitterIcon className={className} />;
    case "telegram":
      return <Send className={className} />;
    case "discord":
    case "game":
      return <Radio className={className} />;
    case "tiktok":
      return <Music className={className} />;
    case "spotify":
    case "podcast":
      return <Headphones className={className} />;

    // Sistemas, Softwares & Tech
    case "ponto":
    case "ponto-eletronico":
    case "clock":
      return <Clock className={className} />;
    case "biometria":
    case "fingerprint":
      return <Fingerprint className={className} />;
    case "software":
    case "sistema":
    case "app":
    case "monitor":
      return <Monitor className={className} />;
    case "laptop":
      return <Laptop className={className} />;
    case "code":
    case "dev":
      return <Code className={className} />;
    case "server":
      return <Server className={className} />;
    case "cpu":
      return <Cpu className={className} />;

    // Imobiliária, Locação & Moradia
    case "imob":
    case "imobiliaria":
    case "casa":
    case "home":
      return <Home className={className} />;
    case "predio":
    case "edificio":
    case "building":
      return <Building2 className={className} />;
    case "chave":
    case "key":
    case "locacao":
      return <Key className={className} />;

    // Saúde, Hospital & Clínicas
    case "hospital":
    case "sgh":
    case "clinica":
    case "activity":
      return <Activity className={className} />;
    case "saude":
    case "heart":
    case "heartpulse":
      return <HeartPulse className={className} />;
    case "medico":
    case "consulta":
    case "stethoscope":
      return <Stethoscope className={className} />;

    // E-commerce, Compras & Lojas
    case "loja":
    case "store":
      return <Store className={className} />;
    case "shopping":
    case "sacola":
    case "shopping-bag":
      return <ShoppingBag className={className} />;
    case "carrinho":
    case "cart":
    case "shopping-cart":
      return <ShoppingCart className={className} />;
    case "catalogo":
    case "produtos":
    case "package":
      return <Package className={className} />;
    case "layers":
      return <Layers className={className} />;

    // Contato, Agendamento & Atendimento
    case "telefone":
    case "phone":
    case "ligar":
      return <Phone className={className} />;
    case "email":
    case "mail":
      return <Mail className={className} />;
    case "calendario":
    case "agendar":
    case "calendar":
      return <Calendar className={className} />;
    case "mapa":
    case "localizacao":
    case "map-pin":
      return <MapPin className={className} />;
    case "suporte":
    case "atendimento":
    case "help":
    case "help-circle":
      return <HelpCircle className={className} />;
    case "lifebuoy":
      return <LifeBuoy className={className} />;
    case "bot":
    case "ia":
      return <Bot className={className} />;

    // Financeiro, Pix & Promoções
    case "pix":
    case "pagamento":
    case "cartao":
    case "credit-card":
      return <CreditCard className={className} />;
    case "dinheiro":
    case "dollar":
    case "dollar-sign":
      return <DollarSign className={className} />;
    case "banknote":
      return <Banknote className={className} />;
    case "carteira":
    case "wallet":
      return <Wallet className={className} />;
    case "promocao":
    case "tag":
      return <Tag className={className} />;
    case "desconto":
    case "cupom":
    case "percent":
      return <Percent className={className} />;
    case "presente":
    case "gift":
      return <Gift className={className} />;
    case "fogo":
    case "oferta":
    case "flame":
      return <Flame className={className} />;
    case "zap":
    case "raio":
      return <Zap className={className} />;
    case "star":
    case "estrela":
    case "destaque":
      return <Star className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    case "trofeu":
    case "award":
      return <Award className={className} />;
    case "crown":
      return <Crown className={className} />;

    // Documentos & Mídia
    case "pdf":
    case "documento":
    case "contrato":
    case "file-text":
      return <FileText className={className} />;
    case "planilha":
    case "excel":
    case "file-spreadsheet":
      return <FileSpreadsheet className={className} />;
    case "download":
    case "baixar":
      return <Download className={className} />;
    case "noticias":
    case "blog":
    case "newspaper":
      return <Newspaper className={className} />;
    case "foto":
    case "camera":
      return <Camera className={className} />;
    case "play":
      return <Play className={className} />;
    case "microfone":
    case "mic":
      return <Mic className={className} />;
    case "seguranca":
    case "shield":
    case "shield-check":
      return <ShieldCheck className={className} />;
    case "lock":
      return <Lock className={className} />;
    case "link":
    case "link2":
      return <Link2 className={className} />;
    case "site":
    case "globe":
    default:
      return <Globe className={className} />;
  }
}
