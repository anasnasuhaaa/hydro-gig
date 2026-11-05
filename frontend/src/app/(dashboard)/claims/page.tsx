import { EvidencePreviewWorkspace } from "@/components/experimental/evidence-preview";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";

export { claimsMetadata as generateMetadata } from "@/i18n/metadata";

export default function Claims() {
  const t = useTranslations("Claims");

  return (
    <EvidencePreviewWorkspace>
      <PageHeading title={t("title")} />
      <section
        className="flex flex-col items-center rounded-2xl border border-primary/20 bg-card shadow-sm px-6 py-12 text-center sm:py-16"
        aria-labelledby="claims-empty-title"
      >
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <ShieldCheck className="size-7" />
        </span>
        <h2 id="claims-empty-title" className="text-xl font-semibold">
          {t("empty")}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
        <p className="mt-6 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
          {t("planned")}
        </p>
        <Button asChild variant="outline" className="mt-5 min-h-11">
          <Link href="/guide">
            {t("guide")}
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="link" className="mt-2 min-h-11">
          <Link href="/pre-order">
            {t("screen")} <ArrowRight />
          </Link>
        </Button>
      </section>
    </EvidencePreviewWorkspace>
  );
}
