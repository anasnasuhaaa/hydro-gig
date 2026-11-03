"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>This workspace could not be loaded</AlertTitle>
      <AlertDescription>Please try loading it again.</AlertDescription>
      <Button variant="outline" className="mt-4 min-h-11" onClick={retry}>
        Try again
      </Button>
    </Alert>
  );
}
