import { DemoSessionProvider } from "@/components/demo/demo-session";
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoSessionProvider>
      <AppShell>{children}</AppShell>
    </DemoSessionProvider>
  );
}
