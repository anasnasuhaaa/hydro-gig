"use client";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("Common");

  return (
    <Alert variant="destructive">
      <AlertTitle>{t("error")}</AlertTitle>
      <AlertDescription>{t("retryDesc")}</AlertDescription>
      <Button variant="outline" className="mt-4 min-h-11" onClick={retry}>
        {t("retry")}
      </Button>
    </Alert>
  );
}
