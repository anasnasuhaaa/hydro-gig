"use client";
import { Collapsible } from "radix-ui";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function Disclosure({
  title,
  children,
  className = "",
  id,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <Collapsible.Root id={id} className={className}>
      <Collapsible.Trigger className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {title}
        <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </Collapsible.Trigger>
      <Collapsible.Content className="disclosure-content overflow-hidden">
        <div className="pt-2 pb-3">{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
