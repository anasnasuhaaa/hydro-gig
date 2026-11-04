import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  const t = useTranslations("Loading");

  return (
    <div role="status" aria-label={t("label")} className="space-y-6">
      <Skeleton className="h-10 w-60" />
      <Skeleton className="h-56 w-full" />
      <div className="grid gap-5 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}
