"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
export function DriverJourney() {
  const pathname = usePathname();
  const t = useTranslations("Journey");
  const steps = [
    { href: "/pre-order", key: "screen" },
    { href: "/navigation", key: "replay" },
    { href: "/claims", key: "evidence" },
  ];
  if (!steps.some((step) => step.href === pathname)) return null;
  return (
    <nav aria-label={t("label")} className="rounded-2xl border bg-card p-2">
      <ol className="grid grid-cols-3 gap-1 sm:gap-3">
        {steps.map(({ href, key }, index) => (
          <li key={href} className="min-w-0">
            <Link
              href={href}
              aria-current={pathname === href ? "step" : undefined}
              aria-label={t("step", { step: index + 1, title: t(key) })}
              className={`flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl p-2 text-center text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring sm:min-h-14 sm:flex-row sm:text-sm ${pathname === href ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums ${pathname === href ? "border-primary bg-primary text-primary-foreground" : ""}`}
              >
                {index + 1}
              </span>
              <span>{t(key)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
