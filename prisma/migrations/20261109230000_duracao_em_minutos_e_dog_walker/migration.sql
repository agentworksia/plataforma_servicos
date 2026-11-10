-- Dog walker vende 30 minutos, que não cabe numa coluna de horas inteiras.
-- A duração passa a ser guardada em minutos, como já era o horário da agenda.
-- Renomeia a coluna e converte os valores existentes; nada é recriado, nada se perde.

ALTER TYPE "ServiceType" ADD VALUE 'DOG_WALKER';

ALTER TABLE "pricing_rules" RENAME COLUMN "duracaoHoras" TO "duracaoMinutos";
UPDATE "pricing_rules" SET "duracaoMinutos" = "duracaoMinutos" * 60;
ALTER INDEX "pricing_rules_tipoServico_duracaoHoras_serviceAreaId_key"
  RENAME TO "pricing_rules_tipoServico_duracaoMinutos_serviceAreaId_key";

ALTER TABLE "booking_series" RENAME COLUMN "duracaoHoras" TO "duracaoMinutos";
UPDATE "booking_series" SET "duracaoMinutos" = "duracaoMinutos" * 60;

ALTER TABLE "bookings" RENAME COLUMN "duracaoHoras" TO "duracaoMinutos";
UPDATE "bookings" SET "duracaoMinutos" = "duracaoMinutos" * 60;
