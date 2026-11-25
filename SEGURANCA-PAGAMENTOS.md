# Segurança do pagamento — varredura e pendências

Varredura feita em 09/11/2026 sobre todo o código da plataforma, com foco no que muda ao
ligar Pix e cartão de crédito de verdade. Divide-se em três partes: o que já foi corrigido,
o que você precisa fazer fora do código, e o que continua em aberto.

O provedor é o **Asaas**, com **split**: a parte da profissional é creditada direto na conta
dela, e na conta da plataforma fica só a comissão.

---

## 1. O que foi corrigido nesta entrega

### 1.1 Webhook sem autenticação (era o mais grave)

`POST /api/webhooks/pagamento` aceitava qualquer requisição. Enquanto todos os casos eram
`TODO`, isso era inofensivo. No momento em que ele passasse a confirmar pagamento, qualquer
pessoa com a URL liberaria serviço sem pagar — um `curl` bastava.

O Asaas **não assina o payload**. A autenticação é um token estático que você define e que
ele devolve no header `asaas-access-token`. Agora:

- o token é conferido antes de qualquer leitura do corpo;
- a comparação é em tempo constante (`timingSafeEqual`), para não vazar o token caractere a
  caractere por diferença de tempo de resposta;
- **falha fechada**: sem `ASAAS_WEBHOOK_TOKEN` configurado, o endpoint recusa tudo. O
  contrário seria pior do que não ter proteção, porque pareceria protegido;
- a resposta é `401` e o corpo recusado não vai para o log, para um payload forjado não virar
  entrada de log arbitrária.

### 1.2 Reenvio de webhook processando duas vezes

O Asaas reenvia o mesmo evento até receber `200`. Sem trava, uma confirmação reenviada criaria
um segundo repasse. Agora cada evento é gravado em `webhook_eventos` com índice único
`(provider, eventoId)`; o reenvio cai na trava e responde `200` sem reprocessar.

Se o processamento falhar no meio, o registro do evento é apagado — senão o reenvio seria
descartado pela trava e o efeito se perderia em silêncio.

### 1.3 Confirmação de pagamento vinda da resposta da API

O código antigo gravava o status que o provider devolvia na criação da cobrança. Com o
provider `fake` isso era `PAGO_RETIDO` e o serviço seguia direto. Com provider real, uma
cobrança Pix nasce **pendente** — e aceitar esse status como pago liberaria serviço sem
dinheiro ter entrado.

Agora `criarCobranca` do Asaas devolve sempre `PENDENTE`. Quem confirma pagamento é
exclusivamente o webhook.

### 1.4 Cobrança duplicada

`payments.providerId` ganhou índice único, e `criarCobrancaDoAceite` não cria cobrança se já
existe `Payment` para o agendamento. O aceite pode ser reprocessado sem gerar duas cobranças.

### 1.5 Dados de cartão nunca tocam o servidor

O pagamento com cartão acontece na **fatura hospedada do Asaas** (`invoiceUrl`). Nenhum
número de cartão passa por este código, por estes logs ou por este banco.

Isso mantém a plataforma no escopo **PCI DSS SAQ-A**, que é o mais leve — basicamente um
questionário anual, sem varredura trimestral de ASV. Implementar "checkout transparente"
(campos de cartão dentro do site) jogaria a operação para **SAQ-A-EP**, com exigências
bastante maiores. Não faça essa troca sem avaliar o custo.

### 1.6 Chave de API de terceiro descartada de propósito

A criação de subconta devolve uma `apiKey` da conta da profissional, e ela só aparece nessa
resposta. O código **não guarda**: o split precisa apenas do `walletId`. Guardar chave de API
de terceiro é passivo, não ativo — se o banco vazar, vazam também as contas delas.

### 1.7 Cabeçalhos de segurança

Não havia nenhum. Foram adicionados em `next.config.ts`:
`X-Frame-Options: DENY` (clickjacking sobre o botão de pagar), `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy` e `Strict-Transport-Security`.

### 1.8 Política de privacidade desatualizada (LGPD)

O cadastro passou a coletar **endereço residencial e renda** da profissional e a enviá-los à
instituição de pagamento. A política não mencionava compartilhamento com terceiros. Foi
acrescentada a seção "Com quem compartilhamos", nomeando os operadores e registrando que
dados de cartão não passam pelos nossos servidores.

### 1.9 Webhook aberto enquanto o provider é `fake`

Depois de subir, o endpoint respondia `200` a um `POST` anônimo: o provider `fake` devolvia
"evento ignorado" sem conferir nada. Não confirmava pagamento nenhum, mas contrariava a regra
de falhar fechado. O `fake` passou a recusar — ele não tem origem real de webhook, então nada
que chegue ali é legítimo.

### 1.10 Mensalidade reenviada estendia o plano duas vezes

`registrarMensalidadePaga` somava um mês a `ativaAte` a cada execução. O `upsert` da
cobrança já era idempotente, mas a extensão do plano não — um reenvio da confirmação daria
dois meses por um pagamento.

A trava de `webhook_eventos` barraria o reenvio, mas ela depende de o Asaas repetir o mesmo
id do evento. Observando os eventos entregues, o id vem como `evt_<hash>&<n>` e **dois
eventos distintos compartilharam o mesmo hash** — o discriminador é o sufixo. Não dá para
apostar só nisso numa operação de dinheiro, então a função passou a conferir se a cobrança
já está `PAGO_RETIDO` e sair cedo. Mesma defesa que `confirmarPagamentoDeServico` já tinha.

### 1.11 Rota de cron desprotegida

`/api/cron/cobrancas` devolve horário à fila e dispara cobrança. Protegida por `CRON_SECRET`
com comparação em tempo constante e falha fechada.

---

## 2. O que depende de você (fora do código)

| # | O quê | Onde |
|---|---|---|
| 1 | Abrir a conta Asaas e validar os documentos da empresa | asaas.com |
| 2 | Gerar a chave de API de **sandbox** e testar tudo antes de produção | Asaas › Integrações › API |
| 3 | ~~Criar o webhook~~ **feito** — `d8962da0-f81f-4097-8ca3-d58d701c6560` (sandbox) | Asaas › Integrações › Webhooks |
| 4 | ~~Definir o `authToken`~~ **feito** — 48 caracteres, igual ao `.env` | mesmo lugar |
| 5 | ~~Marcar o envio como SEQUENTIALLY~~ **feito** | mesmo lugar |
| 6 | Colar as variáveis na Vercel | Vercel › Settings › Environment Variables |
| 7 | Habilitar a conciliação: conferir mensalmente o extrato Asaas contra `payments` e `payouts` | — |

Variáveis a configurar na Vercel:

```
ASAAS_API_KEY=          # a chave do ambiente que for usar
ASAAS_AMBIENTE=         # sandbox enquanto testa, producao depois
ASAAS_WEBHOOK_TOKEN=    # o mesmo authToken do painel; openssl rand -hex 24
ASAAS_SPLIT=on
CRON_SECRET=            # openssl rand -hex 24
PAYMENT_PROVIDER=asaas  # deixe "fake" até os testes de sandbox passarem
```

Gere os segredos com `openssl rand -hex 24` e **não** reaproveite o mesmo valor nos dois.

> O `authToken` do webhook aparece só na resposta de criação. Guarde na hora.

**Marque o webhook como SEQUENTIALLY.** Sem isso o Asaas pode entregar o evento de estorno
antes do de confirmação, e o pagamento acabaria gravado como pago depois de estornado.

**`apiVersion` não pode ser alterado depois.** O `PUT /v3/webhooks/{id}` aceita `name`, `url`,
`sendType`, `enabled`, `interrupted`, `authToken` e `events` — a versão só existe na criação.
Trocar de v2 para v3 exige apagar e recriar, pela API ou pelo painel.

**O Asaas nunca devolve o `authToken`.** Um `GET` traz `hasAuthToken: true/false`; ler o campo
`authToken` e encontrar vazio não significa que ele não está configurado.

**Webhook de sandbox entregando em produção.** Enquanto `ASAAS_AMBIENTE=sandbox`, o site de
produção está ligado ao sandbox do Asaas: cobranças criadas lá não são dinheiro real. Antes de
abrir para clientes, trocar a chave, recriar o webhook na conta de produção e conferir que
`ASAAS_AMBIENTE=producao` na Vercel.

---

## 3. O que continua em aberto

### 3.1 Não há rate limiting em lugar nenhum — risco alto

Nem no login, nem na recuperação de senha, nem na criação de agendamento, nem no webhook.
Consequências concretas:

- **login**: credential stuffing sem nenhum freio. Hoje a tela responde a mesma mensagem para
  e-mail inexistente e senha errada, o que ajuda, mas não impede a força bruta;
- **recuperação de senha**: dá para disparar e-mail em massa a partir do seu domínio, o que
  queima a reputação do remetente no Resend;
- **agendamento**: dá para criar centenas de agendamentos e, com eles, centenas de cobranças
  no Asaas;
- **webhook**: mesmo recusando por token, cada requisição custa processamento.

Duas saídas, nesta ordem de esforço:

1. **Vercel Firewall** (painel, sem código): regra de rate limit por IP em `/login`,
   `/esqueci-senha`, `/agendar` e `/api/webhooks/*`. Resolve a maior parte em minutos.
2. **Upstash Redis + @upstash/ratelimit** nas server actions, para limitar por e-mail e não
   só por IP. É o que pega o ataque distribuído.

### 3.2 Content-Security-Policy

Os outros cabeçalhos entraram; a CSP não, porque exige mapear cada origem usada pelas telas
(fontes do Google, imagens do Supabase Storage) e testar uma a uma. Sem CSP, um XSS
hipotético teria liberdade total. Vale fazer antes de volume relevante de dinheiro.

### 3.3 O papel na sessão fica velho

A sessão é JWT. Se o admin suspender uma profissional, o token dela continua dizendo
`PROFISSIONAL` até expirar. As ações de dinheiro consultam o banco antes de agir, então o
impacto é pequeno — mas vale revalidar o status na `dal` para ações sensíveis.

### 3.4 `requireRole` deixa o ADMIN passar por qualquer papel

É proposital e conveniente, mas significa que um admin comprometido assume qualquer fluxo,
inclusive os de pagamento. Com dinheiro em jogo, considere 2FA na conta admin — e lembre que
hoje existe **um único** usuário ADMIN.

### 3.5 Estorno pode deixar a profissional com saldo negativo

Com split, o valor cai na conta dela assim que a cliente paga. Se houver estorno (cancelamento
dentro do prazo, chargeback de cartão), o Asaas reverte também o split. Se ela já tiver sacado,
o saldo dela fica negativo.

Isso não é defeito de código, é consequência do modelo. Mitigações possíveis: avisar a
profissional disso nos termos dela, e considerar liberar o saque com alguns dias de carência.

### 3.6 Chargeback de cartão não tem fluxo

O evento `PAYMENT_CHARGEBACK_REQUESTED` hoje é tratado como falha genérica. Um fluxo de
contestação (juntar comprovação do serviço, prazos) não existe. Para Pix não se aplica; para
cartão, vale construir quando o volume justificar.

### 3.7 Conciliação não é automática

Nada compara o extrato do Asaas com o que está em `payments` e `payouts`. Enquanto o volume
for baixo, conferência manual mensal resolve. Acima disso, vira relatório.

---

## 4. O teste de sandbox — feito em 25/11/2026

O fluxo fechou ponta a ponta duas vezes, contra o site de produção ligado ao sandbox:

cadastro → aprovação → **subconta Asaas criada automaticamente** → fila → aceite →
**cobrança com split** → Pix pago → webhook → `AGENDADO`.

- o `asaasWalletId` é preenchido na aprovação, sem intervenção;
- o split saiu como `fixedValue: 136` em cima de R$ 160,00 — exatamente `repasseProfissional`;
- reenvio do mesmo evento devolveu `{"recebido":true,"repetido":true}` sem reprocessar;
- `POST` sem token e com token errado devolveram `401`.

Três defeitos só apareceram rodando, e foram corrigidos:

1. **O cliente nunca tinha CPF.** O Asaas aceita criar o cliente sem documento mas recusa a
   cobrança. O aceite falhava e era desfeito, longe de quem poderia corrigir. O documento
   passou a ser pedido no agendamento.
2. **Pagar não agendava.** O webhook ficou com a lógica do fluxo antigo: marcava pago e
   chamava a fila. Ninguém colocava o serviço em `AGENDADO`. Com duas ou mais profissionais
   cadastradas, o pagamento ofereceria a outra pessoa um serviço já aceito e pago.
3. **A cliente não tinha onde pagar.** A tela mostrava só o código Pix como texto, e nada
   quando ele falta — o caso de cartão, e de qualquer Pix sem chave cadastrada no Asaas.

---

## 5. Virada para produção

A conta de sandbox e a de produção são **separadas**: nada do que foi configurado numa vale
na outra. Chave, webhook, token, split e chave Pix precisam ser refeitos.

| # | O quê | Onde |
|---|---|---|
| 1 | Conta de produção com documentos aprovados | asaas.com |
| 2 | **Habilitar split** (confirmação por SMS / Token App) | Integrações › Segurança |
| 3 | **Cadastrar a chave Pix** de recebimento — sem ela não há copia-e-cola | Minha conta › Chaves Pix |
| 4 | Gerar a chave de API de produção (`$aact_prod_…`) | Integrações › API |
| 5 | Criar o webhook **v3**, `SEQUENTIALLY`, com token novo e os 7 eventos | Integrações › Webhooks |
| 6 | Trocar `ASAAS_API_KEY`, `ASAAS_AMBIENTE=producao` e `ASAAS_WEBHOOK_TOKEN` **juntos** | Vercel › Environment Variables |
| 7 | Redeploy — variável só vale no próximo build | Vercel |
| 8 | Definir `ASSINATURA_COBRANCA_INICIO` para uma data real | /admin |

**Trocar os três juntos.** `ASAAS_AMBIENTE=producao` com a chave de sandbox ainda no lugar
derruba todas as cobranças; o contrário manda dinheiro real para o ambiente errado.

**Token do webhook novo.** O de sandbox não deve ser reaproveitado: ambientes diferentes,
segredos diferentes.

**Subcontas não migram.** Toda profissional aprovada no sandbox tem `asaasWalletId` que não
existe em produção. Profissionais reais precisam ser aprovadas depois da virada.

Depois do primeiro pagamento real, conferir no extrato do Asaas que o split creditou o valor
de `repasseProfissional` na conta dela e a comissão na da plataforma.
