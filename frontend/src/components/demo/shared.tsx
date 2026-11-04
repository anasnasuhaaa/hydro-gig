"use client";

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
import { SIMULATION_LABEL } from "@/lib/contracts/data";

export function SimulationNotice() {
  return (
    <Alert role="note" className="border-primary/20 bg-accent/40 p-4">
      <FlaskConical />
      <AlertTitle>{SIMULATION_LABEL}</AlertTitle>
      <AlertDescription>
        Synthetic roads and costs. Flood conditions and scientific risk are
        unknown; an available route does not mean it is safe.
      </AlertDescription>
    </Alert>
  );
}
export function DemoLoading() {
  return (
    <div role="status" aria-label="Loading demonstration" className="space-y-3">
      <span className="text-sm text-muted-foreground">
        Loading demonstration…
      </span>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
export function DemoError({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>Demonstration unavailable</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        <Button variant="outline" className="mt-3 min-h-11" onClick={retry}>
          <RefreshCw />
          Retry
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
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
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
