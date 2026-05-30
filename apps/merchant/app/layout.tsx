import type { Metadata } from "next";
import { MerchantRouteShell } from "../components/merchant-route-shell";
import { AuthGate } from "../components/auth-gate";
import { AuthProvider } from "../components/auth-context";
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
        <AuthProvider>
          <AuthGate>
            <MerchantRouteShell>{children}</MerchantRouteShell>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
