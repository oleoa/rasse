"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarkdownEditor } from "@/components/dashboard/markdown-editor";
import { ProductImages, type ImageDraft } from "@/components/dashboard/product-images";
import { ProductVariants, type VariantDraft } from "@/components/dashboard/product-variants";
import { CopperRule } from "@/components/public/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteProduct, saveProduct } from "@/lib/mutations/products";
import { slugify, slugifyWhileTyping } from "@/lib/slug";
import { productSchema, seoWarnings } from "@/lib/validation/product";
import type { Category } from "@/db/schema";

export type ProductDraft = {
  id: string | null;
  name: string;
  slug: string;
  shortDescription: string;
  descriptionMd: string;
  categoryId: string | null;
  priceType: "fixed" | "on_request";
  priceReais: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  position: number;
  allowsPersonalization: boolean;
  personalizationLabel: string;
  personalizationHelp: string;
  variantGroupLabel: string;
  seoTitle: string;
  seoDescription: string;
};

const ESTADOS = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
] as const;

function Campo({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-small text-subtle">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ProductForm({
  inicial,
  categories,
  imagensIniciais,
  variantesIniciais,
  previewUrl,
  novoProductId,
}: {
  inicial: ProductDraft;
  categories: Category[];
  imagensIniciais: ImageDraft[];
  variantesIniciais: VariantDraft[];
  previewUrl: string | null;
  /** Id gerado no servidor para agrupar as imagens de um produto ainda não gravado. */
  novoProductId: string;
}) {
  const [valores, setValores] = useState<ProductDraft>(inicial);
  const [imagens, setImagens] = useState<ImageDraft[]>(imagensIniciais);
  const [variantes, setVariantes] = useState<VariantDraft[]>(variantesIniciais);
  const [slugTocado, setSlugTocado] = useState(inicial.id !== null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  const id = useId();

  const alterar = (mudanca: Partial<ProductDraft>) => {
    setValores((v) => ({ ...v, ...mudanca }));
    setGuardado(false);
  };

  const precoCents =
    valores.priceType === "on_request" ? null : Math.round(Number(valores.priceReais || 0) * 100);

  const avisos = seoWarnings({
    seoTitle: valores.seoTitle.trim() || null,
    seoDescription: valores.seoDescription.trim() || null,
    name: valores.name,
    shortDescription: valores.shortDescription,
  });

  function submeter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErros({});
    setErroGeral(null);

    const semAlt = imagens.findIndex((i) => i.alt.trim().length === 0);
    if (semAlt >= 0) {
      setErroGeral(`A imagem ${semAlt + 1} está sem texto alternativo.`);
      return;
    }

    const candidato = {
      name: valores.name,
      slug: valores.slug,
      shortDescription: valores.shortDescription,
      descriptionMd: valores.descriptionMd,
      categoryId: valores.categoryId,
      priceType: valores.priceType,
      priceCents: precoCents,
      status: valores.status,
      isFeatured: valores.isFeatured,
      position: valores.position,
      allowsPersonalization: valores.allowsPersonalization,
      personalizationLabel: valores.personalizationLabel,
      personalizationHelp: valores.personalizationHelp,
      variantGroupLabel: valores.variantGroupLabel,
      seoTitle: valores.seoTitle,
      seoDescription: valores.seoDescription,
    };

    // Mesmo schema que a Server Action vai correr — o erro aparece no campo.
    const parsed = productSchema.safeParse(candidato);
    if (!parsed.success) {
      const mapa: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const campo = issue.path.filter((p) => typeof p === "string").join(".");
        if (campo && !mapa[campo]) mapa[campo] = issue.message;
      }
      setErros(mapa);
      setErroGeral("Corrige os campos assinalados.");
      return;
    }

    iniciar(async () => {
      const resultado = await saveProduct({
        id: valores.id,
        product: candidato,
        variants: variantes,
        images: imagens.map(({ id: imagemId, r2Key, alt, width, height }) => ({
          id: imagemId,
          r2Key,
          alt,
          width,
          height,
        })),
      });

      if (!resultado.ok) {
        if (resultado.field) setErros({ [resultado.field]: resultado.error });
        setErroGeral(resultado.error);
        return;
      }

      setGuardado(true);

      if (!valores.id) {
        router.replace(`/dashboard/produtos/${resultado.data.id}`);
      }
      router.refresh();
    });
  }

  function apagar() {
    if (!valores.id) return;
    iniciar(async () => {
      const resultado = await deleteProduct(valores.id);
      if (!resultado.ok) {
        setErroGeral(resultado.error);
        return;
      }
      router.push("/dashboard/produtos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submeter} className="flex max-w-4xl flex-col gap-10">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h2 className="font-display text-h3 font-bold text-display">Identificação</h2>
        </div>

        <Campo label="Nome" htmlFor={`${id}-nome`} error={erros.name}>
          <Input
            id={`${id}-nome`}
            value={valores.name}
            maxLength={120}
            aria-invalid={!!erros.name}
            onChange={(e) =>
              alterar({
                name: e.target.value,
                ...(slugTocado ? {} : { slug: slugify(e.target.value) }),
              })
            }
          />
        </Campo>

        <Campo
          label="Endereço (slug)"
          htmlFor={`${id}-slug`}
          error={erros.slug}
          hint={`Fica em /produtos/${valores.slug || "…"}`}
        >
          <Input
            id={`${id}-slug`}
            value={valores.slug}
            maxLength={80}
            aria-invalid={!!erros.slug}
            onChange={(e) => {
              setSlugTocado(true);
              alterar({ slug: slugifyWhileTyping(e.target.value) });
            }}
            onBlur={(e) => alterar({ slug: slugify(e.target.value) })}
          />
        </Campo>

        <Campo label="Descrição curta" htmlFor={`${id}-curta`} error={erros.shortDescription}>
          <Input
            id={`${id}-curta`}
            value={valores.shortDescription}
            maxLength={200}
            aria-invalid={!!erros.shortDescription}
            onChange={(e) => alterar({ shortDescription: e.target.value })}
          />
        </Campo>

        <Campo label="Descrição" htmlFor={`${id}-md`} error={erros.descriptionMd}>
          <MarkdownEditor
            id={`${id}-md`}
            value={valores.descriptionMd}
            invalid={!!erros.descriptionMd}
            onChange={(v) => alterar({ descriptionMd: v })}
          />
        </Campo>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h2 className="font-display text-h3 font-bold text-display">Catálogo</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo label="Categoria" htmlFor={`${id}-categoria`} error={erros.categoryId}>
            <select
              id={`${id}-categoria`}
              value={valores.categoryId ?? ""}
              onChange={(e) => alterar({ categoryId: e.target.value || null })}
              className="w-full rounded-sm border border-input bg-char-700 px-3.5 py-2.5 font-body text-[15px] text-body outline-none focus-visible:border-copper-500 focus-visible:shadow-(--focus-ring)"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Estado" htmlFor={`${id}-estado`}>
            <select
              id={`${id}-estado`}
              value={valores.status}
              onChange={(e) => alterar({ status: e.target.value as ProductDraft["status"] })}
              className="w-full rounded-sm border border-input bg-char-700 px-3.5 py-2.5 font-body text-[15px] text-body outline-none focus-visible:border-copper-500 focus-visible:shadow-(--focus-ring)"
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Tipo de preço" htmlFor={`${id}-tipo`}>
            <select
              id={`${id}-tipo`}
              value={valores.priceType}
              onChange={(e) =>
                alterar({
                  priceType: e.target.value as "fixed" | "on_request",
                  ...(e.target.value === "on_request" ? { priceReais: "" } : {}),
                })
              }
              className="w-full rounded-sm border border-input bg-char-700 px-3.5 py-2.5 font-body text-[15px] text-body outline-none focus-visible:border-copper-500 focus-visible:shadow-(--focus-ring)"
            >
              <option value="fixed">Preço fixo</option>
              <option value="on_request">Sob consulta</option>
            </select>
          </Campo>

          {valores.priceType === "fixed" ? (
            <Campo label="Preço (R$)" htmlFor={`${id}-preco`} error={erros.priceCents}>
              <Input
                id={`${id}-preco`}
                type="number"
                step="0.01"
                min="0"
                value={valores.priceReais}
                aria-invalid={!!erros.priceCents}
                onChange={(e) => alterar({ priceReais: e.target.value })}
              />
            </Campo>
          ) : null}

          <Campo label="Ordem" htmlFor={`${id}-posicao`} hint="Menor aparece primeiro.">
            <Input
              id={`${id}-posicao`}
              type="number"
              min="0"
              value={valores.position}
              onChange={(e) => alterar({ position: Number(e.target.value || 0) })}
            />
          </Campo>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={valores.isFeatured}
            onChange={(e) => alterar({ isFeatured: e.target.checked })}
            className="size-4 accent-brand"
          />
          <span className="text-small text-body">Mostrar em destaque na home</span>
        </label>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h2 className="font-display text-h3 font-bold text-display">Personalização</h2>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={valores.allowsPersonalization}
            onChange={(e) => alterar({ allowsPersonalization: e.target.checked })}
            className="size-4 accent-brand"
          />
          <span className="text-small text-body">Este produto aceita um texto do cliente</span>
        </label>

        {valores.allowsPersonalization ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              label="Rótulo do campo"
              htmlFor={`${id}-plabel`}
              error={erros.personalizationLabel}
              hint="Ex: Texto para gravação"
            >
              <Input
                id={`${id}-plabel`}
                value={valores.personalizationLabel}
                maxLength={80}
                aria-invalid={!!erros.personalizationLabel}
                onChange={(e) => alterar({ personalizationLabel: e.target.value })}
              />
            </Campo>
            <Campo label="Ajuda" htmlFor={`${id}-phelp`} hint="Ex: Máx. 30 caracteres">
              <Input
                id={`${id}-phelp`}
                value={valores.personalizationHelp}
                maxLength={120}
                onChange={(e) => alterar({ personalizationHelp: e.target.value })}
              />
            </Campo>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h2 className="font-display text-h3 font-bold text-display">Variantes</h2>
        </div>

        {variantes.length > 0 ? (
          <Campo
            label="Nome do grupo"
            htmlFor={`${id}-vgroup`}
            hint="Ex: Tamanho. É o que aparece por cima das opções."
          >
            <Input
              id={`${id}-vgroup`}
              value={valores.variantGroupLabel}
              maxLength={40}
              onChange={(e) => alterar({ variantGroupLabel: e.target.value })}
            />
          </Campo>
        ) : null}

        <ProductVariants
          variants={variantes}
          basePriceCents={precoCents}
          onChange={(v) => {
            setVariantes(v);
            setGuardado(false);
          }}
        />
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h2 className="font-display text-h3 font-bold text-display">Imagens</h2>
        </div>

        <ProductImages
          productId={valores.id ?? novoProductId}
          images={imagens}
          onChange={(i) => {
            setImagens(i);
            setGuardado(false);
          }}
        />
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h2 className="font-display text-h3 font-bold text-display">SEO</h2>
        </div>

        <Campo
          label="Título de SEO"
          htmlFor={`${id}-seotitle`}
          hint={`Vazio usa o nome do produto. ${valores.seoTitle.length}/60`}
        >
          <Input
            id={`${id}-seotitle`}
            value={valores.seoTitle}
            maxLength={70}
            onChange={(e) => alterar({ seoTitle: e.target.value })}
          />
        </Campo>

        <Campo
          label="Descrição de SEO"
          htmlFor={`${id}-seodesc`}
          hint={`Vazio usa a descrição curta. ${valores.seoDescription.length}/155`}
        >
          <Input
            id={`${id}-seodesc`}
            value={valores.seoDescription}
            maxLength={160}
            onChange={(e) => alterar({ seoDescription: e.target.value })}
          />
        </Campo>

        {avisos.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {avisos.map((aviso) => (
              <li key={aviso} className="text-small text-warning">
                {aviso}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-success">Os textos de SEO estão em bom tamanho.</p>
        )}
      </section>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border bg-background py-4">
        <Button type="submit" size="lg" disabled={pendente}>
          {pendente ? "A guardar…" : "Guardar"}
        </Button>

        {guardado ? (
          <Badge variant="success" aria-live="polite">
            Guardado
          </Badge>
        ) : null}

        {previewUrl ? (
          <Button asChild variant="outline" size="sm">
            <a href={previewUrl} target="_blank" rel="noreferrer noopener">
              Pré-visualizar
            </a>
          </Button>
        ) : null}

        {valores.status === "published" ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/produtos/${valores.slug}`} target="_blank">
              Ver no site
            </Link>
          </Button>
        ) : null}

        {valores.id && valores.status === "draft" ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pendente}
            onClick={apagar}
          >
            Apagar rascunho
          </Button>
        ) : null}

        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/produtos">Voltar</Link>
        </Button>

        {erroGeral ? (
          <p role="alert" className="w-full text-small text-danger">
            {erroGeral}
          </p>
        ) : null}
      </div>
    </form>
  );
}
