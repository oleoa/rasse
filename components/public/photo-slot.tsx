import { cn } from "@/lib/utils";

/**
 * Lugar reservado para uma fotografia real da oficina. Enquanto os arquivos não
 * chegam, mostra a legenda em monospace a descrever a imagem — ver DESIGN.md,
 * seção 7. Nunca substituir por ilustração vetorial.
 */
export function PhotoSlot({
  caption,
  className,
  ...props
}: React.ComponentProps<"div"> & { caption: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-char-700 p-6 text-center",
        className,
      )}
      {...props}
    >
      <span className="max-w-[32ch] font-mono text-small text-subtle">{caption}</span>
    </div>
  );
}
