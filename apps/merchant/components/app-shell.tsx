"use client";

import { usePathname } from "next/navigation";
import { DemoBanner } from "./demo-banner";
import { MerchantProvider } from "./merchant-context";
import { SiteNav } from "./site-nav";

const PUBLIC_PATHS = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    return <main className="app-main">{children}</main>;
  }

  return (
    <>
      <DemoBanner />
      <MerchantProvider>
        <SiteNav />
        <main className="app-main">{children}</main>
      </MerchantProvider>
    </>
  );
}
