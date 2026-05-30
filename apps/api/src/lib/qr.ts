export function getQrSigningSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "QR_SIGNING_SECRET must be set to at least 32 characters",
    );
  }
  return secret;
}
