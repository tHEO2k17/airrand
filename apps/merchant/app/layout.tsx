import type { Metadata } from "next";
import { AppShell } from "../components/app-shell";
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
            <div className="app-shell">
              <AppShell>{children}</AppShell>
            </div>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
