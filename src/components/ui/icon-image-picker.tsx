"use client";

import React, { useState, useRef } from "react";
import {
  Globe,
  MessageCircle,
  Send,
  Music,
  Headphones,
  Clock,
  Fingerprint,
  Monitor,
  Laptop,
  Code,
  Server,
  Cpu,
  Home,
  Building2,
  Key,
  Activity,
  HeartPulse,
  Stethoscope,
  Store,
  ShoppingBag,
  ShoppingCart,
  Package,
  Layers,
  Phone,
  Mail,
  Calendar,
  MapPin,
  HelpCircle,
  Bot,
  CreditCard,
  DollarSign,
  Banknote,
  Wallet,
  Tag,
  Percent,
  Gift,
  Flame,
  Zap,
  Star,
  Sparkles,
  Award,
  Crown,
  FileText,
  FileSpreadsheet,
  Download,
  Newspaper,
  Camera,
  Play,
  ShieldCheck,
  Search,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Trash2,
  ExternalLink,
  Info,
  Ratio,
  Maximize2,
  FileCheck,
} from "lucide-react";
import {
  LinkIconRenderer,
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
  LinkedinIcon,
  TwitterIcon,
} from "./link-icon-renderer";

export interface IconImagePickerProps {
  value: string;
  onChange: (value: string) => void;
}

// 1. Icon Library categorized
interface IconOption {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

const ICON_OPTIONS: IconOption[] = [
  // Redes & Mensagens
  { id: "whatsapp", label: "WhatsApp", category: "redes", icon: MessageCircle, tags: ["whatsapp", "zap", "mensagem", "conversa", "whats"] },
  { id: "instagram", label: "Instagram", category: "redes", icon: InstagramIcon, tags: ["instagram", "insta", "fotos", "reels", "stories"] },
  { id: "facebook", label: "Facebook", category: "redes", icon: FacebookIcon, tags: ["facebook", "face", "meta"] },
  { id: "youtube", label: "YouTube", category: "redes", icon: YoutubeIcon, tags: ["youtube", "video", "canal", "aulas"] },
  { id: "linkedin", label: "LinkedIn", category: "redes", icon: LinkedinIcon, tags: ["linkedin", "curriculo", "vagas", "b2b"] },
  { id: "twitter", label: "Twitter / X", category: "redes", icon: TwitterIcon, tags: ["twitter", "x", "noticias", "feed"] },
  { id: "telegram", label: "Telegram", category: "redes", icon: Send, tags: ["telegram", "grupo", "canal", "bot"] },
  { id: "tiktok", label: "TikTok", category: "redes", icon: Music, tags: ["tiktok", "danca", "video", "musica"] },
  { id: "spotify", label: "Spotify / Podcast", category: "redes", icon: Headphones, tags: ["spotify", "musica", "podcast", "audio"] },

  // Sistemas & Softwares
  { id: "ponto", label: "Ponto Eletrônico / Relógio", category: "sistemas", icon: Clock, tags: ["ponto", "relogio", "ponto eletronico", "ezpoint", "rh", "ponto web"] },
  { id: "biometria", label: "Biometria / Digital", category: "sistemas", icon: Fingerprint, tags: ["biometria", "digital", "seguranca", "facial", "acesso"] },
  { id: "sistema", label: "Sistema / Software Web", category: "sistemas", icon: Monitor, tags: ["sistema", "software", "painel", "dashboard", "erp", "saas"] },
  { id: "laptop", label: "Área do Cliente / Portal", category: "sistemas", icon: Laptop, tags: ["portal", "cliente", "login", "acesso", "web"] },
  { id: "server", label: "Servidor / Nuvem", category: "sistemas", icon: Server, tags: ["nuvem", "servidor", "cloud", "infra", "banco"] },
  { id: "code", label: "Desenvolvimento / API", category: "sistemas", icon: Code, tags: ["api", "codigo", "integracao", "dev", "tech"] },
  { id: "cpu", label: "Tecnologia / Hardware", category: "sistemas", icon: Cpu, tags: ["chip", "tech", "hardware", "processamento"] },

  // Imobiliária & Construção
  { id: "imob", label: "Imobiliária / Locação", category: "imoveis", icon: Home, tags: ["imob", "imobiliaria", "casa", "locacao", "aluguel", "apartamento"] },
  { id: "predio", label: "Edifício / Empreendimento", category: "imoveis", icon: Building2, tags: ["predio", "edificio", "construtora", "lote", "escritorio"] },
  { id: "chave", label: "Entrega de Chaves / Gestão", category: "imoveis", icon: Key, tags: ["chave", "locacao", "imovel", "fechamento"] },

  // Saúde, Hospital & Clínicas
  { id: "hospital", label: "Hospital / SGH", category: "saude", icon: Activity, tags: ["hospital", "sgh", "clinica", "medico", "prontuario", "paciente"] },
  { id: "saude", label: "Saúde & Bem-Estar", category: "saude", icon: HeartPulse, tags: ["saude", "coracao", "cardiologia", "exames", "vida"] },
  { id: "medico", label: "Consulta / Estetoscópio", category: "saude", icon: Stethoscope, tags: ["consulta", "medico", "doutor", "atendimento medico"] },

  // Negócios & E-commerce
  { id: "site", label: "Site Oficial", category: "negocios", icon: Globe, tags: ["site", "portal", "home", "institucional", "web", "pagina"] },
  { id: "loja", label: "Loja Virtual / E-commerce", category: "negocios", icon: Store, tags: ["loja", "shop", "varejo", "filial"] },
  { id: "shopping", label: "Catálogo de Produtos", category: "negocios", icon: ShoppingBag, tags: ["produtos", "catalogo", "compras", "sacola", "itens"] },
  { id: "carrinho", label: "Carrinho de Compras", category: "negocios", icon: ShoppingCart, tags: ["carrinho", "checkout", "pedidos", "comprar"] },
  { id: "catalogo", label: "Pacotes & Planos", category: "negocios", icon: Package, tags: ["pacotes", "planos", "combo", "assinatura"] },
  { id: "layers", label: "Módulos / Recursos", category: "negocios", icon: Layers, tags: ["modulos", "recursos", "solucoes", "camadas"] },

  // Contato & Atendimento
  { id: "telefone", label: "Telefone / Fale Conosco", category: "contato", icon: Phone, tags: ["telefone", "ligar", "0800", "chamada", "atendimento"] },
  { id: "email", label: "E-mail / Mensagem", category: "contato", icon: Mail, tags: ["email", "contato", "sac", "ouvidoria"] },
  { id: "calendario", label: "Agendamento / Reunião", category: "contato", icon: Calendar, tags: ["calendario", "agenda", "reuniao", "horario", "marcar"] },
  { id: "mapa", label: "Como Chegar / Mapa", category: "contato", icon: MapPin, tags: ["mapa", "endereco", "localizacao", "gps", "unidades"] },
  { id: "suporte", label: "Central de Suporte & FAQ", category: "contato", icon: HelpCircle, tags: ["suporte", "ajuda", "faq", "duvidas", "help desk"] },
  { id: "bot", label: "Assistente Virtual / IA", category: "contato", icon: Bot, tags: ["bot", "ia", "robo", "chat", "inteligencia artificial"] },

  // Pagamentos & Promoções
  { id: "pix", label: "Cartão / Pagamento", category: "financeiro", icon: CreditCard, tags: ["pix", "cartao", "pagamento", "credito", "fatura"] },
  { id: "dinheiro", label: "Preços / Financeiro", category: "financeiro", icon: DollarSign, tags: ["dinheiro", "valores", "tabela", "orcamento"] },
  { id: "banknote", label: "Boleto / Transferência", category: "financeiro", icon: Banknote, tags: ["boleto", "transferencia", "deposito"] },
  { id: "carteira", label: "Carteira Digital", category: "financeiro", icon: Wallet, tags: ["carteira", "saldo", "cashback"] },
  { id: "promocao", label: "Oferta & Promoção", category: "financeiro", icon: Tag, tags: ["promocao", "oferta", "desconto", "sale"] },
  { id: "desconto", label: "Cupom de Desconto", category: "financeiro", icon: Percent, tags: ["cupom", "desconto", "porcentagem", "off"] },
  { id: "presente", label: "Brinde / Presente", category: "financeiro", icon: Gift, tags: ["presente", "brinde", "bonus", "recompensa"] },
  { id: "fogo", label: "Super Oferta / Hot", category: "financeiro", icon: Flame, tags: ["fogo", "hot", "urgente", "imperdivel", "alta"] },
  { id: "zap", label: "Acesso Rápido / Turbo", category: "financeiro", icon: Zap, tags: ["zap", "raio", "rapido", "expresso"] },
  { id: "star", label: "Avaliações / Top", category: "financeiro", icon: Star, tags: ["estrela", "destaque", "nota", "clientes"] },
  { id: "sparkles", label: "Novidade / Exclusivo", category: "financeiro", icon: Sparkles, tags: ["novidade", "lancamento", "exclusivo", "vip"] },
  { id: "trofeu", label: "Certificação / Líder", category: "financeiro", icon: Award, tags: ["trofeu", "premio", "qualidade", "certificado"] },
  { id: "crown", label: "Plano Premium / VIP", category: "financeiro", icon: Crown, tags: ["coroa", "vip", "premium", "gold"] },

  // Documentos & Mídia
  { id: "pdf", label: "Documento PDF / Contrato", category: "docs", icon: FileText, tags: ["pdf", "documento", "contrato", "edital", "termo"] },
  { id: "planilha", label: "Planilha / Relatório", category: "docs", icon: FileSpreadsheet, tags: ["planilha", "excel", "relatorio", "tabela"] },
  { id: "download", label: "Download / Baixar Arquivo", category: "docs", icon: Download, tags: ["download", "baixar", "instalador", "guia"] },
  { id: "noticias", label: "Blog / Artigos", category: "docs", icon: Newspaper, tags: ["noticias", "blog", "artigo", "leitura", "imprensa"] },
  { id: "foto", label: "Galeria de Fotos", category: "docs", icon: Camera, tags: ["foto", "camera", "galeria", "portfolio", "imagens"] },
  { id: "play", label: "Vídeo / Apresentação", category: "docs", icon: Play, tags: ["video", "play", "apresentacao", "demo"] },
  { id: "seguranca", label: "Segurança & Garantia", category: "docs", icon: ShieldCheck, tags: ["seguranca", "garantia", "confianca", "termo"] },
];

// 2. Curated 3D / Styled SVG Badges Bank
const IMAGE_BANK = [
  {
    id: "badge-wa-3d",
    title: "WhatsApp 3D Vibrante",
    category: "Redes & Atendimento",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='waGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%234ade80'/><stop offset='100%' stop-color='%2316a34a'/></linearGradient><filter id='shWa'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%2315803d' flood-opacity='0.4'/></filter></defs><circle cx='50' cy='50' r='46' fill='url(%23waGrad)' filter='url(%23shWa)'/><path d='M30 70l3.5-12.8A24 24 0 1 1 50 74a23.9 23.9 0 0 1-11.8-3.1L30 70zm13.7-6.2l.7.4A19.8 19.8 0 1 0 50 30a19.8 19.8 0 0 0-17.1 29.8l.5.8-2.3 8.3 8.4-2.2zM43 38c.6 0 1.2 0 1.7.9.6 1.4 2 4.9 2.2 5.3.2.4.3.8 0 1.3s-.5.7-.9 1.2c-.4.4-.8.9-.3 1.8 1.4 2.4 3.1 4.2 5.5 5.6.9.5 1.4.5 1.9 0 .5-.6 2.1-2.4 2.6-3.3.5-.8 1-.7 1.7-.4.7.3 4.5 2.1 5.3 2.5.8.4 1.3.6 1.5.9.2.3.2 1.8-.5 3.7-.7 1.9-4 3.7-5.5 3.8-1.5.1-3 .5-10.2-2.3-8.8-3.5-14.4-12.4-14.8-13-.4-.6-3.6-4.8-3.6-9.1 0-4.3 2.3-6.4 3.1-7.3.8-.9 1.8-1.1 2.4-1.1z' fill='%23ffffff'/></svg>",
  },
  {
    id: "badge-insta-3d",
    title: "Instagram Sunset 3D",
    category: "Redes & Atendimento",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='igGrad' x1='0%' y1='100%' x2='100%' y2='0%'><stop offset='0%' stop-color='%23f59e0b'/><stop offset='30%' stop-color='%23ec4899'/><stop offset='70%' stop-color='%238b5cf6'/><stop offset='100%' stop-color='%236366f1'/></linearGradient><filter id='shIg'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%23db2777' flood-opacity='0.4'/></filter></defs><rect x='6' y='6' width='88' height='88' rx='26' fill='url(%23igGrad)' filter='url(%23shIg)'/><rect x='24' y='24' width='52' height='52' rx='15' fill='none' stroke='%23ffffff' stroke-width='6'/><circle cx='50' cy='50' r='13' fill='none' stroke='%23ffffff' stroke-width='6'/><circle cx='64' cy='36' r='3.5' fill='%23ffffff'/></svg>",
  },
  {
    id: "badge-ponto-3d",
    title: "Ponto Eletrônico & RH",
    category: "Sistemas & Softwares",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='pontoGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2306b6d4'/><stop offset='100%' stop-color='%233b82f6'/></linearGradient><filter id='shPonto'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%232563eb' flood-opacity='0.4'/></filter></defs><circle cx='50' cy='50' r='46' fill='url(%23pontoGrad)' filter='url(%23shPonto)'/><circle cx='50' cy='50' r='32' fill='none' stroke='%23ffffff' stroke-width='5'/><path d='M50 28v22l14 8' fill='none' stroke='%23ffffff' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/><circle cx='50' cy='50' r='4' fill='%23ffffff'/></svg>",
  },
  {
    id: "badge-imob-3d",
    title: "Imobiliária & Locação",
    category: "Imóveis & Habitação",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='imobGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f97316'/><stop offset='100%' stop-color='%23ea580c'/></linearGradient><filter id='shImob'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%23c2410c' flood-opacity='0.4'/></filter></defs><circle cx='50' cy='50' r='46' fill='url(%23imobGrad)' filter='url(%23shImob)'/><path d='M25 50L50 28l25 22v26a4 4 0 0 1-4 4H29a4 4 0 0 1-4-4V50z' fill='none' stroke='%23ffffff' stroke-width='5' stroke-linejoin='round'/><path d='M42 74V54h16v20' fill='none' stroke='%23ffffff' stroke-width='5'/><circle cx='60' cy='42' r='2' fill='%23ffffff'/></svg>",
  },
  {
    id: "badge-hospital-3d",
    title: "Hospital & Saúde SGH",
    category: "Saúde & Medicina",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='hospGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23ef4444'/><stop offset='100%' stop-color='%23b91c1c'/></linearGradient><filter id='shHosp'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%23991b1b' flood-opacity='0.4'/></filter></defs><rect x='8' y='8' width='84' height='84' rx='24' fill='url(%23hospGrad)' filter='url(%23shHosp)'/><path d='M42 26h16v16h16v16H58v16H42V58H26V42h16V26z' fill='%23ffffff'/></svg>",
  },
  {
    id: "badge-system-3d",
    title: "Software & Web Tech",
    category: "Sistemas & Softwares",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='sysGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%236366f1'/><stop offset='100%' stop-color='%234338ca'/></linearGradient><filter id='shSys'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%233730a3' flood-opacity='0.4'/></filter></defs><rect x='8' y='8' width='84' height='84' rx='24' fill='url(%23sysGrad)' filter='url(%23shSys)'/><rect x='22' y='26' width='56' height='40' rx='6' fill='none' stroke='%23ffffff' stroke-width='5'/><path d='M36 74h28M50 66v8' stroke='%23ffffff' stroke-width='5' stroke-linecap='round'/><circle cx='32' cy='34' r='2' fill='%23ffffff'/><circle cx='40' cy='34' r='2' fill='%23ffffff'/></svg>",
  },
  {
    id: "badge-ecommerce-3d",
    title: "Loja & E-commerce",
    category: "Negócios & Vendas",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='shopGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23ec4899'/><stop offset='100%' stop-color='%23be185d'/></linearGradient><filter id='shShop'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%239d174d' flood-opacity='0.4'/></filter></defs><circle cx='50' cy='50' r='46' fill='url(%23shopGrad)' filter='url(%23shShop)'/><path d='M30 40l6-16h28l6 16v32a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4V40z' fill='none' stroke='%23ffffff' stroke-width='5'/><path d='M42 40v-4a8 8 0 0 1 16 0v4' fill='none' stroke='%23ffffff' stroke-width='5'/></svg>",
  },
  {
    id: "badge-pix-3d",
    title: "Pix & Pagamentos",
    category: "Financeiro",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='pixGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2314b8a6'/><stop offset='100%' stop-color='%230f766e'/></linearGradient><filter id='shPix'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%23115e59' flood-opacity='0.4'/></filter></defs><circle cx='50' cy='50' r='46' fill='url(%23pixGrad)' filter='url(%23shPix)'/><path d='M32 50l18-18 18 18-18 18-18-18z' fill='none' stroke='%23ffffff' stroke-width='5'/><path d='M50 38v24M38 50h24' stroke='%23ffffff' stroke-width='4' stroke-linecap='round'/></svg>",
  },
  {
    id: "badge-support-3d",
    title: "Suporte & Central de Ajuda",
    category: "Redes & Atendimento",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='supGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%238b5cf6'/><stop offset='100%' stop-color='%236d28d9'/></linearGradient><filter id='shSup'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%235b21b6' flood-opacity='0.4'/></filter></defs><circle cx='50' cy='50' r='46' fill='url(%23supGrad)' filter='url(%23shSup)'/><path d='M26 50a24 24 0 0 1 48 0v16a6 6 0 0 1-6 6h-6v-18h12V50a18 18 0 0 0-36 0v4h12v18h-6a6 6 0 0 1-6-6V50z' fill='%23ffffff'/></svg>",
  },
  {
    id: "badge-gold-3d",
    title: "Destaque VIP & Premium",
    category: "Gerais",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='goldGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23fbbf24'/><stop offset='100%' stop-color='%23d97706'/></linearGradient><filter id='shGold'><feDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%23b45309' flood-opacity='0.4'/></filter></defs><circle cx='50' cy='50' r='46' fill='url(%23goldGrad)' filter='url(%23shGold)'/><path d='M26 64l6-28 18 14 18-14 6 28H26z' fill='%23ffffff'/><circle cx='26' cy='34' r='4' fill='%23ffffff'/><circle cx='50' cy='24' r='5' fill='%23ffffff'/><circle cx='74' cy='34' r='4' fill='%23ffffff'/></svg>",
  },
];

const CATEGORIES = [
  { id: "all", label: "Todos os Ícones" },
  { id: "redes", label: "Redes & Contato" },
  { id: "sistemas", label: "Sistemas & Softwares" },
  { id: "imoveis", label: "Imóveis & Locação" },
  { id: "saude", label: "Saúde & Hospital" },
  { id: "negocios", label: "Negócios & Lojas" },
  { id: "financeiro", label: "Financeiro & Pix" },
  { id: "docs", label: "Mídia & Docs" },
];

export function IconImagePicker({ value, onChange }: IconImagePickerProps) {
  const [activeTab, setActiveTab] = useState<"icons" | "bank" | "upload">(() => {
    if (value && (value.startsWith("data:image/") || value.startsWith("http://") || value.startsWith("https://"))) {
      return value.startsWith("data:image/svg+xml;utf8,<svg") ? "bank" : "upload";
    }
    return "icons";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customUrl, setCustomUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter icons
  const filteredIcons = ICON_OPTIONS.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.label.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.includes(q))
    );
  });

  // Handle File Upload
  const handleFileUpload = (file: File) => {
    setUploadError(null);
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"].includes(file.type)) {
      setUploadError("Formato não suportado. Por favor, envie uma imagem PNG, JPG, SVG, WebP ou GIF.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("A imagem deve ter no máximo 2 MB para carregamento instantâneo.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
        setUploadError(null);
      } else {
        setUploadError("Não foi possível ler o arquivo.");
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setUploadError("Erro ao ler o arquivo de imagem.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    onChange(customUrl.trim());
    setCustomUrl("");
  };

  const isCurrentValueSelected = (target: string) => {
    return value === target;
  };

  return (
    <div className="space-y-3.5 bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90">
      {/* Top Header & Preview */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-800">
            Ícone ou Imagem do Botão
          </label>
          <span className="text-[11px] text-slate-500">
            Escolha um ícone temático, selecione do banco de imagens ou envie sua própria logo.
          </span>
        </div>

        {/* Current Active Preview */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ativo:</span>
          <div className="w-6 h-6 flex items-center justify-center text-indigo-600">
            <LinkIconRenderer icon={value} className="w-5 h-5 max-h-5" />
          </div>
          {value && value !== "globe" && (
            <button
              type="button"
              onClick={() => onChange("globe")}
              className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer"
              title="Redefinir para ícone padrão"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-slate-200/70 rounded-xl gap-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("icons")}
          className={`flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "icons"
              ? "bg-white text-indigo-600 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Biblioteca de Ícones</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bank")}
          className={`flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "bank"
              ? "bg-white text-indigo-600 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Banco 3D & Badges</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "upload"
              ? "bg-white text-indigo-600 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Próprio / URL</span>
        </button>
      </div>

      {/* TAB 1: ICONS LIBRARY */}
      {activeTab === "icons" && (
        <div className="space-y-3">
          {/* Search bar & Category filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ícone (ex: ponto, imovel, hospital, whatsapp, loja, pix...)"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white shadow-2xs font-bold"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icons Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200/80 shadow-inner">
            {filteredIcons.map((item) => {
              const IconComp = item.icon;
              const isSelected = isCurrentValueSelected(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange(item.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition border text-center relative group cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-xs ring-1 ring-indigo-500"
                      : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-700"
                  }`}
                  title={item.label}
                >
                  <IconComp
                    className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${
                      isSelected ? "text-indigo-600" : "text-slate-600"
                    }`}
                  />
                  <span className="text-[10px] leading-tight line-clamp-1 w-full">{item.label}</span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2 h-2 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
            {filteredIcons.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-slate-400">
                Nenhum ícone encontrado com a palavra &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 3D IMAGE BANK & BADGES */}
      {activeTab === "bank" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200/80 shadow-inner">
            {IMAGE_BANK.map((item) => {
              const isSelected = isCurrentValueSelected(item.src);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange(item.src)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition border text-left relative group cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-xs ring-1 ring-indigo-500"
                      : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center p-0.5 shadow-2xs">
                    <img src={item.src} alt={item.title} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold block leading-tight truncate">{item.title}</span>
                    <span className="text-[9px] text-slate-400 block">{item.category}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2 h-2 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM UPLOAD & DIRECT URL */}
      {activeTab === "upload" && (
        <div className="space-y-3">
          {/* Specifications and Recommended Size Alert Box */}
          <div className="p-3 bg-gradient-to-r from-amber-50 to-indigo-50/50 border border-amber-200/90 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Especificações & Tamanho Correto da Imagem:</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-0.5">
              <div className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <Ratio className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Proporção: 1:1 (Quadrada)</strong>
                  <span>Garante que o ícone não fique esticado ou distorcido.</span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Dimensão Ideal: 64x64 a 256x256 px</strong>
                  <span>Mínimo: 32x32 px • Máximo recomendado: 512x512 px.</span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Formato: PNG Transparente ou SVG</strong>
                  <span>Recomendado fundo transparente para se mesclar ao botão.</span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Peso Máximo: Até 2 MB</strong>
                  <span>Imagens leves proporcionam carregamento instantâneo.</span>
                </div>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="p-2.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
              {uploadError}
            </div>
          )}

          {/* Current Upload preview if is an image */}
          {value && (value.startsWith("data:image/") || value.startsWith("http://") || value.startsWith("https://")) ? (
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0] border border-slate-200 p-1 flex items-center justify-center shrink-0">
                  <img src={value} alt="Ícone personalizado" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Imagem Personalizada Ativa</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block flex items-center gap-1">
                    <Check className="w-3 h-3" /> Pronta e ajustada para exibição no link
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChange("globe")}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer"
                title="Remover imagem e voltar ao ícone padrão"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          {/* Drag & Drop / File Input Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 rounded-xl p-4 sm:p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isUploading ? "Carregando imagem..." : "Clique para selecionar o arquivo do seu computador"}
            </span>
            <span className="text-[10px] text-slate-500">
              Formatos aceitos: <strong>PNG transparente (1:1), SVG, WebP ou JPG</strong> (Tamanho ideal: 64x64 a 256x256 px)
            </span>
          </div>

          {/* Direct URL Input */}
          <div className="pt-1">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Ou cole uma URL externa direta da imagem
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://meusite.com.br/minha-logo-64x64.png"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!customUrl.trim()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
