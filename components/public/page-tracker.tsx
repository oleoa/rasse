"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/**
 * `page_view` a cada navegação. Vive no layout público, uma só vez — o guard do
 * `ref` evita repetir na mesma rota e no Strict Mode do desenvolvimento.
 */
export function PageTracker() {
  const pathname = usePathname();
  const ultimo = useRef<string | null>(null);

  useEffect(() => {
    if (ultimo.current === pathname) return;
    ultimo.current = pathname;
    track("page_view");
  }, [pathname]);

  return null;
}

/**
 * `product_view`, só na página de produto. Separado do `PageTracker` para o
 * `page_view` não ser contado duas vezes.
 */
export function ProductViewTracker({ productId }: { productId: string }) {
  const ultimo = useRef<string | null>(null);

  useEffect(() => {
    if (ultimo.current === productId) return;
    ultimo.current = productId;
    track("product_view", { productId });
  }, [productId]);

  return null;
}
