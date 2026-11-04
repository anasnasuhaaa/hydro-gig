import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Claims" };

export default function Claims() {
  return (
    <>
      <PageHeading title="Claims" />
      <section
        className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center sm:py-16"
        aria-labelledby="claims-empty-title"
      >
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <ShieldCheck className="size-7" />
        </span>
        <h2 id="claims-empty-title" className="text-xl font-semibold">
          Claims are not available yet
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Claim storage, signed evidence tokens, and verification are
          unavailable. No records have been created; platform acceptance is not
          guaranteed.
        </p>
        <Button disabled className="mt-6 min-h-11">
          Create evidence token
        </Button>
        <Button asChild variant="link" className="mt-2 min-h-11">
          <Link href="/pre-order">
            Screen a demo route <ArrowRight />
          </Link>
        </Button>
      </section>
    </>
  );
}
