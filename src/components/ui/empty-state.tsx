export function EmptyState({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="rounded-cartao border border-dashed border-areia-300 bg-white p-12 text-center">
      <p className="titulo-secao text-areia-800">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-areia-500">{descricao}</p>
    </div>
  );
}
