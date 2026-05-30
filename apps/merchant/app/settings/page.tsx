"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertMessage } from "../../components/ui/alert-message";
import { LoadingState } from "../../components/ui/loading-state";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { useAuth } from "../../components/auth-context";
import { useMerchant } from "../../components/merchant-context";
import { Button } from "../../components/ui/button";
import { Surface } from "../../components/ui/surface";
import {
  fetchMerchantSettings,
  updateMerchantSettings,
} from "../../lib/api";
import { getCustomerAppOrigin } from "../../lib/config";
import { ApiError } from "../../lib/api";

function SettingsContent() {
  const { user } = useAuth();
  const { merchantId, refreshMerchant } = useMerchant();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const settings = await fetchMerchantSettings(merchantId);
      setName(settings.name);
      setSlug(settings.slug);
      setDescription(settings.description ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (user?.role !== "owner") {
    return (
      <PageShell title="Settings">
        <AlertMessage
          variant="error"
          message="Only the merchant owner can edit storefront settings."
        />
      </PageShell>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!merchantId) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateMerchantSettings(merchantId, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() ? description.trim() : null,
      });
      await refreshMerchant();
      setSuccess("Settings saved.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  }

  const storefrontUrl = slug
    ? `${getCustomerAppOrigin()}/store/${slug.trim().toLowerCase()}`
    : null;

  return (
    <PageShell title="Settings" description="Storefront name, slug, and description.">
      {loading ? <LoadingState label="Loading settings…" /> : null}
      {error ? <AlertMessage variant="error" message={error} /> : null}
      {success ? <AlertMessage variant="success" message={success} /> : null}

      {!loading ? (
        <Surface>
          <form className="pos-form-grid" onSubmit={handleSubmit}>
            <label>
              Merchant name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label>
              Storefront slug
              <input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
              />
            </label>

            {storefrontUrl ? (
              <p className="pos-muted">
                Customer storefront:{" "}
                <a href={storefrontUrl} target="_blank" rel="noreferrer">
                  {storefrontUrl}
                </a>
              </p>
            ) : null}

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </form>
        </Surface>
      ) : null}
    </PageShell>
  );
}

export default function SettingsPage() {
  return (
    <MerchantGate>
      <SettingsContent />
    </MerchantGate>
  );
}
