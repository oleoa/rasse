import Link from "next/link";
import { Container } from "@/components/public/container";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { Button } from "@/components/ui/button";

export default function ProdutoNaoEncontrado() {
  return (
    <Container className="flex flex-col items-center gap-6 py-24 text-center">
      <CopperRule />
      <Eyebrow>Erro 404</Eyebrow>
      <h1 className="font-display text-h1 font-bold text-display">Esta peça não existe.</h1>
      <p className="max-w-[52ch] text-base text-subtle">
        Pode ter sido retirada do catálogo ou o endereço estar errado.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/produtos">Ver o catálogo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/personalizado">Pedir sob medida</Link>
        </Button>
      </div>
    </Container>
  );
}
