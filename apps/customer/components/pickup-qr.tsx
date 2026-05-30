"use client";

import QRCode from "react-qr-code";

export function PickupQr({ token }: { token: string }) {
  return (
    <div className="pickup-qr-wrap">
      <QRCode value={token} size={220} />
    </div>
  );
}
