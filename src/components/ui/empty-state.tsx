export function EmptyState({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="rounded-cartao border border-dashed border-pedra-300 bg-white p-12 text-center">
      <p className="titulo-secao text-pedra-800">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-pedra-500">{descricao}</p>
    </div>
  );
}
