"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useExperimentalSession } from "./session";

export function DemoEntry({ experimental = true }: { experimental?: boolean }) {
  const t = useTranslations("Dashboard");
  const session = useExperimentalSession();
  return (
    <Button
      asChild
      variant={experimental ? "default" : "outline"}
      className={
        experimental
          ? "hero-action min-h-12 h-auto justify-between whitespace-normal px-5 py-3 text-left text-base"
          : "min-h-11 h-auto whitespace-normal"
      }
    >
      <Link href="/pre-order" onClick={() => session.setEnabled(experimental)}>
        {t(experimental ? "explore" : "legacy")}
        <ArrowRight className="shrink-0" />
      </Link>
    </Button>
  );
}
