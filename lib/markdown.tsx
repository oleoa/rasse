import { Fragment, type ReactNode } from "react";

/**
 * Renderizador de um subconjunto de markdown para nós React.
 *
 * Nunca produz HTML a partir de string, por isso não há superfície de XSS.
 * Suporta: títulos `#` a `###`, parágrafos, listas com `-`/`*` e `1.`, negrito,
 * itálico, código inline e links http(s)/mailto. Não suporta HTML embutido,
 * imagens, tabelas nem citações — ver BLOCKERS.md.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\))/g;

function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|\/)/i.test(href);
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let index = 0;

  for (const match of text.matchAll(INLINE)) {
    const token = match[0];
    const start = match.index;

    if (start > last) nodes.push(text.slice(last, start));
    last = start + token.length;
    const key = `${keyPrefix}-${(index += 1)}`;

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-medium text-display">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded-sm bg-char-700 px-1 py-0.5 font-mono text-small">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const split = token.indexOf("](");
      const label = token.slice(1, split);
      const href = token.slice(split + 2, -1);
      nodes.push(
        isSafeHref(href) ? (
          <a key={key} href={href}>
            {label}
          </a>
        ) : (
          <Fragment key={key}>{label}</Fragment>
        ),
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] };

function toBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list) {
      blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading?.[1] && heading[2]) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2],
      });
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+\.\s+(.*)$/.exec(trimmed);
    const item = bullet?.[1] ?? numbered?.[1];

    if (item !== undefined) {
      flushParagraph();
      const ordered = numbered !== null;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(item);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function Markdown({ children }: { children: string }) {
  const blocks = toBlocks(children);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        const key = `b${i}`;

        if (block.kind === "heading") {
          const className = "font-display font-bold text-display";
          if (block.level === 1) {
            return (
              <h2 key={key} className={`${className} text-h2`}>
                {renderInline(block.text, key)}
              </h2>
            );
          }
          if (block.level === 2) {
            return (
              <h3 key={key} className={`${className} text-h3`}>
                {renderInline(block.text, key)}
              </h3>
            );
          }
          return (
            <h4 key={key} className={`${className} text-base`}>
              {renderInline(block.text, key)}
            </h4>
          );
        }

        if (block.kind === "list") {
          const items = block.items.map((item, j) => (
            <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
          ));
          return block.ordered ? (
            <ol key={key} className="flex list-decimal flex-col gap-2 pl-5 leading-[1.6] text-body">
              {items}
            </ol>
          ) : (
            <ul key={key} className="flex list-disc flex-col gap-2 pl-5 leading-[1.6] text-body">
              {items}
            </ul>
          );
        }

        return (
          <p key={key} className="leading-[1.6] text-body">
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </div>
  );
}
