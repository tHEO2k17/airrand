import { Lock } from "lucide-react";

export function PickupQrLockedPlaceholder() {
  return (
    <div className="store-pickup-qr store-pickup-qr--locked" aria-hidden={false}>
      <div className="store-pickup-qr-locked">
        <Lock size={32} strokeWidth={1.75} aria-hidden />
        <p className="store-pickup-qr-locked__title">Pickup code not ready yet</p>
        <p className="store-pickup-qr-locked__desc">
          Your pickup code will appear when the merchant marks this order as ready.
        </p>
      </div>
    </div>
  );
}
