-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENTE', 'PROFISSIONAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProfessionalStatus" AS ENUM ('PENDENTE', 'APROVADA', 'REPROVADA', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('DIARIA_PADRAO', 'PASSADORIA', 'POS_OBRA', 'CORPORATIVA');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('AVULSA', 'SEMANAL', 'QUINZENAL', 'MENSAL');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('AGUARDANDO_PROFISSIONAL', 'AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARTAO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDENTE', 'PAGO_RETIDO', 'LIBERADO', 'REEMBOLSADO', 'PARCIALMENTE_REEMBOLSADO', 'FALHOU');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDENTE', 'LIBERADO', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "AvailabilityExceptionType" AS ENUM ('BLOQUEIO', 'EXTRA');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('IDENTIDADE', 'COMPROVANTE_ENDERECO', 'CERTIDAO_ANTECEDENTES', 'OUTRO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NOVO', 'CONTATADO', 'CONVERTIDO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENTE',
    "telefone" TEXT,
    "passwordHash" TEXT,
    "aceiteTermosEm" TIMESTAMP(3),
    "aceitePrivacidadeEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "ClientType" NOT NULL DEFAULT 'PF',
    "cpf" TEXT,
    "cnpj" TEXT,
    "razaoSocial" TEXT,
    "inscricaoEstadual" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProfessionalStatus" NOT NULL DEFAULT 'PENDENTE',
    "bio" TEXT,
    "fotoUrl" TEXT,
    "cpf" TEXT,
    "dataNascimento" DATE,
    "tiposServico" "ServiceType"[],
    "repassePixTipo" TEXT,
    "repassePixChave" TEXT,
    "aprovadoEm" TIMESTAMP(3),
    "aprovadoPor" TEXT,
    "motivoReprovacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_documents" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "tipo" "DocumentType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "nomeArquivo" TEXT,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_areas" (
    "id" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "bairro" TEXT,
    "uf" TEXT NOT NULL DEFAULT 'PR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_service_areas" (
    "professionalId" TEXT NOT NULL,
    "serviceAreaId" TEXT NOT NULL,

    CONSTRAINT "professional_service_areas_pkey" PRIMARY KEY ("professionalId","serviceAreaId")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "tipoServico" "ServiceType" NOT NULL,
    "duracaoHoras" INTEGER NOT NULL,
    "serviceAreaId" TEXT NOT NULL,
    "valorBase" INTEGER NOT NULL,
    "multiplicador" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_extras" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "apelido" TEXT,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL DEFAULT 'PR',
    "referencia" TEXT,
    "metragem" INTEGER,
    "numeroComodos" INTEGER,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "inicioMin" INTEGER NOT NULL,
    "fimMin" INTEGER NOT NULL,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_exceptions" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "tipo" "AvailabilityExceptionType" NOT NULL,
    "inicioMin" INTEGER,
    "fimMin" INTEGER,
    "motivo" TEXT,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_series" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "tipoServico" "ServiceType" NOT NULL,
    "duracaoHoras" INTEGER NOT NULL,
    "recorrencia" "Recurrence" NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "inicioMin" INTEGER NOT NULL,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE,
    "titularProfessionalId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "seriesId" TEXT,
    "tipoServico" "ServiceType" NOT NULL,
    "data" DATE NOT NULL,
    "inicioMin" INTEGER NOT NULL,
    "duracaoHoras" INTEGER NOT NULL,
    "recorrencia" "Recurrence" NOT NULL DEFAULT 'AVULSA',
    "status" "BookingStatus" NOT NULL DEFAULT 'AGUARDANDO_PROFISSIONAL',
    "professionalId" TEXT,
    "valorServico" INTEGER NOT NULL,
    "valorExtras" INTEGER NOT NULL DEFAULT 0,
    "taxaPlataforma" INTEGER NOT NULL,
    "valorTotal" INTEGER NOT NULL,
    "repasseProfissional" INTEGER NOT NULL,
    "sobOrcamento" BOOLEAN NOT NULL DEFAULT false,
    "orcamentoAprovadoEm" TIMESTAMP(3),
    "observacoesCliente" TEXT,
    "concluidoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "canceladoPor" TEXT,
    "motivoCancelamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_extras" (
    "bookingId" TEXT NOT NULL,
    "extraId" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,

    CONSTRAINT "booking_extras_pkey" PRIMARY KEY ("bookingId","extraId")
);

-- CreateTable
CREATE TABLE "booking_offers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDENTE',
    "abrangeSerie" BOOLEAN NOT NULL DEFAULT false,
    "ordemFila" INTEGER NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "respondidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'fake',
    "providerId" TEXT,
    "metodo" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "valor" INTEGER NOT NULL,
    "pixCopiaCola" TEXT,
    "checkoutUrl" TEXT,
    "pagoEm" TIMESTAMP(3),
    "reembolsadoEm" TIMESTAMP(3),
    "valorReembolsado" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDENTE',
    "valor" INTEGER NOT NULL,
    "provider" TEXT,
    "providerId" TEXT,
    "observacao" TEXT,
    "liberadoEm" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "nome" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "cep" TEXT NOT NULL,
    "cidade" TEXT,
    "uf" TEXT,
    "tipoServico" "ServiceType",
    "mensagem" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NOVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_userId_key" ON "client_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_userId_key" ON "professional_profiles"("userId");

-- CreateIndex
CREATE INDEX "professional_profiles_status_idx" ON "professional_profiles"("status");

-- CreateIndex
CREATE INDEX "professional_documents_professionalId_idx" ON "professional_documents"("professionalId");

-- CreateIndex
CREATE INDEX "service_areas_ativo_idx" ON "service_areas"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "service_areas_cidade_bairro_key" ON "service_areas"("cidade", "bairro");

-- CreateIndex
CREATE INDEX "professional_service_areas_serviceAreaId_idx" ON "professional_service_areas"("serviceAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_tipoServico_duracaoHoras_serviceAreaId_key" ON "pricing_rules"("tipoServico", "duracaoHoras", "serviceAreaId");

-- CreateIndex
CREATE INDEX "addresses_clientId_idx" ON "addresses"("clientId");

-- CreateIndex
CREATE INDEX "availabilities_professionalId_diaSemana_idx" ON "availabilities"("professionalId", "diaSemana");

-- CreateIndex
CREATE INDEX "availability_exceptions_professionalId_data_idx" ON "availability_exceptions"("professionalId", "data");

-- CreateIndex
CREATE INDEX "booking_series_clientId_idx" ON "booking_series"("clientId");

-- CreateIndex
CREATE INDEX "bookings_clientId_idx" ON "bookings"("clientId");

-- CreateIndex
CREATE INDEX "bookings_professionalId_idx" ON "bookings"("professionalId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_data_idx" ON "bookings"("data");

-- CreateIndex
CREATE INDEX "booking_offers_professionalId_status_idx" ON "booking_offers"("professionalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_offers_bookingId_professionalId_key" ON "booking_offers"("bookingId", "professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bookingId_key" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_bookingId_key" ON "payouts"("bookingId");

-- CreateIndex
CREATE INDEX "payouts_professionalId_status_idx" ON "payouts"("professionalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_professionalId_idx" ON "reviews"("professionalId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_documents" ADD CONSTRAINT "professional_documents_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_service_areas" ADD CONSTRAINT "professional_service_areas_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_service_areas" ADD CONSTRAINT "professional_service_areas_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "service_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "service_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_series" ADD CONSTRAINT "booking_series_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_series" ADD CONSTRAINT "booking_series_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_series" ADD CONSTRAINT "booking_series_titularProfessionalId_fkey" FOREIGN KEY ("titularProfessionalId") REFERENCES "professional_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "booking_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_extras" ADD CONSTRAINT "booking_extras_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_extras" ADD CONSTRAINT "booking_extras_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "service_extras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_offers" ADD CONSTRAINT "booking_offers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_offers" ADD CONSTRAINT "booking_offers_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

