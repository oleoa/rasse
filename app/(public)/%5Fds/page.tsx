import type { Metadata } from "next";
import { Container } from "@/components/public/container";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { ProductGridSkeleton } from "@/components/public/product-card-skeleton";
import { Accent, CopperRule, Eyebrow, Prose } from "@/components/public/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const PALETTE = [
  ["copper-300", "bg-copper-300"],
  ["copper-400", "bg-copper-400"],
  ["copper-500", "bg-copper-500"],
  ["copper-600", "bg-copper-600"],
  ["copper-700", "bg-copper-700"],
  ["amber-400", "bg-amber-400"],
  ["amber-500", "bg-amber-500"],
  ["wood-200", "bg-wood-200"],
  ["wood-300", "bg-wood-300"],
  ["wood-400", "bg-wood-400"],
  ["wood-500", "bg-wood-500"],
  ["wood-600", "bg-wood-600"],
  ["char-600", "bg-char-600"],
  ["char-700", "bg-char-700"],
  ["char-800", "bg-char-800"],
  ["char-900", "bg-char-900"],
  ["cream-50", "bg-cream-50"],
  ["cream-100", "bg-cream-100"],
  ["cream-200", "bg-cream-200"],
  ["stone-400", "bg-stone-400"],
  ["stone-500", "bg-stone-500"],
  ["stone-600", "bg-stone-600"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6 py-12">
      <div className="flex flex-col gap-3">
        <CopperRule />
        <h2 className="font-display text-h2 font-bold text-display">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <>
      <PageHeader
        eyebrow="Interno · Removível na fase 10"
        title={
          <>
            Design <Accent>system</Accent>.
          </>
        }
        description="Todos os componentes e estados, para conferir tokens e comportamento responsivo."
      />

      <Container className="pb-16">
        <Section title="Paleta">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {PALETTE.map(([name, bg]) => (
              <div key={name} className="flex flex-col gap-2">
                <div className={`h-16 rounded-sm border border-border ${bg}`} />
                <span className="font-mono text-small text-subtle">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Tipografia">
          <div className="flex flex-col gap-6">
            <Eyebrow>Eyebrow · font-accent · tracking-eyebrow</Eyebrow>
            <p className="font-display text-hero font-bold text-display">
              Explore o <Accent>autêntico</Accent>.
            </p>
            <p className="font-display text-h1 font-bold text-display">Headline h1 · 40px</p>
            <p className="font-display text-h2 font-bold text-display">Headline h2 · 28px</p>
            <p className="font-display text-h3 font-bold text-display">Headline h3 · 20px</p>
            <Prose>
              <p>
                Corpo em font-body, 16px, entrelinha 1.6, medida máxima de 68 caracteres. A veia da
                madeira muda de peça para peça — não existem duas iguais. Cada detalhe conta uma
                história.
              </p>
            </Prose>
            <p className="text-small text-subtle">Texto pequeno · 13px · text-muted</p>
          </div>
        </Section>

        <Section title="Botões">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <Button>Primário</Button>
              <Button variant="outline">Secundário</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destrutivo</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Pequeno</Button>
              <Button size="default">Médio</Button>
              <Button size="lg">Grande</Button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button disabled>Desativado</Button>
              <Button variant="outline" disabled>
                Desativado
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Campos de formulário">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-nome">Nome</Label>
              <Input id="ds-nome" placeholder="Como te chamas" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-contacto">Contato</Label>
              <Input id="ds-contacto" placeholder="WhatsApp ou email" />
              <p className="text-small text-subtle">Texto de ajuda por baixo do campo.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-erro">Campo com erro</Label>
              <Input id="ds-erro" aria-invalid defaultValue="valor inválido" />
              <p className="text-small text-danger">Mensagem de erro.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-off">Campo desativado</Label>
              <Input id="ds-off" disabled placeholder="Indisponível" />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="ds-msg">Mensagem</Label>
              <Textarea id="ds-msg" placeholder="Descreve a peça que tens em mente" />
            </div>
          </div>
        </Section>

        <Section title="Tags">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Destaque</Badge>
            <Badge variant="secondary">Rascunho</Badge>
            <Badge variant="success">Fechado</Badge>
            <Badge variant="destructive">Perdido</Badge>
            <Badge variant="outline">Arquivado</Badge>
            <Badge variant="ghost">Sob consulta</Badge>
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-h3">Tábua de churrasco</CardTitle>
                <CardDescription>Madeira maciça, acabamento rústico.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="font-accent text-small tracking-caps text-display">R$ 189,00</span>
                <Badge>Destaque</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-h3">Peça sob medida</CardTitle>
                <CardDescription>Do teu desenho à peça pronta.</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="font-accent text-small tracking-caps text-subtle">A combinar</span>
              </CardContent>
            </Card>
            <div className="frame flex min-h-40 items-center justify-center rounded-md p-8 surface-warm">
              <p className="text-center font-display text-h3 font-bold">
                Superfície quente com moldura.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Estados vazios">
          <div className="grid gap-6 lg:grid-cols-2">
            <EmptyState
              title="Nenhum produto nesta categoria."
              description="Experimenta outra categoria ou vê o catálogo completo."
              action={<Button variant="outline">Ver tudo</Button>}
            />
            <EmptyState
              title="A cesta está vazia."
              description="Adiciona peças ao percorrer o catálogo."
            />
          </div>
        </Section>

        <Section title="Carregamento">
          <div className="flex flex-col gap-8">
            <ProductGridSkeleton count={3} />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </Section>

        <Section title="Divisores e moldura">
          <div className="flex flex-col gap-8">
            <CopperRule />
            <Separator />
            <div className="frame rounded-md border border-border p-10 text-center">
              <Eyebrow>Motivo assinatura</Eyebrow>
              <p className="pt-2 font-display text-h2 font-bold text-display">
                Moldura de <Accent>cobre</Accent>.
              </p>
            </div>
          </div>
        </Section>
      </Container>
    </>
  );
}
