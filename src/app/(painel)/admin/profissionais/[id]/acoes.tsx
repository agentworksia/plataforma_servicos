"use client";

import { useActionState } from "react";
import {
  aprovarProfissional,
  reprovarProfissional,
  reativarProfissional,
  suspenderProfissional,
  type AcaoState,
} from "@/lib/admin/professionals";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProfessionalStatus } from "@/generated/prisma/enums";

function confirmar(mensagem: string) {
  return (ev: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(mensagem)) ev.preventDefault();
  };
}

export function AcoesProfissional({ id, status }: { id: string; status: ProfessionalStatus }) {
  const [aprovarSt, aprovar, aprovando] = useActionState<AcaoState, FormData>(aprovarProfissional, undefined);
  const [reprovarSt, reprovar, reprovando] = useActionState<AcaoState, FormData>(reprovarProfissional, undefined);
  const [suspSt, suspender, suspendendo] = useActionState<AcaoState, FormData>(suspenderProfissional, undefined);
  const [reativarSt, reativar, reativando] = useActionState<AcaoState, FormData>(reativarProfissional, undefined);

  const erro = aprovarSt?.erro ?? reprovarSt?.erro ?? suspSt?.erro ?? reativarSt?.erro;
  const podeAprovar = status === "PENDENTE" || status === "REPROVADA";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        {podeAprovar && (
          <form action={aprovar}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" disabled={aprovando}>
              {aprovando ? "Aprovando…" : "Aprovar"}
            </Button>
          </form>
        )}

        {status === "PENDENTE" && (
          <details className="rounded-lg border border-slate-200">
            <summary className="cursor-pointer list-none px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Reprovar
            </summary>
            <form action={reprovar} className="space-y-2 border-t border-slate-200 p-3">
              <input type="hidden" name="id" value={id} />
              <label className="text-sm font-medium text-slate-800" htmlFor="motivo">
                Motivo da reprovação
              </label>
              <Textarea id="motivo" name="motivo" required maxLength={500} placeholder="Ex.: documento ilegível." />
              <Button type="submit" variant="danger" disabled={reprovando}>
                {reprovando ? "Enviando…" : "Confirmar reprovação"}
              </Button>
            </form>
          </details>
        )}

        {status === "APROVADA" && (
          <form action={suspender} onSubmit={confirmar("Suspender esta profissional?")}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="danger" disabled={suspendendo}>
              {suspendendo ? "Suspendendo…" : "Suspender"}
            </Button>
          </form>
        )}

        {status === "SUSPENSA" && (
          <form action={reativar}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" disabled={reativando}>
              {reativando ? "Reativando…" : "Reativar"}
            </Button>
          </form>
        )}
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}
