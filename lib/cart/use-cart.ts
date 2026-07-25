"use client";

import { useEffect, useState } from "react";
import { useCartStore, type CartLine } from "@/lib/cart/store";

/**
 * O `persist` do Zustand só lê o localStorage depois da montagem. Retornar a
 * cesta vazia até lá evita divergência entre o HTML do servidor e o do cliente.
 */
export function useCart(): { lines: CartLine[]; hydrated: boolean } {
  const [hydrated, setHydrated] = useState(false);
  const lines = useCartStore((state) => state.lines);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return { lines: hydrated ? lines : [], hydrated };
}
