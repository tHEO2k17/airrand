"use client";

import { usePathname } from "next/navigation";

export function StoreMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCatalogPage = /^\/store\/[^/]+$/u.test(pathname);
  const className = isCatalogPage
    ? "store-main"
    : "store-main store-main--no-sticky";

  return <main className={className}>{children}</main>;
}
