import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <main className="mx-auto max-w-xl space-y-5 px-6 py-24">
      <p className="text-sm text-primary">HydroGig-Mesh · 404</p>
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Button asChild className="min-h-11">
        <Link href="/dashboard">{t("back")}</Link>
      </Button>
    </main>
  );
}
