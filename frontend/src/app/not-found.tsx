import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl space-y-5 px-6 py-24">
      <p className="text-sm text-primary">HydroGig-Mesh · 404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        Return to the workspace to explore available modules.
      </p>
      <Button asChild className="min-h-11">
        <Link href="/dashboard">Back to overview</Link>
      </Button>
    </main>
  );
}
