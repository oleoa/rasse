import Link from "next/link";

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) {
  const conteudo = (
    <>
      <p className="font-accent text-eyebrow tracking-eyebrow text-subtle uppercase">{label}</p>
      <p className="font-display text-h1 font-bold text-display">{value}</p>
      {hint ? <p className="text-small text-subtle">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex flex-col gap-2 rounded-md border border-border bg-card p-6 transition-colors hover:border-copper-600"
      >
        {conteudo}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-6">
      {conteudo}
    </div>
  );
}
