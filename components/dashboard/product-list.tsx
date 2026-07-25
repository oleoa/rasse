"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import { imageUrl, isUnoptimized } from "@/lib/images";
import { bulkUpdateStatus } from "@/lib/mutations/products";
import type { Category } from "@/db/schema";

type Linha = {
  id: string;
  slug: string;
  name: string;
  status: "draft" | "published" | "archived";
  priceType: "fixed" | "on_request";
  priceCents: number | null;
  isFeatured: boolean;
  category: { name: string } | null;
  images: Array<{ r2Key: string; alt: string }>;
};

const ESTADO_BADGE = {
  published: { variant: "success" as const, label: "Publicado" },
  draft: { variant: "secondary" as const, label: "Rascunho" },
  archived: { variant: "ghost" as const, label: "Arquivado" },
};

export function ProductList({
  linhas,
  categories,
  pagina,
  paginas,
  total,
  filtros,
}: {
  linhas: Linha[];
  categories: Category[];
  pagina: number;
  paginas: number;
  total: number;
  filtros: { q: string; status: string; categoria: string };
}) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  function navegar(mudancas: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) params.set(chave, valor);
      else params.delete(chave);
    }
    if (!("pagina" in mudancas)) params.delete("pagina");
    router.push(`/dashboard/produtos?${params.toString()}`);
  }

  function acaoEmMassa(action: "publish" | "archive" | "draft") {
    if (selecionados.length === 0) return;
    setErro(null);
    iniciar(async () => {
      const r = await bulkUpdateStatus({ ids: selecionados, action });
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      setSelecionados([]);
      router.refresh();
    });
  }

  const todosSelecionados = linhas.length > 0 && selecionados.length === linhas.length;

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const dados = new FormData(e.currentTarget);
          navegar({ q: String(dados.get("q") ?? "") });
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex min-w-52 flex-1 flex-col gap-1">
          <Label htmlFor="busca">Pesquisar</Label>
          <Input id="busca" name="q" defaultValue={filtros.q} placeholder="Nome ou endereço" />
        </div>

        <div className="flex w-44 flex-col gap-1">
          <Label htmlFor="filtro-estado">Estado</Label>
          <select
            id="filtro-estado"
            value={filtros.status}
            onChange={(e) => navegar({ status: e.target.value })}
            className="rounded-sm border border-input bg-char-700 px-3.5 py-2.5 font-body text-[15px] text-body outline-none"
          >
            <option value="">Todos</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>

        <div className="flex w-52 flex-col gap-1">
          <Label htmlFor="filtro-categoria">Categoria</Label>
          <select
            id="filtro-categoria"
            value={filtros.categoria}
            onChange={(e) => navegar({ categoria: e.target.value })}
            className="rounded-sm border border-input bg-char-700 px-3.5 py-2.5 font-body text-[15px] text-body outline-none"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" size="sm">
          Filtrar
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/produtos">Limpar</Link>
        </Button>
      </form>

      {selecionados.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3">
          <span className="text-small text-body">
            {selecionados.length} selecionado{selecionados.length === 1 ? "" : "s"}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={pendente}
            onClick={() => acaoEmMassa("publish")}
          >
            Publicar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pendente}
            onClick={() => acaoEmMassa("archive")}
          >
            Arquivar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pendente}
            onClick={() => acaoEmMassa("draft")}
          >
            Voltar a rascunho
          </Button>
        </div>
      ) : null}

      {erro ? (
        <p role="alert" className="text-small text-danger">
          {erro}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={todosSelecionados}
                  aria-label="Selecionar todos"
                  onChange={(e) => setSelecionados(e.target.checked ? linhas.map((l) => l.id) : [])}
                  className="size-4 accent-brand"
                />
              </th>
              {["Produto", "Categoria", "Preço", "Estado"].map((t) => (
                <th
                  key={t}
                  className="p-3 font-accent text-eyebrow tracking-caps text-subtle uppercase"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => {
              const capa = linha.images[0];
              const badge = ESTADO_BADGE[linha.status];

              return (
                <tr key={linha.id} className="border-b border-border hover:bg-card">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(linha.id)}
                      aria-label={`Selecionar ${linha.name}`}
                      onChange={(e) =>
                        setSelecionados((s) =>
                          e.target.checked ? [...s, linha.id] : s.filter((x) => x !== linha.id),
                        )
                      }
                      className="size-4 accent-brand"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-char-700">
                        {capa ? (
                          <Image
                            src={imageUrl(capa.r2Key)}
                            alt=""
                            fill
                            unoptimized={isUnoptimized(capa.r2Key)}
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/produtos/${linha.id}`}
                          className="block truncate text-display hover:text-copper-300"
                        >
                          {linha.name}
                        </Link>
                        <span className="block truncate text-small text-subtle">/{linha.slug}</span>
                      </div>
                      {linha.isFeatured ? <Badge>Destaque</Badge> : null}
                    </div>
                  </td>
                  <td className="p-3 text-small text-subtle">{linha.category?.name ?? "—"}</td>
                  <td className="p-3 text-small text-body">
                    {linha.priceType === "on_request" || linha.priceCents === null
                      ? "Sob consulta"
                      : formatBRL(linha.priceCents)}
                  </td>
                  <td className="p-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-subtle">
          {total} produto{total === 1 ? "" : "s"} · página {pagina} de {paginas}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pagina <= 1}
            onClick={() => navegar({ pagina: String(pagina - 1) })}
          >
            Anterior
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pagina >= paginas}
            onClick={() => navegar({ pagina: String(pagina + 1) })}
          >
            Seguinte
          </Button>
        </div>
      </div>
    </div>
  );
}
