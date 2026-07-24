import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/public/price";
import { Badge } from "@/components/ui/badge";
import { imageUrl, isUnoptimized } from "@/lib/images";
import type { ProductListItem } from "@/lib/queries/products";

export function ProductCard({ product }: { product: ProductListItem }) {
  const cover = product.images[0];
  const src = cover ? imageUrl(cover.r2Key) : "";

  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-copper-600">
      <Link href={`/produtos/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-char-700">
          {cover && src ? (
            <Image
              src={src}
              alt={cover.alt}
              fill
              unoptimized={isUnoptimized(cover.r2Key)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-small text-subtle">
              sem imagem
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-h3 font-bold text-display">{product.name}</h3>
            {product.isFeatured ? <Badge>Destaque</Badge> : null}
          </div>
          <p className="flex-1 text-small text-subtle">{product.shortDescription}</p>
          <Price priceType={product.priceType} priceCents={product.priceCents} />
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
