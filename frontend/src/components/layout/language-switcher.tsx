"use client";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { setLocale } from "@/i18n/actions";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Language");
  const [pending, startTransition] = useTransition();
  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex shrink-0 items-center rounded-xl border p-0.5"
    >
      {(["id", "en"] as const).map((value) => (
        <Button
          key={value}
          variant={locale === value ? "secondary" : "ghost"}
          className="min-h-10 min-w-10 px-2 text-xs"
          lang={value}
          aria-label={value === "id" ? "Bahasa Indonesia" : "English"}
          aria-pressed={locale === value}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await setLocale(value);
              } catch {
                toast.error(t("error"));
              }
            })
          }
        >
          {value.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
