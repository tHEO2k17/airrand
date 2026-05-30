import type { Metadata } from "next";
import { CartProvider } from "../components/cart-context";
import { MerchantProvider } from "../components/merchant-context";
import { StickyCartBar } from "../components/sticky-cart-bar";
import { StoreMain } from "../components/store-main";
import { AppShell } from "../components/ui/app-shell";
import { Header } from "../components/ui/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "airRand",
  description: "Order ahead for pickup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MerchantProvider>
          <CartProvider>
            <AppShell>
              <Header />
              <StoreMain>{children}</StoreMain>
              <StickyCartBar />
            </AppShell>
          </CartProvider>
        </MerchantProvider>
      </body>
    </html>
  );
}
