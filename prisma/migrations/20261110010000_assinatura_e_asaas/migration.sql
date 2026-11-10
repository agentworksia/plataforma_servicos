-- Assinatura da profissional, conta Asaas para o split e trava de idempotência
-- dos webhooks. Tudo aditivo: nenhuma coluna existente muda de tipo ou sai.

-- A cobrança passou a nascer no aceite da profissional (exigência do split, que precisa
-- saber a carteira de destino). Entre o aceite e o pagamento o agendamento fica neste estado.
ALTER TYPE "BookingStatus" ADD VALUE 'AGUARDANDO_PAGAMENTO';

ALTER TABLE "bookings"
  ADD COLUMN "pagamentoExpiraEm" TIMESTAMP(3),
  ADD COLUMN "metodoPagamento" "PaymentMethod" NOT NULL DEFAULT 'PIX';

CREATE TYPE "PlanoAssinatura" AS ENUM ('MENSAL', 'ANUAL');
CREATE TYPE "StatusAssinatura" AS ENUM ('PENDENTE', 'ATIVA', 'ATRASADA', 'CANCELADA');

ALTER TABLE "professional_profiles"
  ADD COLUMN "asaasAccountId" TEXT,
  ADD COLUMN "asaasWalletId"  TEXT,
  ADD COLUMN "cep"            TEXT,
  ADD COLUMN "logradouro"     TEXT,
  ADD COLUMN "numeroEnd"      TEXT,
  ADD COLUMN "complemento"    TEXT,
  ADD COLUMN "bairro"         TEXT,
  ADD COLUMN "cidade"         TEXT,
  ADD COLUMN "uf"             TEXT,
  ADD COLUMN "rendaMensal"    INTEGER;

-- Sem isso o reenvio de um webhook de pagamento cria um segundo registro.
CREATE UNIQUE INDEX "payments_providerId_key" ON "payments"("providerId");

CREATE TABLE "assinaturas" (
  "id"              TEXT NOT NULL,
  "professionalId"  TEXT NOT NULL,
  "plano"           "PlanoAssinatura" NOT NULL,
  "status"          "StatusAssinatura" NOT NULL DEFAULT 'PENDENTE',
  "metodo"          "PaymentMethod" NOT NULL,
  "valorCentavos"   INTEGER NOT NULL,
  "provider"        TEXT NOT NULL DEFAULT 'fake',
  "providerId"      TEXT,
  "checkoutUrl"     TEXT,
  "pixCopiaCola"    TEXT,
  "ativaAte"        TIMESTAMP(3),
  "proximaCobranca" TIMESTAMP(3),
  "canceladaEm"     TIMESTAMP(3),
  "criadoEm"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assinaturas_professionalId_key" ON "assinaturas"("professionalId");
CREATE UNIQUE INDEX "assinaturas_providerId_key" ON "assinaturas"("providerId");
CREATE INDEX "assinaturas_status_idx" ON "assinaturas"("status");
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "assinatura_cobrancas" (
  "id"           TEXT NOT NULL,
  "assinaturaId" TEXT NOT NULL,
  "providerId"   TEXT,
  "valor"        INTEGER NOT NULL,
  "status"       "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
  "vencimento"   DATE NOT NULL,
  "pagoEm"       TIMESTAMP(3),
  "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assinatura_cobrancas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assinatura_cobrancas_providerId_key" ON "assinatura_cobrancas"("providerId");
CREATE INDEX "assinatura_cobrancas_assinaturaId_idx" ON "assinatura_cobrancas"("assinaturaId");
ALTER TABLE "assinatura_cobrancas" ADD CONSTRAINT "assinatura_cobrancas_assinaturaId_fkey"
  FOREIGN KEY ("assinaturaId") REFERENCES "assinaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "webhook_eventos" (
  "id"         TEXT NOT NULL,
  "provider"   TEXT NOT NULL,
  "eventoId"   TEXT NOT NULL,
  "tipo"       TEXT NOT NULL,
  "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "webhook_eventos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "webhook_eventos_provider_eventoId_key" ON "webhook_eventos"("provider", "eventoId");
