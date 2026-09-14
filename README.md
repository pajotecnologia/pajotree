# PAJOTREE

SaaS multi-tenant da PAJO TECNOLOGIA para criação e gestão de páginas, links, captação de leads, CRM, analytics, QR Codes e automações.

## Stack

- Next.js 16 + App Router
- React 19
- TypeScript em modo strict
- Tailwind CSS 4
- Prisma + PostgreSQL
- Zod para validação

## Desenvolvimento

```bash
npm ci
npm run dev
```

## Banco de dados

Configure `DATABASE_URL` no ambiente e utilize os comandos Prisma apropriados para o ambiente. O seed está disponível em `prisma/seed.ts`:

```bash
npm run db:seed
```

## Verificações

```bash
npm run lint
npm run typecheck
npm run build
```

## Arquitetura

O sistema utiliza organizações como fronteira de tenancy. Recursos de negócio devem ser sempre consultados e alterados com escopo da organização autenticada e com autorização baseada em RBAC.

Principais domínios do projeto:

- autenticação e usuários;
- organizações e permissões;
- páginas e blocos;
- links, short links e QR Codes;
- analytics e campanhas;
- leads e CRM;
- automações;
- planos, assinaturas e pagamentos;
- integrações.

## Segurança

- Nunca versionar secrets ou arquivos `.env`.
- Validar entradas de APIs antes de executar operações de negócio.
- Verificar autenticação, associação à organização e permissão no backend.
- Não expor tokens, senhas ou dados sensíveis em logs ou respostas.
- Mudanças no schema Prisma devem ser não destrutivas e compatíveis com os dados existentes.

## Diretrizes de contribuição

Consulte `AGENTS.md` antes de alterações relacionadas ao Next.js. Preserve as bibliotecas e convenções existentes e prefira mudanças incrementais, testáveis e reversíveis.
