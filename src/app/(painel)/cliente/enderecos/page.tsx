import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { EmptyState } from "@/components/ui/empty-state";
import { CartaoEndereco, NovoEndereco, type Endereco } from "./endereco-form";

export const metadata: Metadata = { title: "Meus endereços" };

export default async function ClienteEnderecosPage() {
  const user = await requireRole("CLIENTE");
  const cliente = await db.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });

  const registros = cliente
    ? await db.address.findMany({
        where: { clientId: cliente.id },
        orderBy: { criadoEm: "desc" },
        select: {
          id: true,
          apelido: true,
          cep: true,
          logradouro: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          uf: true,
          referencia: true,
          _count: { select: { bookings: true, series: true } },
        },
      })
    : [];

  const enderecos: Endereco[] = registros.map(({ _count, ...e }) => ({
    ...e,
    usado: _count.bookings > 0 || _count.series > 0,
  }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo text-2xl text-marinho-900">Meus endereços</h1>
          <p className="mt-1 max-w-2xl text-areia-600">
            Os endereços salvos aqui aparecem prontos na hora de agendar.
          </p>
        </div>
        <NovoEndereco />
      </div>

      {enderecos.length === 0 ? (
        <EmptyState
          titulo="Nenhum endereço salvo"
          descricao="Adicione o endereço onde o serviço acontece. Você também pode cadastrar um novo direto no agendamento."
        />
      ) : (
        <ul className="space-y-3">
          {enderecos.map((e) => (
            <CartaoEndereco key={e.id} endereco={e} />
          ))}
        </ul>
      )}
    </section>
  );
}
