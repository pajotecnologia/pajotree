# 📋 Pajotree - Registro Oficial de Recursos, Arquitetura e Status do Sistema

Este documento registra detalhadamente todos os módulos, recursos, arquitetura e integrações implementadas no **Pajotree SaaS**, garantindo rastreabilidade e histórico para que nenhuma funcionalidade seja perdida ou refeita.

---

## 🎨 1. Editor Visual (`/app/editor`)

### Fundo da Página (Background):
- **Upload de Imagem Local**: Suporte para envio de imagens do computador (PNG, JPG, WebP, GIF até 3 MB) com persistência em base64/URL e preview em tempo real.
- **Inserção via URL Direta**: Campo para colar URLs externas de imagens (`https://...`).
- **6 Presets HD Integrados**:
  1. *Dark Gradient Mesh*
  2. *Cyber Neon City*
  3. *Abstract Fluid*
  4. *Deep Space Night*
  5. *Studio Minimalist*
  6. *Nordic Mountain*
- **Gradientes & Cores Sólidas**: 6 presets modernos (*Galáxia Escura*, *Obsidiana Minimal*, *Sunset Violet*, *Emerald Forest*, *Ocean Deep*, *Minimal Clean*) + seletor hexadecimal personalizado.
- **Botões de Gestão da Imagem**: Indicador de imagem ativa, botão *Trocar Foto* e botão *Remover Imagem*.

### Foto de Perfil / Logomarca:
- Upload com drag-and-drop ou clique (PNG, JPG, WebP até 3 MB).
- Exibição de avatar com iniciais caso não haja foto.
- Botões de *Trocar Foto* e *Remover Foto*.
- Sincronização automática com `organization.logoUrl`.

### Tipografia & Fontes:
- Carregamento dinâmico do Google Fonts:
  - **Inter** (Moderno & Neutro)
  - **Poppins** (Geométrico & Jovial)
  - **Roboto** (Clássico & Limpo)
  - **Montserrat** (Elegante & Marcante)
  - **DM Sans** (Minimalista Tech)
  - **Open Sans** (Amigável & Legível)
  - **Lato** (Corporativo & Equilibrado)
  - **Nunito** (Arredondado & Suave)
  - **Playfair Display** (Sofisticado & Editorial)

### Estilos de Botão:
- Arredondado (`rounded-xl`), Suave (`rounded-md`), Pílula (`rounded-full`), Quadrado (`rounded-none`) e Efeito Vidro Glassmorphism (`backdrop-blur-md bg-white/10`).

### Live Preview Interativo:
- Alternância entre visualização **Mobile (Smartphone)**, **Tablet** e **Desktop**.
- Renderizador público idêntico à página final (`/p/[slug]`).

---

## 🔗 2. Links Rastreáveis & Gerador de WhatsApp (`/app/links`)

- **Edição Completa de Links**:
  - Botão de **Editar** (`Pencil`) em cada link da lista.
  - Carregamento automático e preenchimento dos campos no modal.
  - Se o link for do WhatsApp, extrai automaticamente o **DDD + Telefone** e a **Mensagem personalizada** para edição fácil e rápida.
  - Atualização via `PUT /api/links`.
- **Aba de Link / Site Tradicional**: URL de destino com auto-prepend de `https://`.
---

## 👥 3. Gestão e Sinalização Visual de Novos Leads (`/app/leads` e `/app/crm`)

### Sinalização em Tempo Real em Todo o Sistema:
- **Barra de Navegação / Menu Lateral (`/app/layout.tsx`)**:
  - Badge pulsante verde `Novo` / `+X novos` ao lado de *Leads & Contatos* e *CRM Kanban*.
  - Indicador numérico animado no topo do cabeçalho quando há leads aguardando atendimento.
- **Central de Leads (`/app/leads`)**:
  - **Badge de Origem com Destaque**: `📝 Formulário do Site` (lilás/índigo com ícone `FileText`) identificando claramente contatos vindos do formulário público.
  - **Badge de Status com Pulso**: `✨ NOVO LEAD` com ponto pulsante verde esmeralda.
  - **Destaque Visual na Linha**: Borda lateral verde (`border-l-4 border-l-emerald-500 bg-emerald-50/25`) nos novos leads.
  - **Balão de Mensagem Direta**: Exibição do texto que o cliente escreveu no formulário em caixa de citação elegante.
  - **Ações Rápidas**: Botão de WhatsApp direto com DDI 55, botão de *Atendido* e botão de *Converter em Cliente*.
- **Kanban CRM (`/app/crm`)**:
  - Card da oportunidade com badge `📝 Formulário do Site` e tag `NOVO`.
  - Prévia da mensagem do lead no próprio card do Kanban.
  - Botão de 1 clique para chamar no WhatsApp direto do card.
- **Dashboard Principal (`/app`)**:
  - Lista de *Leads Recentes* com tag `Formulário`, badge `NOVO` e botão de WhatsApp.


## 📊 3. Analytics & Rastreamento (`/app/analytics`)

- **Filtros por Período**:
  - **Hoje** (`today`)
  - **Ontem** (`yesterday`)
  - **7 Dias** (`7d`)
  - **30 Dias** (`30d`)
  - **Este Mês** (`this_month`)
  - **Mês Anterior** (`last_month`)
  - **90 Dias** (`90d`)
  - **Todo o Período** (`all`)
  - **Personalizado** (`custom`): com seletor de data inicial (`De:`) e data final (`Até:`).
- **Métricas Chave**: Total de Visitas, Visitantes Únicos, Cliques nos Links, Leads Convertidos e Taxa de Conversão.
- **Gráfico de Evolução Temporal Diária**: Linha com contagem de acessos dia a dia.
- **Fontes de Tráfego & UTMs**: Rastreamento de origens (Instagram, Facebook, Google, Direto).
- **Dispositivos**: Divisão por Mobile, Desktop e Tablet.
- **Gestão de Pixels**: Conexão de Meta Pixels e Google Analytics 4 (GA4).

---

## 👑 4. Permissões, Planos & Super Admin

- **Super Admin (Painel Mestre)**:
  - Acesso irrestrito a `/admin` (Visão Geral, Empresas, Planos, Assinaturas & Faturamento).
  - Associação automática com organização master sem erro 401.
  - Limites ilimitados no `PlanLimitService` (99.999 páginas, links, leads, conexões).
  - Selo especial no painel de faturamento com atalho para a gestão de planos.
- **White Label**:
  - Painel do usuário: `/app/settings/white-label` para personalizar a marca.
  - Painel do Super Admin: `/admin/plans` para habilitar ou desabilitar permissão de *Domínio Próprio* e *Remoção da marca Pajotree* por plano e por cliente.

---

## 🏦 5. Integração com Banco Inter API Cobrança v3 (Bolepix)

### Arquitetura:
- **Cliente mTLS & OAuth 2.0**: [src/lib/banco-inter.ts](file:///c:/Users/AdminUser/Documentos/PROJETOS_SISTEMAS/pajotree/src/lib/banco-inter.ts) com suporte a TLSv1.2/1.3, normalização de `.crt` / `.key` e cache de token OAuth em memória.
- **Emissão de Bolepix Híbrido**: Emissão de boleto com Linha Digitável, Código de Barras e Pix Copia e Cola.
- **Download de PDF Oficial**: Endpoint [src/app/api/banco-inter/pdf/route.ts](file:///c:/Users/AdminUser/Documentos/PROJETOS_SISTEMAS/pajotree/src/app/api/banco-inter/pdf/route.ts).
- **Webhook de Baixa Automática em Tempo Real**: [src/app/api/webhooks/banco-inter/route.ts](file:///c:/Users/AdminUser/Documentos/PROJETOS_SISTEMAS/pajotree/src/app/api/webhooks/banco-inter/route.ts).
- **Painel Mestre de Configuração**: Nova aba no Super Admin em `/admin/billing` com status da conexão, botão para *Testar Conexão mTLS* e *Registrar Webhook Oficial*.
- **Checkout no Painel do Cliente**: Em `/app/billing`, modal completo com opções para copiar a Linha Digitável, Pix Copia e Cola e Baixar o Boleto em PDF.

---

## 🏷️ 6. White Label & Domínio Próprio (`/app/settings/white-label`)

### Recursos Visuais & Tipografia:
- **Fontes Dinâmicas em Tempo Real**: Seleção entre as 9 principais fontes do Google Fonts com injeção de `<link>` dinâmica no preview e na página pública.
- **Upload de Imagem de Fundo**: Suporte a envio de imagens personalizadas do computador (PNG, JPG, WebP) com base64 e preview instantâneo.
- **6 Wallpapers HD Curados**: Presets de alta definição (Dark Mesh, Cyber Neon, Fluid Art, Deep Space, Minimalist, Nordic Mountains) com 1 clique.
- **Gradientes & Cores**: 6 presets modernos + campos hexadecimais para cores primária, secundária e texto.
- **Estilos de Botão**: Arredondado moderno, suave, pílula, quadrado e glassmorphism.

### Sincronização de Dados da Empresa:
- Reutilização e preenchimento automático das informações cadastrais da organização (Logomarca/Avatar, Nome Fantasia e Descrição Institucional).
- Botão *"Sincronizar com Empresa"* para puxar dados cadastrais atualizados a qualquer momento.

### Domínio Próprio & Guia DNS Interativo:
- Configuração de subdomínio/domínio personalizado (`links.minhaempresa.com.br`).
- Tabela interativa com registros DNS:
  - **Tipo CNAME**: Entrada `links`, Destino `cname.pajotree.com.br`, TTL `3600` (com botão de cópia com 1 clique).
  - **Tipo A (Opcional)**: Entrada `@`, Destino `76.76.21.21`, TTL `3600`.
- **Verificador de Apontamento DNS**: Botão *"Testar Apontamento DNS"* que consulta registros de DNS em tempo real via API backend e atualiza status para `VERIFIED` ou `PENDING`.

### Remoção de Marca Pajotree:
- Switch/Toggle *"Remover Marca 'Criado com Pajotree'"* que oculta o selo do rodapé.
- Atualização em tempo real no simulador de celular (Live Phone Preview).

---

## 🏢 7. Configurações da Empresa (`/app/settings`)

### Logomarca da Empresa:
- **Upload Direto & Preview**: Envio de imagem (PNG, JPG, WebP até 2.5MB) via drag-and-drop ou seleção de arquivo local.
- **Ações de Gestão**: Botão de *Upload / Trocar Logomarca* e *Remover Logomarca*.
- **Persistência Centralizada**: Atualiza `organization.logoUrl` no banco de dados e sincroniza com o White Label e as páginas públicas.

### Máscaras e Formatações em Tempo Real:
- **CNPJ / CPF**: Máscara inteligente progressiva:
  - Formato CNPJ (14 dígitos): `00.000.000/0000-00`
  - Formato CPF (11 dígitos): `000.000.000-00`
- **WhatsApp Oficial**: Formato brasileiro para celular de 9 dígitos: `(00) 90000-0000` (11 dígitos).
- **Telefone Fixo**: Formato brasileiro padrão: `(00) 0000-0000` (10 dígitos).
- Tipografia monoespaçada (`font-mono`) nos campos numéricos para alinhamento profissional.

---

## 🗄️ 8. Resumo das Rotas e Arquivos Principais

| Módulo | Arquivo Principal | Descrição |
|---|---|---|
| **Editor Visual** | `src/app/app/editor/page.tsx` | Editor completo com upload de fundo, presets e fontes |
| **Config. da Empresa** | `src/app/app/settings/page.tsx` | Upload de logo, máscaras para CNPJ, WhatsApp e Fixo |
| **White Label UI** | `src/app/app/settings/white-label/page.tsx` | Identidade visual, DNS, upload de fundo e remoção de marca |
| **White Label API** | `src/app/api/settings/white-label/route.ts` | GET/PUT de White Label e POST de verificação de DNS |
| **Página Pública** | `src/components/public-page/page-renderer.tsx` | Renderizador público dos links e fundo |
| **Links & WhatsApp** | `src/app/app/links/page.tsx` | Gestor de links e gerador WhatsApp |
| **Analytics API** | `src/app/api/analytics/route.ts` | Endpoint de métricas com suporte a intervalos de datas |
| **Analytics UI** | `src/app/app/analytics/page.tsx` | Dashboard de métricas e filtros por período |
| **Banco Inter Lib** | `src/lib/banco-inter.ts` | Conexão mTLS, OAuth2, Bolepix e Webhooks |
| **Webhook Inter** | `src/app/api/webhooks/banco-inter/route.ts` | Baixa instantânea e ativação de assinaturas |
| **PDF Inter** | `src/app/api/banco-inter/pdf/route.ts` | Streaming binário do PDF oficial |
| **Admin Inter API** | `src/app/api/admin/banco-inter/route.ts` | Teste de conexão e registro de webhook |
| **Billing Admin** | `src/app/admin/billing/page.tsx` | Gestão de faturamento e credenciais do Banco Inter |
| **Billing Tenant** | `src/app/app/billing/page.tsx` | Upgrades de plano e emissão de Bolepix |
| **Auth & Super Admin** | `src/lib/auth.ts` | Contexto de autenticação e organização master |


