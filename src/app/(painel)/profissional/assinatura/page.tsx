import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import {
  assinaturaDaProfissional,
  cobrancaJaValendo,
  descontoAnualPct,
  economiaAnualCentavos,
  estaEmDia,
  inicioDaCobranca,
  LISTA_PLANOS,
  PLANOS,
} from "@/lib/assinaturas";
import { formatBRL, formatData } from "@/lib/format";
import { EscolhaDePlano } from "./escolha-de-plano";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { cancelarAssinatura } from "@/lib/assinaturas/actions";
import { getSettingNumber } from "@/lib/settings";

export const metadata: Metadata = { title: "Plano" };

export default async function AssinaturaPage() {
  const user = await requireRole("PROFISSIONAL");
  const perfil = await db.professionalProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, asaasWalletId: true },
  });
  if (!perfil) return null;

  const assinatura = await assinaturaDaProfissional(perfil.id);
  const emDia = estaEmDia(assinatura);
  const exigindo = await cobrancaJaValendo();
  const inicio = await inicioDaCobranca();
  const taxaPct = await getSettingNumber("TAXA_PLATAFORMA_PCT", 15);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-secao text-2xl text-marinho-900">Seu plano</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-areia-600">
          A mensalidade é o que mantém seu perfil recebendo ofertas. O valor do serviço continua
          sendo seu: a plataforma fica com {taxaPct}% de cada diária, e o resto cai direto na sua conta
          assim que a cliente paga.
        </p>
      </header>

      {/* Situação atual ----------------------------------------------------- */}
      <section className="rounded-cartao border border-areia-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-areia-600">Situação</p>
            <p className="titulo-secao mt-1 text-xl text-marinho-900">
              {assinatura ? PLANOS[assinatura.plano].nome : "Sem plano"}
            </p>
          </div>
          <Badge cor={emDia ? "verde" : "amarelo"}>
            {emDia ? "Em dia" : assinatura?.status === "PENDENTE" ? "Aguardando pagamento" : "Sem acesso"}
          </Badge>
        </div>

        {assinatura?.ativaAte && (
          <p className="mt-4 text-sm text-areia-600">
            Acesso pago até <strong>{formatData(assinatura.ativaAte)}</strong>.
          </p>
        )}

        {!emDia && !exigindo && (
          <p className="mt-4 rounded-botao bg-areia-50 p-3 text-sm leading-relaxed text-areia-700">
            Você continua recebendo ofertas normalmente até{" "}
            <strong>{formatData(inicio)}</strong>. A partir dessa data, só quem estiver com o plano
            em dia entra na fila.
          </p>
        )}

        {!emDia && exigindo && (
          <p className="mt-4 rounded-botao bg-laranja-50 p-3 text-sm leading-relaxed text-laranja-700">
            Sem plano em dia seu perfil não entra na fila de ofertas. Assine abaixo para voltar a
            receber serviços.
          </p>
        )}

        {!perfil.asaasWalletId && (
          <p className="mt-3 rounded-botao bg-areia-50 p-3 text-sm leading-relaxed text-areia-700">
            Sua conta de recebimento ainda está sendo aberta. Enquanto ela não sai, o pagamento dos
            serviços não tem para onde ir — a equipe resolve isso junto com a aprovação do cadastro.
          </p>
        )}

        {/* Cobrança em aberto ---------------------------------------------- */}
        {assinatura && !emDia && (assinatura.pixCopiaCola || assinatura.checkoutUrl) && (
          <div className="mt-5 rounded-botao border border-marinho-200 bg-marinho-50 p-4">
            <p className="text-sm font-medium text-marinho-900">Cobrança em aberto</p>
            {assinatura.checkoutUrl && (
              <a
                href={assinatura.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-medium text-marinho-700 underline underline-offset-2"
              >
                Abrir a fatura para pagar
              </a>
            )}
            {assinatura.pixCopiaCola && (
              <div className="mt-3">
                <p className="text-xs text-marinho-800">Pix copia e cola:</p>
                <code className="mt-1 block overflow-x-auto rounded bg-white p-2 text-xs text-areia-800">
                  {assinatura.pixCopiaCola}
                </code>
              </div>
            )}
          </div>
        )}

        {assinatura && assinatura.status !== "CANCELADA" && (
          <ActionForm
            action={cancelarAssinatura}
            className="mt-5"
            submitLabel="Cancelar plano"
            pendingLabel="Cancelando…"
            variant="outline"
            size="sm"
            confirm="Cancelar o plano? Você recebe ofertas até o fim do período já pago."
          />
        )}
      </section>

      {/* Escolha do plano --------------------------------------------------- */}
      <section className="rounded-cartao border border-areia-200 bg-white p-5 sm:p-6">
        <h2 className="titulo-secao text-lg text-marinho-900">
          {assinatura ? "Trocar de plano" : "Escolher um plano"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-areia-600">
          No anual você paga {descontoAnualPct()}% a menos por mês e economiza{" "}
          {formatBRL(economiaAnualCentavos())} no ano, em 12 parcelas no cartão de crédito. O
          mensal é cobrado mês a mês, no cartão ou no Pix, e você cancela quando quiser.
        </p>
        <EscolhaDePlano planos={LISTA_PLANOS} atual={assinatura?.plano ?? null} />
      </section>
    </div>
  );
}
