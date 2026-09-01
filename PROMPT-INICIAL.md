# Prompt inicial — Plataforma de serviços de limpeza (Curitiba e RMC)

> Documento de escopo / prompt de arranque do projeto. Reconstruído em 2026-08-31.
> Cole o conteúdo abaixo (ou aponte para este arquivo) ao iniciar a construção.

---

## Contexto para o assistente

Sou freelancer/agência, construo SaaS sob demanda, publico no GitHub e faço deploy na Vercel.
Quero código pronto para produção, construído incrementalmente, sem abstração prematura e sem
features que ninguém pediu. Entenda o escopo, alinhe stack e estrutura de pastas antes de gerar
muito código, e ao final de cada entrega diga o que falta — sem implementar escopo extra sem eu
confirmar.

## O produto

Marketplace de dois lados para **serviços de limpeza**, começando em **Curitiba e Região
Metropolitana**. Multi-cidade desde o schema (campo cidade/região em tudo), mas só CWB + RMC
ativas no MVP; outras cidades entram depois só habilitando regiões.

Inspiração de modelo de negócio: **Parafuzo**, **Maria Brasileira**, **Sou Diarista**.

Duas pontas:

- **Profissional** (diarista): cadastra-se, define regiões de atuação, tipos de serviço que
  atende e disponibilidade (agenda). Passa por **aprovação manual** antes de ficar visível.
  Recebe serviços **atribuídos pela plataforma** e aceita/recusa cada oferta.
- **Cliente** (pessoa física ou empresa): agenda um serviço para um endereço — tipo, data,
  horário, duração (**4 / 6 / 8 horas**) e recorrência. Paga online. Avalia ao final.

A plataforma é o intermediário: faz o **matching**, **retém o pagamento** e **repassa à
profissional após a conclusão**, cobrando uma taxa de serviço.

## Tipos de serviço (todos no mesmo fluxo de agendamento no MVP)

1. **Diária de limpeza padrão** (residencial) — 4/6/8h.
2. **Passadoria** — 4/6/8h.
3. **Limpeza técnica pós-obra** — 4/6/8h + campos extras (metragem, nº de cômodos, observações).
   Pode ter multiplicador de preço ou entrar como "sob orçamento" com aprovação do admin antes
   de cobrar.
4. **Corporativa / governamental** — cliente PJ/órgão público; mesmo fluxo de agendamento, com
   CNPJ e dados de faturamento. O **fluxo formal de licitação** (edital, empenho, contrato,
   NF-e) fica para fase 2 — no MVP é agendamento + registro dos dados fiscais.

`ServiceType` é um parâmetro do agendamento, não telas separadas.

## Fluxo do cliente (MVP)

1. Escolhe o tipo de serviço.
2. Informa o endereço (CEP → valida se está em CWB/RMC; fora da área, capta o lead e avisa que
   ainda não atende).
3. Escolhe data + janela de horário + duração (4/6/8h).
4. Escolhe a recorrência: **avulsa / semanal / quinzenal / mensal**.
5. (Opcional) extras que ajustam o preço — lista curta; pode ficar para fase 2.
6. Vê o preço calculado (tabela por tipo × duração × região; multiplicador para pós-obra).
7. Paga — cartão ou Pix. O valor fica **retido**.
8. O sistema **atribui automaticamente** uma profissional (ver "Matching").
9. Recebe confirmação e acompanha o status: `agendado → em andamento → concluído`
   (`aguardando profissional` e `cancelado` como estados extras). Status simples, sem
   rastreio em tempo real no MVP.
10. Após a conclusão, avalia a profissional (nota 1–5 + comentário). Isso libera o repasse.

## Matching / atribuição (MVP)

- O cliente **não escolhe** a profissional — o sistema atribui.
- **Elegibilidade:** profissional aprovada, atende aquele tipo de serviço, cobre a região do
  endereço, tem o horário livre e sem conflito com outro serviço.
- **Ordem da fila:** melhor **média de avaliação** primeiro; desempate por menor nº de serviços
  na semana, maior taxa de aceite e proximidade. Regra simples e configurável.
- A profissional recebe a **oferta** e **aceita ou recusa** dentro de um prazo; se recusar ou
  expirar, passa para a próxima da fila.
- **Recorrência (profissional fixa):** ao agendar uma série recorrente, o sistema tenta alocar
  **a mesma profissional** para todas as ocorrências futuras, e ela aceita a série inteira. Se
  numa data específica ela não puder, **só aquela ocorrência** é realocada (mesma regra de
  prioridade por avaliação), mantendo a titular nas demais.
- Se ninguém aceitar, o serviço fica `aguardando profissional` e o admin é notificado para
  atribuir manualmente (fallback do MVP).

## Painel da profissional (MVP)

- Cadastro: dados pessoais, documento com foto, foto de perfil, bio curta, regiões que atende
  (cidades/bairros da RMC), tipos de serviço, dados de repasse (chave Pix / conta).
- Status da conta: `pendente / aprovada / reprovada / suspensa`.
- Agenda: disponibilidade recorrente (dias e horários) + bloqueios pontuais.
- Ofertas: aceitar/recusar; próximos serviços; histórico e ganhos.
- Avaliações recebidas.

## Painel do cliente (MVP)

- Meus agendamentos (próximos / passados) com status.
- Detalhe do serviço; cancelar / reagendar respeitando a política de prazo (ex.: sem custo até
  24h antes).
- Gerenciar séries recorrentes (pausar / cancelar).
- Endereços salvos e meios de pagamento.
- Avaliar serviço concluído.

## Painel admin (mínimo, MVP)

- Aprovar / reprovar / suspender profissionais, com acesso aos documentos enviados.
- Ver todos os agendamentos e status; **reatribuir** manualmente os que estão
  `aguardando profissional`.
- Ver repasses pendentes / efetuados e confirmar/disparar repasse.
- Editar a **tabela de preços** (tipo × duração × região).
- Gerenciar **regiões atendidas** (cidades/bairros ativos).

## Regras de negócio principais

- `preço = f(tipo, duração, região) + extras`; **taxa da plataforma = X%** (config).
- Pós-obra: multiplicador OU "sob orçamento" com aprovação do admin antes da cobrança.
- Pagamento **retido na criação**; repasse liberado **N dias após a conclusão** sem disputa
  (config), ou manualmente pelo admin no MVP.
- Cancelamento: política por prazo, com reembolso total / parcial / sem reembolso.
- LGPD: consentimento no cadastro; documentos com acesso restrito ao admin.
- Avaliação não é obrigatória para novo agendamento no MVP (só incentivada).

## Stack proposta

- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**.
- **Prisma + PostgreSQL** (Neon ou Supabase).
- **Auth.js** (ou Clerk) — papéis `CLIENTE` e `PROFISSIONAL`; `ADMIN` como role separada.
- **Pagamentos:** Mercado Pago **ou** Pagar.me — *decidir*. Ambos suportam Pix + split/repasse
  para marketplace; Mercado Pago tende a ser mais direto para Pix. Webhooks para confirmar
  pagamento e habilitar repasse.
- **E-mail transacional:** Resend.
- **Uploads** (foto/documentos): Vercel Blob, UploadThing ou bucket do Supabase.
- **Deploy:** Vercel. Env vars configuradas no painel antes do 1º deploy de produção.

## Modelo de dados (rascunho)

```
User(id, role, nome, email, telefone, criadoEm)
ProfessionalProfile(userId, status, bio, fotoUrl, regioesAtendidas[], tiposServico[],
                    dadosRepasse, documentos[])
ClientProfile(userId, tipo PF|PJ, cnpj?, razaoSocial?)
Address(id, clientId, cep, logradouro, numero, complemento, bairro, cidade, referencia)
Availability(professionalId, diaSemana, horaInicio, horaFim)
AvailabilityException(professionalId, data, tipo BLOQUEIO|EXTRA)
ServiceArea(id, cidade, bairro?, ativo)
PricingRule(tipoServico, duracaoHoras, serviceAreaId, valorBase, multiplicador)
Booking(id, clientId, addressId, tipoServico, data, horaInicio, duracaoHoras,
        recorrencia AVULSA|SEMANAL|QUINZENAL|MENSAL, seriesId?, status, valorTotal,
        taxaPlataforma, professionalId?)
BookingOffer(id, bookingId, professionalId, status PENDENTE|ACEITA|RECUSADA|EXPIRADA, expiraEm)
Payment(id, bookingId, provider, providerId, status, valor)
Payout(id, professionalId, bookingId, status, valor, liberadoEm)
Review(id, bookingId, professionalId, clientId, nota, comentario, criadoEm)
```

## MVP vs. depois

**MVP:** cadastro + aprovação manual da profissional · agenda de disponibilidade · agendamento
pelo cliente com os 4 tipos · preço por tabela · pagamento online retido · matching automático
por avaliação + aceite da profissional · recorrência com profissional fixa · status básico do
serviço · avaliação · repasse (disparo manual/semiautomático pelo admin) · painel admin mínimo ·
multi-cidade no schema (só CWB + RMC ativas).

**Depois:** PWA/app da profissional · chat cliente↔profissional · cliente favoritar/escolher
profissional · rastreio em tempo real · fluxo formal de licitação (edital/empenho/contrato/NF-e)
· repasse 100% automático · cupons e programa de indicação · expansão de cidades ·
seguro/garantia · reagendamento inteligente · dashboard de métricas.

## Como quero trabalhar

1. Confirme a stack e a **estrutura de pastas** antes de gerar muito código.
2. **Esqueleto rodando primeiro** (Next + Prisma + Auth + deploy vazio na Vercel); depois uma
   feature de cada vez, testando no navegador antes de avançar.
3. `.env` no `.gitignore` antes do 1º commit; segredos nunca hardcoded; **validação no backend**.
4. Ao final de cada entrega, liste o que falta. Nada de escopo extra sem eu confirmar.
5. Repo no GitHub (confirmar público/privado antes do push). Configurar env vars na Vercel antes
   do 1º deploy de produção e me avisar quais faltam.
