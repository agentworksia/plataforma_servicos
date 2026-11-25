import { LISTA_PLANOS, descontoAnualPct } from "@/lib/assinaturas/planos";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Mensalidade da profissional, mostrada antes do cadastro. Só a profissional paga:
 * para a cliente que contrata o serviço não existe mensalidade nenhuma.
 */
export function PlanosResumo({ taxaPct, className }: { taxaPct: number; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-cartao border border-marinho-200 bg-marinho-50 p-5 sm:p-6",
        className,
      )}
    >
      <h2 className="titulo-secao text-lg text-marinho-900">Quanto custa para você</h2>
      <p className="mt-1 text-sm leading-relaxed text-areia-700">
        O cadastro é gratuito. Depois de aprovada, é a mensalidade que mantém seu perfil
        recebendo ofertas.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {LISTA_PLANOS.map((p) => (
          <div key={p.id} className="rounded-botao border border-marinho-200 bg-white p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-areia-800">{p.nome}</span>
              {p.id === "ANUAL" && (
                <span className="rounded-full bg-laranja-100 px-2 py-0.5 text-xs font-medium text-laranja-700">
                  −{descontoAnualPct()}%
                </span>
              )}
            </div>
            <p className="numeros titulo mt-1 text-2xl text-marinho-900">
              {formatBRL(p.valorCentavos)}
              <span className="text-sm font-normal text-areia-600">/mês</span>
            </p>
            <p className="mt-1 text-sm leading-relaxed text-areia-600">{p.detalhe}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-areia-700">
        Além da mensalidade, a plataforma fica com <strong>{taxaPct}%</strong> de cada serviço. O
        resto é seu e cai na sua conta quando a cliente paga.
      </p>
    </section>
  );
}
