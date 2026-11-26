-- Repasse por regra de preço: praça e tipo de serviço têm margens diferentes.
-- NULL mantém o comportamento atual (Setting.TAXA_PLATAFORMA_PCT vale para a regra).
ALTER TABLE "pricing_rules" ADD COLUMN IF NOT EXISTS "repassePct" DECIMAL(5,2);
