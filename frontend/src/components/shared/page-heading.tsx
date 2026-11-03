import { Badge } from "@/components/ui/badge";

export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Badge variant="outline" className="mt-1 gap-2 rounded-full px-3 py-1.5">
        <span className="size-1.5 rounded-full bg-primary" />
        Phase 1 · Development
      </Badge>
    </div>
  );
}
