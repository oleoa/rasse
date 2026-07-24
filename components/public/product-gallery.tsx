"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/db/schema";
import { imageUrl, isUnoptimized } from "@/lib/images";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-border bg-char-700 font-mono text-small text-subtle">
        sem imagem
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-char-700">
        <Image
          src={imageUrl(active.r2Key)}
          alt={active.alt}
          fill
          priority
          unoptimized={isUnoptimized(active.r2Key)}
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-3" aria-label={`Imagens de ${name}`}>
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-pressed={index === activeIndex}
                aria-label={`Ver imagem ${index + 1}: ${image.alt}`}
                className={cn(
                  "relative size-20 overflow-hidden rounded-sm border bg-char-700 transition-colors",
                  index === activeIndex
                    ? "border-copper-500"
                    : "border-border hover:border-copper-600",
                )}
              >
                <Image
                  src={imageUrl(image.r2Key)}
                  alt=""
                  fill
                  unoptimized={isUnoptimized(image.r2Key)}
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
