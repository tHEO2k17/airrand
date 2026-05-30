import type { Metadata } from "next";
import { CartProvider } from "../components/cart-context";
import { MerchantProvider } from "../components/merchant-context";
import { SiteHeader } from "../components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "airRand",
  description: "Browse merchants and place pickup orders",
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
          <MerchantProvider>
            <CartProvider>
              <SiteHeader />
              <main className="app-main">{children}</main>
            </CartProvider>
          </MerchantProvider>
        </div>
      </body>
    </html>
  );
}
