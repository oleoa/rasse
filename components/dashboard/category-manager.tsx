"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteCategory, reorderCategories, saveCategory } from "@/lib/mutations/categories";
import { slugify, slugifyWhileTyping } from "@/lib/slug";
import type { CategoryWithCount } from "@/lib/queries/admin";

export function CategoryManager({ categorias }: { categorias: CategoryWithCount[] }) {
  const [lista, setLista] = useState(categorias);
  const [novoNome, setNovoNome] = useState("");
  const [novoSlug, setNovoSlug] = useState("");
  const [slugTocado, setSlugTocado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Qual botão disparou a ação: o useTransition é partilhado, mas o giro tem de
  // aparecer só onde o usuário clicou.
  const [emAcao, setEmAcao] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  const ocupado = (chave: string) => pendente && emAcao === chave;

  function criar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEmAcao("nova");

    iniciar(async () => {
      const r = await saveCategory({
        id: null,
        category: { name: novoNome, slug: novoSlug, position: lista.length },
      });
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      setNovoNome("");
      setNovoSlug("");
      setSlugTocado(false);
      router.refresh();
    });
  }

  function salvar(categoria: CategoryWithCount) {
    setErro(null);
    setEmAcao(categoria.id);
    iniciar(async () => {
      const r = await saveCategory({
        id: categoria.id,
        category: { name: categoria.name, slug: categoria.slug, position: categoria.position },
      });
      if (!r.ok) setErro(r.error);
      else router.refresh();
    });
  }

  function apagar(id: string) {
    setErro(null);
    iniciar(async () => {
      const r = await deleteCategory(id);
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      setLista((l) => l.filter((c) => c.id !== id));
      router.refresh();
    });
  }

  function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao;
    if (destino < 0 || destino >= lista.length) return;

    const copia = [...lista];
    const [item] = copia.splice(index, 1);
    if (item) copia.splice(destino, 0, item);
    setLista(copia.map((c, i) => ({ ...c, position: i })));

    iniciar(async () => {
      const r = await reorderCategories(copia.map((c) => c.id));
      if (!r.ok) setErro(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      {erro ? (
        <p role="alert" className="text-small text-danger">
          {erro}
        </p>
      ) : null}

      {/* Cobre também as setas e o apagar, que são só ícone e não mudam de rótulo. */}
      <span aria-live="polite" className="sr-only">
        {pendente ? "Salvando as categorias." : ""}
      </span>

      <ul className="flex flex-col gap-3">
        {lista.map((categoria, index) => (
          <li
            key={categoria.id}
            className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3"
          >
            <div className="flex min-w-40 flex-1 flex-col gap-1">
              <Label htmlFor={`cat-nome-${categoria.id}`}>Nome</Label>
              <Input
                id={`cat-nome-${categoria.id}`}
                value={categoria.name}
                maxLength={60}
                onChange={(e) =>
                  setLista((l) =>
                    l.map((c) => (c.id === categoria.id ? { ...c, name: e.target.value } : c)),
                  )
                }
              />
            </div>

            <div className="flex min-w-40 flex-1 flex-col gap-1">
              <Label htmlFor={`cat-slug-${categoria.id}`}>Endereço</Label>
              <Input
                id={`cat-slug-${categoria.id}`}
                value={categoria.slug}
                maxLength={80}
                onChange={(e) =>
                  setLista((l) =>
                    l.map((c) =>
                      c.id === categoria.id
                        ? { ...c, slug: slugifyWhileTyping(e.target.value) }
                        : c,
                    ),
                  )
                }
                onBlur={(e) =>
                  setLista((l) =>
                    l.map((c) =>
                      c.id === categoria.id ? { ...c, slug: slugify(e.target.value) } : c,
                    ),
                  )
                }
              />
            </div>

            <span className="min-w-24 pb-2.5 text-small text-subtle">
              {categoria.produtos} produto{categoria.produtos === 1 ? "" : "s"}
            </span>

            <div className="flex shrink-0 items-center gap-1 pb-1">
              <Button
                type="button"
                size="sm"
                disabled={pendente}
                carregando={ocupado(categoria.id)}
                onClick={() => salvar(categoria)}
              >
                {ocupado(categoria.id) ? "Salvando…" : "Salvar"}
              </Button>
              <button
                type="button"
                onClick={() => mover(index, -1)}
                disabled={index === 0 || pendente}
                aria-label={`Subir ${categoria.name}`}
                className="p-1 text-subtle hover:text-copper-300 disabled:opacity-30"
              >
                <ArrowUp aria-hidden="true" strokeWidth={1.5} className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => mover(index, 1)}
                disabled={index === lista.length - 1 || pendente}
                aria-label={`Descer ${categoria.name}`}
                className="p-1 text-subtle hover:text-copper-300 disabled:opacity-30"
              >
                <ArrowDown aria-hidden="true" strokeWidth={1.5} className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => apagar(categoria.id)}
                disabled={pendente || categoria.produtos > 0}
                aria-label={`Apagar ${categoria.name}`}
                title={
                  categoria.produtos > 0
                    ? "Tem produtos associados; mova-os primeiro."
                    : "Apagar categoria"
                }
                className="p-1 text-subtle hover:text-danger disabled:opacity-30"
              >
                <X aria-hidden="true" strokeWidth={1.5} className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form
        onSubmit={criar}
        className="flex flex-wrap items-end gap-3 rounded-md border border-dashed border-border p-4"
      >
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <Label htmlFor="nova-cat-nome">Nova categoria</Label>
          <Input
            id="nova-cat-nome"
            value={novoNome}
            maxLength={60}
            required
            onChange={(e) => {
              setNovoNome(e.target.value);
              if (!slugTocado) setNovoSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <Label htmlFor="nova-cat-slug">Endereço</Label>
          <Input
            id="nova-cat-slug"
            value={novoSlug}
            maxLength={80}
            required
            onChange={(e) => {
              setSlugTocado(true);
              setNovoSlug(slugifyWhileTyping(e.target.value));
            }}
            onBlur={(e) => setNovoSlug(slugify(e.target.value))}
          />
        </div>
        <Button type="submit" size="sm" disabled={pendente} carregando={ocupado("nova")}>
          {ocupado("nova") ? null : <Plus aria-hidden="true" strokeWidth={1.5} />}
          {ocupado("nova") ? "Criando…" : "Criar"}
        </Button>
      </form>
    </div>
  );
}
