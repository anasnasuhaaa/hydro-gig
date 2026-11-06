"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function DemoEntry() {
  const t = useTranslations("Dashboard");
  return (
    <Button
      asChild
      className="hero-action min-h-12 h-auto whitespace-normal px-5 py-3 text-base"
    >
      <Link href="/pre-order">
        {t("explore")}
        <ArrowRight />
      </Link>
    </Button>
  );
}
