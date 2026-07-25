import type { Metadata } from "next";
import { comCnpj, LegalPage } from "@/components/public/legal-page";
import { getSettings } from "@/lib/queries/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "As regras de uso do site da Oficina Rassë.",
};

const ATUALIZADO = new Date("2026-07-25T00:00:00Z");

const TEXTO = `
Estes termos valem para quem usa o site da Oficina Rassë, inscrita no CNPJ {{CNPJ}}. Ao navegar ou
enviar um pedido, você concorda com o que está escrito aqui.

## O que este site é

Um catálogo e um canal de contato. **Não é uma loja com pagamento online.** Não há carrinho de
compras com checkout, nem cobrança feita por aqui.

## Como funciona um pedido

Ao montar uma cesta e clicar em enviar, o site gera um código e abre uma conversa no WhatsApp da
oficina com a lista dos itens. Esse envio é uma **manifestação de interesse**, não uma compra.

O negócio só se fecha na conversa, depois de combinarmos preço final, prazo, forma de pagamento e
entrega. Até lá, nenhuma das partes está obrigada a nada.

## Preços

Os preços exibidos são de referência e podem mudar sem aviso. Itens marcados como **"sob consulta"**
não têm preço definido — dependem de tamanho, material e acabamento, e são combinados caso a caso.
O preço válido é sempre o confirmado na conversa.

## Peças personalizadas

Textos de gravação e arquivos enviados são usados apenas para produzir a sua peça.

Ao enviar um arquivo, você declara que tem o direito de usá-lo. Não produzimos peças que violem
direitos de terceiros, nem conteúdo ilegal, ofensivo ou discriminatório.

Peças personalizadas são feitas sob medida a partir do que você pediu. Confira o texto e a grafia
antes de confirmar: depois de gravada, a peça não pode ser refeita sem custo por erro de digitação
do pedido.

## Arquivos enviados

São aceitos os formatos indicados no formulário, até 50 MB cada e no máximo 5 por pedido. Arquivos
enviados sem que o formulário seja concluído são apagados automaticamente. Os demais são apagados
após 12 meses.

## Imagens e conteúdo

As fotos, os textos e a identidade visual do site são da Oficina Rassë. Reproduzir sem autorização
não é permitido.

As imagens dos produtos são ilustrativas. Madeira é material natural: veios, tonalidade e pequenas
variações mudam de peça para peça, e isso é característica do produto, não defeito.

## Direito de arrependimento

Compras feitas fora do estabelecimento comercial têm o prazo de arrependimento previsto no artigo 49
do Código de Defesa do Consumidor. Esse direito **não se aplica** a peças personalizadas, feitas sob
encomenda conforme especificação sua.

## Limites

O site pode ficar indisponível para manutenção ou por falha de terceiros. Fazemos o possível para
manter as informações corretas, mas erros de digitação em preços ou descrições podem acontecer, e
nesse caso o valor correto é o confirmado na conversa.

## Foro e lei aplicável

Estes termos são regidos pela lei brasileira.

## Mudanças

Estes termos podem mudar. A data de atualização no topo indica a última versão.
`;

export default async function TermosPage() {
  const settings = await getSettings();

  return (
    <LegalPage
      eyebrow="Legal"
      titulo="Termos de"
      destaque="Uso"
      atualizado={ATUALIZADO}
      conteudo={comCnpj(TEXTO, settings?.cnpj ?? null)}
    />
  );
}
