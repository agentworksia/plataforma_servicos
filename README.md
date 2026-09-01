# Plataforma de serviços de limpeza — Curitiba e RMC

Marketplace de dois lados para serviços de limpeza (diária padrão, passadoria, pós-obra e
corporativa), começando por Curitiba e Região Metropolitana. Multi-cidade desde o schema.

O escopo completo do produto está em [`PROMPT-INICIAL.md`](PROMPT-INICIAL.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 7 + PostgreSQL (Supabase) ·
Auth.js v5 · Supabase Storage · Resend · deploy na Vercel.

## Rodando localmente

```bash
npm install
cp .env.example .env        # preencha com credenciais reais (Supabase, Resend)
npm run db:deploy           # aplica as migrations no banco
npm run setup:storage       # cria os buckets 'documentos' e 'perfil' (privados)
npm run db:seed             # configs, regiões, tabela de preços e usuários demo
npm run dev
```

Abra <http://localhost:3000>.

Usuários de demonstração (senha `senha12345`): `admin@`, `cliente@`, `profissional@plataforma.local`.

## Variáveis de ambiente

Veja [`.env.example`](.env.example). Resumo:

- `DATABASE_URL` / `DIRECT_URL` — Postgres do Supabase (pooler transação 6543 no runtime, sessão 5432 nas migrations)
- `AUTH_SECRET` / `AUTH_URL` — Auth.js
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (opcional) / `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY` / `EMAIL_FROM` (opcionais)
- `PAYMENT_PROVIDER` (`fake` no MVP)

## O que está implementado

- **Cadastro** do cliente (PF/PJ) e da profissional (dados + upload de foto/documento no
  Supabase Storage, status `PENDENTE`)
- **Aprovação manual** no admin (ficha, documentos por URL assinada, aprovar/reprovar/suspender)
- **Agenda** da profissional (disponibilidade recorrente + bloqueios)
- **Agendamento** do cliente: tipo, endereço (valida cidade contra `ServiceArea`; fora da área
  gera lead), data/hora/duração, pós-obra, preço por tabela, pagamento retido (provider `fake`)
- **Matching automático**: fila por avaliação/carga/aceite; oferta com prazo; aceite/recusa;
  reprocessar e atribuir manual no admin
- **Recorrência** semanal/quinzenal/mensal com profissional fixa (série + realocação pontual);
  cancelamento da série com reembolso das ocorrências futuras
- **Conclusão** (iniciar/concluir) → gera repasse · **avaliação** (1–5) do cliente ·
  **cancelamento** com política de 24h
- **Repasses** no admin (liberar individual ou em lote; `payments.liberarRepasse` fake)
- **Admin**: tabela de preços e regiões atendidas
- Páginas de Termos e Privacidade (rascunho)

## O que ainda não foi feito

- Provider de pagamento real (a interface `PaymentProvider` está pronta; hoje roda com `fake`)
- Cron para expirar ofertas automaticamente (hoje o admin reprocessa a fila)
- Endereços/meios de pagamento gerenciados numa tela própria do cliente
- Revisão jurídica dos termos; e-mails transacionais além do "conta aprovada"
- Fase 2 do PROMPT-INICIAL (chat, favoritar profissional, licitação, PWA, métricas etc.)
