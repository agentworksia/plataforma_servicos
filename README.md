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
cp .env.example .env      # preencha com credenciais reais (Supabase, Resend)
npm run db:deploy         # aplica as migrations no banco
npm run db:seed           # configs, regiões, tabela de preços e usuários demo
npm run dev
```

Abra <http://localhost:3000>.

Usuários de demonstração criados pelo seed (senha `senha12345`):

| Papel | E-mail |
|---|---|
| Admin | `admin@plataforma.local` |
| Cliente | `cliente@plataforma.local` |
| Profissional | `profissional@plataforma.local` |

## Variáveis de ambiente

Veja [`.env.example`](.env.example). Resumo:

- `DATABASE_URL` / `DIRECT_URL` — Postgres do Supabase (pooler para runtime, conexão direta para migrations)
- `AUTH_SECRET` / `AUTH_URL` — Auth.js
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — Storage
- `SUPABASE_BUCKET_DOCUMENTOS` / `SUPABASE_BUCKET_PERFIL`
- `RESEND_API_KEY` / `EMAIL_FROM`
- `PAYMENT_PROVIDER` (`fake` no MVP)

## Estado atual (esqueleto)

Pronto:

- Projeto Next 16 + Tailwind + Prisma 7 (driver adapter) + Auth.js v5 configurados
- Schema de dados completo (`prisma/schema.prisma`) e seed
- Landing + páginas informativas + `/agendar` (CTA)
- Login funcional (Credentials) e logout
- Área logada com 3 painéis (cliente / profissional / admin) protegidos por papel
- Camadas de domínio com assinatura pronta e implementação pendente:
  `pricing`, `matching`, `payments` (provider `fake`), `storage`, `email`

## Próximas etapas sugeridas (uma de cada vez)

1. **Cadastro** — cliente (PF/PJ) e profissional (dados + upload de documentos + consentimento LGPD)
2. **Onboarding da profissional** — regiões, tipos de serviço, agenda de disponibilidade + bloqueios
3. **Aprovação manual** no painel admin (ver documentos, aprovar/reprovar/suspender)
4. **Fluxo de agendamento** do cliente — serviço, CEP (ViaCEP + ServiceArea), data/hora/duração,
   recorrência, preço (`lib/pricing`), pagamento retido
5. **Matching** — fila por elegibilidade + avaliação, oferta com prazo, aceite/recusa, fallback admin
6. **Recorrência com profissional fixa** — série + realocação pontual
7. **Conclusão + avaliação** — libera repasse
8. **Repasses** — painel admin dispara/confirma (`lib/payments.liberarRepasse`)
9. **Painel admin** — tabela de preços e regiões atendidas
10. **Provider de pagamento real** — implementar `PaymentProvider` + webhook

Nada acima está implementado além da assinatura; as telas mostram estado vazio explicando o que falta.
