import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Diz de quem é o cadastro antes do primeiro campo, e oferece a troca ali mesmo.
 * Existe porque alguém preencheu a conta de cliente querendo ser diarista: as duas
 * telas começavam iguais, e o aviso de "não é você?" ficava no rodapé.
 */
export function CabecalhoCadastro({
  papel,
  titulo,
  descricao,
  outroTexto,
  outroHref,
}: {
  papel: "cliente" | "profissional";
  titulo: string;
  descricao: string;
  outroTexto: string;
  outroHref: string;
}) {
  const ehCliente = papel === "cliente";

  return (
    <div>
      <span
        className={cn(
          "inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
          ehCliente ? "bg-marinho-100 text-marinho-800" : "bg-laranja-100 text-laranja-700",
        )}
      >
        {ehCliente ? "Cadastro de cliente" : "Cadastro de profissional"}
      </span>

      <h1 className="titulo-secao mt-3 text-xl text-areia-900">{titulo}</h1>
      <p className="mt-1 text-sm leading-relaxed text-areia-600">{descricao}</p>

      <p className="mt-3 rounded-botao border border-areia-200 bg-areia-50 p-3 text-sm leading-relaxed text-areia-700">
        {outroTexto}{" "}
        <Link href={outroHref} className="font-medium text-marinho-700 underline underline-offset-2">
          Trocar para o outro cadastro
        </Link>
      </p>
    </div>
  );
}
