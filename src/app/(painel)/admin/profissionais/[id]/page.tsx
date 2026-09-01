import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { BUCKET, urlAssinada, type BucketName } from "@/lib/storage";
import { formatData } from "@/lib/format";
import { STATUS_PROFISSIONAL } from "@/lib/professionals";
import { TIPOS_CHAVE_PIX, TIPOS_SERVICO } from "@/lib/validation/profissional";
import { Badge } from "@/components/ui/badge";
import { AcoesProfissional } from "./acoes";

export const metadata: Metadata = { title: "Profissional" };

const LABEL_TIPO = Object.fromEntries(TIPOS_SERVICO.map((t) => [t.value, t.label]));
const LABEL_PIX = Object.fromEntries(TIPOS_CHAVE_PIX.map((t) => [t.value, t.label]));

async function assinar(bucket: BucketName, path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    return await urlAssinada(bucket, path, 300);
  } catch {
    return null;
  }
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{rotulo}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default async function ProfissionalDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;

  const p = await db.professionalProfile.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      bio: true,
      cpf: true,
      dataNascimento: true,
      tiposServico: true,
      repassePixTipo: true,
      repassePixChave: true,
      fotoUrl: true,
      aprovadoEm: true,
      motivoReprovacao: true,
      criadoEm: true,
      user: { select: { name: true, email: true, telefone: true } },
      areas: { select: { serviceArea: { select: { cidade: true, bairro: true } } } },
      documentos: { select: { id: true, tipo: true, storagePath: true, nomeArquivo: true, enviadoEm: true } },
    },
  });
  if (!p) notFound();

  const st = STATUS_PROFISSIONAL[p.status];
  const fotoUrl = await assinar(BUCKET.perfil, p.fotoUrl);
  const docs = await Promise.all(
    p.documentos.map(async (d) => ({ ...d, url: await assinar(BUCKET.documentos, d.storagePath) })),
  );
  const cpfFmt = p.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") ?? "—";

  return (
    <section className="space-y-6">
      <div>
        <Link href="/admin/profissionais" className="text-sm text-teal-700 hover:underline">
          ← Profissionais
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{p.user.name ?? "—"}</h1>
          <Badge cor={st.cor}>{st.label}</Badge>
        </div>
        <p className="text-slate-600">
          {p.user.email} · {p.user.telefone ?? "sem telefone"} · cadastro em {formatData(p.criadoEm)}
        </p>
      </div>

      {p.status === "REPROVADA" && p.motivoReprovacao && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <strong>Motivo da reprovação:</strong> {p.motivoReprovacao}
        </p>
      )}
      {p.status === "APROVADA" && p.aprovadoEm && (
        <p className="text-sm text-slate-500">Aprovada em {formatData(p.aprovadoEm)}.</p>
      )}

      <div className="rounded-xl border border-slate-200 p-5">
        <AcoesProfissional id={p.id} status={p.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="CPF">{cpfFmt}</Campo>
            <Campo rotulo="Nascimento">{p.dataNascimento ? formatData(p.dataNascimento) : "—"}</Campo>
            <Campo rotulo="Tipos de serviço">
              {p.tiposServico.map((t) => LABEL_TIPO[t] ?? t).join(", ") || "—"}
            </Campo>
            <Campo rotulo="Repasse (Pix)">
              {p.repassePixTipo ? `${LABEL_PIX[p.repassePixTipo] ?? p.repassePixTipo}: ${p.repassePixChave}` : "—"}
            </Campo>
            <div className="sm:col-span-2">
              <Campo rotulo="Regiões que atende">
                {[...new Set(p.areas.map((a) => a.serviceArea.cidade))].join(", ") || "—"}
              </Campo>
            </div>
            <div className="sm:col-span-2">
              <Campo rotulo="Bio">{p.bio || "—"}</Campo>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Foto de perfil</p>
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt="Foto de perfil" className="mt-2 w-full rounded-lg border border-slate-200" />
            ) : (
              <p className="mt-2 text-sm text-slate-400">Indisponível</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Documentos</p>
            <ul className="mt-2 space-y-1 text-sm">
              {docs.length === 0 && <li className="text-slate-400">Nenhum documento enviado.</li>}
              {docs.map((d) => (
                <li key={d.id}>
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                      {d.nomeArquivo ?? d.tipo}
                    </a>
                  ) : (
                    <span className="text-slate-400">{d.nomeArquivo ?? d.tipo} (indisponível)</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-slate-400">Links expiram em 5 minutos.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
