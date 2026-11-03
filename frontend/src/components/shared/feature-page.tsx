import Link from "next/link";
import { ArrowLeft, FlaskConical, type LucideIcon } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function FeaturePage({
  title,
  description,
  icon: Icon,
  emptyTitle,
  emptyDescription,
  action,
  steps,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  action: string;
  steps: { title: string; description: string }[];
  children?: React.ReactNode;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Driver workflows"
        title={title}
        description={description}
      />
      <Alert>
        <FlaskConical className="size-4" />
        <AlertTitle>Research feature · In development</AlertTitle>
        <AlertDescription>
          This workflow is not operational. No flood risk is assessed and no
          safety recommendation is issued.
        </AlertDescription>
      </Alert>
      <div className="grid items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card className="shadow-none">
          <CardContent className="flex min-h-96 flex-col items-center justify-center p-6 text-center">
            <span className="mb-6 flex size-16 items-center justify-center rounded-2xl border bg-muted">
              <Icon className="size-7 text-primary" />
            </span>
            <Badge variant="outline" className="mb-4">
              Not yet available
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight">
              {emptyTitle}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {emptyDescription}
            </p>
            <Button disabled className="mt-6 min-h-11">
              {action}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Available in a future development phase
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">The intended workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-6">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
      {children}
      <Button asChild variant="outline" className="min-h-11">
        <Link href="/dashboard">
          <ArrowLeft />
          Back to overview
        </Link>
      </Button>
    </>
  );
}
