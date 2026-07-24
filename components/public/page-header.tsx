import { Container } from "@/components/public/container";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "start";
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: PageHeaderProps) {
  const centered = align === "center";

  return (
    <Container
      className={cn(
        "flex flex-col gap-4 py-12 sm:py-16",
        centered ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <CopperRule className={centered ? "mx-auto" : ""} />
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="font-display text-h2 font-bold text-display sm:text-h1">{title}</h1>
      {description ? (
        <div className={cn("max-w-[68ch] text-base text-subtle", centered && "mx-auto")}>
          {description}
        </div>
      ) : null}
    </Container>
  );
}
