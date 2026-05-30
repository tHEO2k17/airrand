import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
