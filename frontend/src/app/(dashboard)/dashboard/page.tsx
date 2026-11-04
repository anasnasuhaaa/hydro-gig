import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CloudRain,
  FlaskConical,
  Navigation,
  Route,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { SystemStatus } from "@/components/dashboard/system-status";

export const metadata = { title: "Overview" };

const features = [
  {
    number: "01",
    icon: Route,
    title: "Screen before you accept",
    description:
      "Compare synthetic pickup and destination routes using deterministic demonstration costs.",
    href: "/pre-order",
    action: "Explore screening",
  },
  {
    number: "02",
    icon: Navigation,
    title: "Explore changing conditions",
    description:
      "Explore t0, t1 and t2 in a user-driven early-warning simulation with schematic roads.",
    href: "/navigation",
    action: "Open navigation",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Evidence when it matters",
    description:
      "Prepare for verifiable flood-incident records that can support a driver’s penalty-dispute claim.",
    href: "/claims",
    action: "Explore claims",
  },
];

export default function Dashboard() {
  return (
    <>
      <PageHeading
        eyebrow="Your mobility workspace"
        title="Every journey starts with awareness."
        description="HydroGig-Mesh brings flood-aware route screening, early warnings, and driver evidence into one research platform."
      />
      <section
        className="grid gap-5 xl:grid-cols-[1.7fr_1fr]"
        aria-label="Project introduction"
      >
        <Card className="overflow-hidden border-0 bg-[#0c4e49] text-white shadow-none">
          <CardContent className="relative flex h-full min-h-64 flex-col items-start justify-center p-6 sm:p-8">
            <Badge className="mb-5 border-white/25 bg-white/10 text-white">
              <CloudRain className="mr-1 size-3" />
              Flood-aware mobility
            </Badge>
            <h2 className="max-w-md text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
              Better information.
              <br />
              More confident decisions.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-teal-50/85">
              Designed around motorcycle ride-hailing drivers in Bogor. Built
              step by step, with scientific transparency at its core.
            </p>
            <Button
              asChild
              variant="secondary"
              className="mt-6 min-h-11 bg-white text-[#0c4e49] hover:bg-teal-50"
            >
              <Link href="/pre-order">
                Discover the workflow
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <FlaskConical className="size-5" />
            </span>
            <CardTitle className="text-lg">A foundation for research</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Synthetic route screening and frame-based simulation are
              available. Live warnings and evidence tokens remain unavailable.
            </p>
            <div className="mt-5 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              No live flood monitoring, validated hydrological dataset, or
              trained prediction model is connected.
            </div>
          </CardContent>
        </Card>
      </section>
      <section aria-labelledby="workflows-title">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="workflows-title"
            className="text-lg font-semibold tracking-tight"
          >
            Built around your journey
          </h2>
          <span className="text-xs text-muted-foreground">
            Three connected workflows
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(
            ({ number, icon: Icon, title, description, href, action }) => (
              <Card key={href} className="flex h-full flex-col shadow-none">
                <CardHeader>
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      / {number}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="mb-3 w-fit text-muted-foreground"
                  >
                    In development
                  </Badge>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                  <Link
                    href={href}
                    className="flex min-h-11 items-center justify-between border-t pt-4 text-sm font-medium text-primary hover:underline"
                  >
                    {action}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>
      <SystemStatus />
    </>
  );
}
