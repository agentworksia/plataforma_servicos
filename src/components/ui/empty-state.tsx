export function EmptyState({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
      <p className="font-medium text-slate-800">{titulo}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{descricao}</p>
    </div>
  );
}
