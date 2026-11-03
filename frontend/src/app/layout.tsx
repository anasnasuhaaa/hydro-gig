import type { Metadata } from "next";
import "@fontsource-variable/geist";
import { AppProviders } from "@/lib/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "HydroGig-Mesh", template: "%s | HydroGig-Mesh" },
  description:
    "Research foundation for flood-aware motorcycle mobility in Bogor, Indonesia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="min-h-full antialiased">
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
