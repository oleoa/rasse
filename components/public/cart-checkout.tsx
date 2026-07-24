"use client";

import { useId, useState } from "react";
import { usePathname } from "next/navigation";
import type { SentCart } from "@/components/public/cart-confirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore, type CartLine } from "@/lib/cart/store";
import { createCartAndGetWhatsappUrl } from "@/lib/mutations/carts";
import { getSessionId } from "@/lib/session";

/**
 * O ecrã de confirmação é responsabilidade de quem chama: enviar limpa a cesta,
 * e este componente deixa de ser renderizado a seguir.
 */
export function CartCheckout({
  lines,
  onSent,
}: {
  lines: CartLine[];
  onSent: (sent: SentCart) => void;
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clear = useCartStore((s) => s.clear);
  const pathname = usePathname();
  const nameId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || lines.length === 0) return;

    setPending(true);
    setError(null);

    // Aberta antes do await: depois da resposta, o browser bloqueia o popup.
    const janela = window.open("", "_blank", "noopener,noreferrer");

    try {
      const result = await createCartAndGetWhatsappUrl({
        customerName: name.trim() ? name.trim() : null,
        sessionId: getSessionId(),
        path: pathname,
        items: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
          personalizationText: line.personalizationText,
        })),
      });

      if (!result.ok) {
        janela?.close();
        setError(result.error);
        return;
      }

      const removedNames = lines
        .filter((line) => result.removedProductIds.includes(line.productId))
        .map((line) => line.productName);

      if (janela) janela.location.href = result.whatsappUrl;

      onSent({ code: result.code, whatsappUrl: result.whatsappUrl, removedNames });
      clear();
    } catch {
      janela?.close();
      setError("Não foi possível enviar agora. Verifica a ligação e tenta de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Nome (opcional)</Label>
        <Input
          id={nameId}
          name="nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          autoComplete="name"
          placeholder="Como te chamas"
        />
      </div>

      {error ? (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending || lines.length === 0}>
        {pending ? "A enviar…" : "Enviar pelo WhatsApp"}
      </Button>

      <p className="text-small text-subtle">
        O pedido é registado com um código e a conversa abre noutro separador. Não há pagamento
        aqui.
      </p>
    </form>
  );
}
