import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
