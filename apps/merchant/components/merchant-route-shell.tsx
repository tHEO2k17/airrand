"use client";

import { usePathname } from "next/navigation";
import { MerchantProvider } from "./merchant-context";
import { AppShell } from "./ui/app-shell";

const PUBLIC_PATHS = ["/login"];

export function MerchantRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    return <main className="pos-login-main">{children}</main>;
  }

  return (
    <MerchantProvider>
      <AppShell>{children}</AppShell>
    </MerchantProvider>
  );
}
