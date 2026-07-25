import { Container } from "@/components/public/container";
import { PageHeader } from "@/components/public/page-header";
import { Accent, Prose } from "@/components/public/typography";
import { Markdown } from "@/lib/markdown";
import { formatDate } from "@/lib/format";

/**
 * O CNPJ vem das configurações. Enquanto não existir, fica o marcador `{{CNPJ}}`
 * visível — a secção 7 do CLAUDE.md proíbe inventar dados da empresa.
 */
export function LegalPage({
  eyebrow,
  titulo,
  destaque,
  conteudo,
  atualizado,
}: {
  eyebrow: string;
  titulo: string;
  destaque: string;
  conteudo: string;
  atualizado: Date;
}) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        align="start"
        title={
          <>
            {titulo} <Accent>{destaque}</Accent>.
          </>
        }
        description={`Atualizado em ${formatDate(atualizado)}.`}
      />

      <Container className="pb-20">
        <Prose>
          <Markdown>{conteudo}</Markdown>
        </Prose>
      </Container>
    </>
  );
}

export function comCnpj(texto: string, cnpj: string | null): string {
  return texto.replaceAll("{{CNPJ}}", cnpj?.trim() || "{{CNPJ}}");
}
