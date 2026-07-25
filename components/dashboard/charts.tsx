"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/public/empty-state";

const EIXO = { stroke: "var(--stone-500)", fontSize: 12, fontFamily: "var(--font-accent)" };
const GRELHA = "var(--border-subtle)";

const TOOLTIP = {
  contentStyle: {
    background: "var(--surface-raised)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "3px",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
  },
  labelStyle: { color: "var(--text-display)" },
  itemStyle: { color: "var(--text-body)" },
  cursor: { fill: "var(--char-700)" },
} as const;

function Vazio({ mensagem }: { mensagem: string }) {
  return <EmptyState title="Ainda sem dados." description={mensagem} className="min-h-64" />;
}

export function VisitasChart({ dados }: { dados: Array<{ dia: string; visitas: number }> }) {
  if (dados.every((d) => d.visitas === 0)) {
    return <Vazio mensagem="Assim que houver visitas, a curva aparece aqui." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRELHA} vertical={false} />
        <XAxis
          dataKey="dia"
          tick={EIXO}
          tickLine={false}
          axisLine={{ stroke: GRELHA }}
          tickFormatter={(v: string) => v.slice(8, 10) + "/" + v.slice(5, 7)}
          minTickGap={24}
        />
        <YAxis tick={EIXO} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
        <Tooltip {...TOOLTIP} formatter={(v) => [Number(v ?? 0), "Visitas"] as const} />
        <Line
          type="monotone"
          dataKey="visitas"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--chart-1)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SemanasChart({
  dados,
  rotulo,
  cor = "var(--chart-2)",
}: {
  dados: Array<{ semana: string; total: number }>;
  rotulo: string;
  cor?: string;
}) {
  if (dados.every((d) => d.total === 0)) {
    return <Vazio mensagem={`Ainda não há ${rotulo.toLowerCase()} no período escolhido.`} />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRELHA} vertical={false} />
        <XAxis dataKey="semana" tick={EIXO} tickLine={false} axisLine={{ stroke: GRELHA }} />
        <YAxis tick={EIXO} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
        <Tooltip {...TOOLTIP} formatter={(v) => [Number(v ?? 0), rotulo] as const} />
        <Bar dataKey="total" fill={cor} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopProdutosLista({
  dados,
  rotulo,
}: {
  dados: Array<{ nome: string; slug: string; total: number }>;
  rotulo: string;
}) {
  if (dados.length === 0) {
    return <Vazio mensagem={`Ainda não há ${rotulo.toLowerCase()} registrados.`} />;
  }

  const maximo = Math.max(...dados.map((d) => d.total));

  return (
    <ol className="flex flex-col gap-3">
      {dados.map((item, index) => (
        <li key={item.slug} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-small text-body">
              {index + 1}. {item.nome}
            </span>
            <span className="shrink-0 font-accent text-small text-display">{item.total}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-char-700">
            <div
              className="h-full bg-brand"
              style={{ width: `${Math.round((item.total / maximo) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
