"use client";
import { useTranslations } from "next-intl";

import { AlertTriangle, FlaskConical, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SimulationNotice() {
  const t = useTranslations("Demo");

  return (
    <Alert role="note" className="border-primary/20 bg-accent/40 p-4">
      <FlaskConical />
      <AlertTitle>{t("notice")}</AlertTitle>
      <AlertDescription>{t("caveat")}</AlertDescription>
    </Alert>
  );
}
export function DemoLoading() {
  const t = useTranslations("Demo");

  return (
    <div role="status" aria-label={t("loading")} className="space-y-3">
      <span className="text-sm text-muted-foreground">{t("loadingText")}</span>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
export function DemoError({ retry }: { error: Error; retry: () => void }) {
  const t = useTranslations("Demo");

  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>{t("unavailable")}</AlertTitle>
      <AlertDescription>
        <p>{t("error")}</p>
        <Button variant="outline" className="mt-3 min-h-11" onClick={retry}>
          <RefreshCw />
          {t("retry")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
export function DemoSelect({
  id,
  label,
  value,
  onChange,
  options,
  error,
  onBlur,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  onBlur?: () => void;
  inputRef?: React.Ref<HTMLButtonElement>;
}) {
  const t = useTranslations("Demo");

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          ref={inputRef}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-h-11 w-full"
        >
          <SelectValue placeholder={t("select", { label })} />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-11"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
