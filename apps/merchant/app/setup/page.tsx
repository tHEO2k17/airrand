"use client";

import type { MerchantOnboardResponse } from "@airrand/contracts";
import { FormEvent, useState } from "react";
import { AlertMessage } from "../../components/ui/alert-message";
import { Button } from "../../components/ui/button";
import { Surface } from "../../components/ui/surface";
import { ApiError, onboardMerchant } from "../../lib/api";
import { getCustomerAppOrigin } from "../../lib/config";

export default function MerchantSetupPage() {
  const [setupKey, setSetupKey] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerDisplayName, setOwnerDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MerchantOnboardResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await onboardMerchant(
        {
          merchantName,
          slug,
          description: description.trim() ? description.trim() : undefined,
          ownerEmail,
          ownerDisplayName: ownerDisplayName.trim() || undefined,
        },
        setupKey.trim(),
      );
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Onboarding failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const storefrontUrl = result
    ? `${getCustomerAppOrigin()}${result.storefrontPath}`
    : null;

  return (
    <Surface className="pos-login-panel pos-setup-panel">
      <h1>Merchant onboarding</h1>
      <p className="pos-muted">
        Internal pilot setup only. Creates a merchant, owner account, and a
        temporary password (password change required on first login).
      </p>

      {error ? <AlertMessage variant="error" message={error} /> : null}

      {result ? (
        <div className="pos-setup-result">
          <AlertMessage
            variant="success"
            message="Merchant onboarded. Share the temporary password securely with the owner."
          />
          <dl className="pos-setup-result__list">
            <div>
              <dt>Merchant</dt>
              <dd>{result.merchant.name}</dd>
            </div>
            <div>
              <dt>Slug</dt>
              <dd>{result.merchant.slug}</dd>
            </div>
            <div>
              <dt>Owner email</dt>
              <dd>{result.owner.email}</dd>
            </div>
            <div>
              <dt>Temporary password</dt>
              <dd>
                <code>{result.temporaryPassword}</code>
              </dd>
            </div>
            {storefrontUrl ? (
              <div>
                <dt>Storefront</dt>
                <dd>
                  <a href={storefrontUrl}>{storefrontUrl}</a>
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="pos-muted">
            The owner can sign in at{" "}
            <a href="/login">/login</a> and will be prompted to change their
            password immediately.
          </p>
        </div>
      ) : (
        <form className="pos-form-grid" onSubmit={handleSubmit}>
          <label>
            Internal setup key
            <input
              type="password"
              autoComplete="off"
              value={setupKey}
              onChange={(event) => setSetupKey(event.target.value)}
              required
            />
          </label>

          <label>
            Merchant name
            <input
              value={merchantName}
              onChange={(event) => setMerchantName(event.target.value)}
              required
            />
          </label>

          <label>
            Storefront slug
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="sky-lounge"
              required
            />
          </label>

          <label>
            Description (optional)
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </label>

          <label>
            Owner email
            <input
              type="email"
              autoComplete="off"
              value={ownerEmail}
              onChange={(event) => setOwnerEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Owner display name (optional)
            <input
              value={ownerDisplayName}
              onChange={(event) => setOwnerDisplayName(event.target.value)}
            />
          </label>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create merchant"}
          </Button>
        </form>
      )}
    </Surface>
  );
}
