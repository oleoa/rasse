"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATUS_LABEL } from "@/lib/request-status";

export function RequestFilters({
  base,
  filtros,
  placeholder,
}: {
  base: string;
  filtros: { q: string; status: string };
  placeholder: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navegar(mudancas: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) params.set(chave, valor);
      else params.delete(chave);
    }
    if (!("pagina" in mudancas)) params.delete("pagina");
    router.push(`${base}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navegar({ q: String(new FormData(e.currentTarget).get("q") ?? "") });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex min-w-52 flex-1 flex-col gap-1">
        <Label htmlFor="busca-pedido">Pesquisar</Label>
        <Input id="busca-pedido" name="q" defaultValue={filtros.q} placeholder={placeholder} />
      </div>

      <div className="flex w-44 flex-col gap-1">
        <Label htmlFor="filtro-estado-pedido">Estado</Label>
        <select
          id="filtro-estado-pedido"
          value={filtros.status}
          onChange={(e) => navegar({ status: e.target.value })}
          className="rounded-sm border border-input bg-char-700 px-3.5 py-2.5 font-body text-[15px] text-body outline-none"
        >
          <option value="">Todos</option>
          {(["novo", "contactado", "fechado", "perdido"] as const).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="sm">
        Filtrar
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={base}>Limpar</Link>
      </Button>
    </form>
  );
}

export function Paginacao({
  base,
  pagina,
  paginas,
  total,
  rotulo,
}: {
  base: string;
  pagina: number;
  paginas: number;
  total: number;
  rotulo: string;
}) {
  const searchParams = useSearchParams();

  function href(destino: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagina", String(destino));
    return `${base}?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-small text-subtle">
        {total} {rotulo} · página {pagina} de {paginas}
      </p>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline" disabled={pagina <= 1}>
          <Link href={href(Math.max(1, pagina - 1))}>Anterior</Link>
        </Button>
        <Button asChild size="sm" variant="outline" disabled={pagina >= paginas}>
          <Link href={href(Math.min(paginas, pagina + 1))}>Seguinte</Link>
        </Button>
      </div>
    </div>
  );
}
