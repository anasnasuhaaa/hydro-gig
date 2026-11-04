import { cookies } from "next/headers";
import { DemoSessionProvider } from "@/components/demo/demo-session";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";
  return (
    <DemoSessionProvider>
      <AppShell defaultOpen={defaultOpen}>{children}</AppShell>
    </DemoSessionProvider>
  );
}
