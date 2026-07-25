import type { Metadata } from "next";
import { comCnpj, LegalPage } from "@/components/public/legal-page";
import { getSettings } from "@/lib/queries/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a Oficina Rassë trata os seus dados pessoais, conforme a LGPD.",
};

const ATUALIZADO = new Date("2026-07-25T00:00:00Z");

const TEXTO = `
Esta política explica como a Oficina Rassë, inscrita no CNPJ {{CNPJ}}, trata os dados pessoais de
quem usa este site. Ela segue a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018, a
LGPD).

## Quem é o controlador

A Oficina Rassë é a controladora dos dados tratados aqui. O contato para assuntos de privacidade é
o mesmo canal de atendimento indicado no rodapé do site.

## Que dados coletamos

**Quando você envia uma cesta pelo WhatsApp.** Guardamos os produtos escolhidos, as quantidades, os
textos de personalização que você escreveu e, se você preencher, o seu nome. Guardamos também um
código curto do pedido, que serve para encontrarmos a sua conversa.

**Quando você pede uma peça personalizada.** Guardamos o nome, o contato que você deixou (WhatsApp
ou e-mail), a mensagem escrita e os arquivos enviados.

**Quando você navega no site.** Registramos a página visitada, o produto visualizado, o endereço de
onde você veio e um identificador aleatório de sessão. Esse identificador é gerado no seu navegador,
some quando você fecha a aba e não permite identificar você.

## O que não fazemos

- **Não usamos cookies** de rastreamento, publicidade ou análise. Por isso este site não tem aviso
  de cookies: não há nada para consentir.
- **Não vendemos nem compartilhamos** seus dados com terceiros para fins de marketing.
- **Não fazemos** decisões automatizadas nem perfis de comportamento.
- **Não pedimos** dados de pagamento. Não há checkout neste site.

## Para que usamos

Usamos os dados apenas para responder ao seu pedido, produzir a peça combinada e entender quais
produtos despertam mais interesse. A base legal é a execução de contrato ou de procedimentos
preliminares a pedido do titular, no caso dos pedidos, e o legítimo interesse, no caso das
estatísticas agregadas de uso.

## Com quem compartilhamos

Apenas com os serviços necessários para o site funcionar:

- **Vercel**, que hospeda o site.
- **Neon**, que hospeda o banco de dados.
- **Cloudflare**, que armazena os arquivos enviados e protege os formulários contra robôs.

Esses serviços podem processar dados fora do Brasil. Nenhum deles usa os seus dados para finalidade
própria.

## Por quanto tempo guardamos

Os arquivos enviados em pedidos de orçamento são apagados após **12 meses**. Os registros de pedidos
são mantidos enquanto forem necessários para o histórico comercial. Os eventos de navegação são
agregados em contagens diárias, sem qualquer vínculo com você.

## Seus direitos

A LGPD garante a você o direito de confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir
anonimização, bloqueio ou exclusão, pedir a portabilidade, revogar consentimento e saber com quem
compartilhamos. Para exercer qualquer um desses direitos, fale conosco pelo canal indicado no
rodapé. Respondemos no prazo previsto em lei.

## Segurança

Os arquivos que você envia ficam em armazenamento privado, acessível apenas por links temporários
gerados para quem está autenticado no painel da oficina. As senhas de acesso ao painel são guardadas
com algoritmo de hash. O site é servido sempre por HTTPS.

## Mudanças nesta política

Se esta política mudar, a data de atualização no topo muda junto. Alterações relevantes serão
comunicadas no site.
`;

export default async function PrivacidadePage() {
  const settings = await getSettings();

  return (
    <LegalPage
      eyebrow="Legal"
      titulo="Política de"
      destaque="Privacidade"
      atualizado={ATUALIZADO}
      conteudo={comCnpj(TEXTO, settings?.cnpj ?? null)}
    />
  );
}
