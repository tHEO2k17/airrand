import { MIN_SECRET_LENGTH } from "./config-validation.js";

export function getQrSigningSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      "QR_SIGNING_SECRET must be set to at least 32 characters",
    );
  }
  return secret;
}
