"use client";

import QRCode from "react-qr-code";

export function PickupQr({ token }: { token: string }) {
  return <QRCode value={token} size={220} level="M" />;
}
