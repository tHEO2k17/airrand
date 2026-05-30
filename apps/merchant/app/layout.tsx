import type { Metadata } from "next";
import { DemoBanner } from "../components/demo-banner";
import { MerchantProvider } from "../components/merchant-context";
import { SiteNav } from "../components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "airRand Merchant",
  description: "Merchant POS and order dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <DemoBanner />
          <MerchantProvider>
            <SiteNav />
            <main className="app-main">{children}</main>
          </MerchantProvider>
        </div>
      </body>
    </html>
  );
}
