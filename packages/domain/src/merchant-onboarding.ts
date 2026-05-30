import { isValidMerchantSlug, normalizeMerchantSlug } from "./merchant-slug.js";

export type MerchantOnboardFieldError = {
  field: "merchantName" | "slug" | "ownerEmail";
  message: string;
};

export type MerchantOnboardValidationResult =
  | { ok: true; slug: string; ownerEmail: string }
  | { ok: false; errors: MerchantOnboardFieldError[] };

export function validateMerchantOnboardInput(input: {
  merchantName: string;
  slug: string;
  ownerEmail: string;
}): MerchantOnboardValidationResult {
  const errors: MerchantOnboardFieldError[] = [];
  const merchantName = input.merchantName.trim();

  if (!merchantName) {
    errors.push({
      field: "merchantName",
      message: "Merchant name is required.",
    });
  }

  const slug = normalizeMerchantSlug(input.slug);
  if (!slug || !isValidMerchantSlug(slug)) {
    errors.push({
      field: "slug",
      message:
        "Slug must use lowercase letters, numbers, and hyphens (e.g. sky-lounge).",
    });
  }

  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  if (!ownerEmail || !ownerEmail.includes("@")) {
    errors.push({
      field: "ownerEmail",
      message: "A valid owner email is required.",
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, slug, ownerEmail };
}

export function validateMerchantSettingsSlug(slug: string): string | null {
  const normalized = normalizeMerchantSlug(slug);
  if (!normalized || !isValidMerchantSlug(normalized)) {
    return "Slug must use lowercase letters, numbers, and hyphens (e.g. sky-lounge).";
  }
  return null;
}
