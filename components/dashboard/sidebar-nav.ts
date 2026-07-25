export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/dashboard/produtos", label: "Produtos" },
  { href: "/dashboard/categorias", label: "Categorias" },
  { href: "/dashboard/pedidos", label: "Pedidos" },
  { href: "/dashboard/orcamentos", label: "Orçamentos" },
  { href: "/dashboard/configuracoes", label: "Configurações" },
] as const;

export function breadcrumbsFor(pathname: string): Array<{ href: string; label: string }> {
  const trilho = [{ href: "/dashboard", label: "Painel" }];

  const secao = DASHBOARD_NAV.find(
    (item) => item.href !== "/dashboard" && pathname.startsWith(item.href),
  );
  if (secao) trilho.push({ href: secao.href, label: secao.label });

  // Último segmento, quando é um detalhe (ex: /dashboard/pedidos/RS-XXXX).
  if (secao && pathname !== secao.href) {
    const resto = pathname.slice(secao.href.length + 1).split("/")[0];
    if (resto) trilho.push({ href: pathname, label: decodeURIComponent(resto) });
  }

  return trilho;
}
