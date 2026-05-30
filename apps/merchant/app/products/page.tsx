"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { ProductResponse } from "@airrand/contracts";
import { AlertMessage } from "../../components/ui/alert-message";
import { LoadingState } from "../../components/ui/loading-state";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { useMerchant } from "../../components/merchant-context";
import { Button } from "../../components/ui/button";
import { Surface } from "../../components/ui/surface";
import { createProduct, fetchProducts, updateProduct } from "../../lib/api";
import { formatMoney } from "../../lib/format";

function ProductsContent() {
  const { merchantId } = useMerchant();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPriceCents, setUnitPriceCents] = useState("0");

  const load = useCallback(async () => {
    if (!merchantId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchProducts(merchantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!merchantId) {
      return;
    }

    const trimmedName = name.trim();
    const cents = Number(unitPriceCents);
    if (!trimmedName) {
      setError("Product name is required.");
      return;
    }
    if (!Number.isInteger(cents) || cents < 0) {
      setError("Unit price must be a whole number of cents (0 or greater).");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createProduct(merchantId, {
        name: trimmedName,
        description: description.trim() || undefined,
        unitPriceCents: cents,
        isAvailable: true,
      });
      setName("");
      setDescription("");
      setUnitPriceCents("0");
      setSuccess("Product created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(product: ProductResponse) {
    if (!merchantId) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProduct(merchantId, product.id, {
        isAvailable: !product.isAvailable,
      });
      setSuccess(
        `Product "${product.name}" is now ${product.isAvailable ? "unavailable" : "available"}.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Products"
      description="Manage catalog items for pickup orders."
    >
      {error ? <AlertMessage variant="error" message={error} /> : null}
      {success ? <AlertMessage variant="success" message={success} /> : null}

      <div className="pos-split">
        <Surface>
          <h2 className="pos-section-title">Add product</h2>
          <form className="pos-form-grid" onSubmit={handleCreate}>
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label>
              Unit price (cents)
              <input
                type="number"
                min={0}
                step={1}
                value={unitPriceCents}
                onChange={(e) => setUnitPriceCents(e.target.value)}
                required
              />
            </label>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create product"}
            </Button>
          </form>
        </Surface>

        <Surface>
          <h2 className="pos-section-title">Catalog</h2>
          {loading ? <LoadingState /> : null}
          {!loading && products.length === 0 ? (
            <p className="pos-muted">No products yet.</p>
          ) : null}
          {!loading && products.length > 0 ? (
            <div className="pos-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Available</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        {product.description ? (
                          <p className="pos-muted">{product.description}</p>
                        ) : null}
                      </td>
                      <td>{formatMoney(product.unitPriceCents)}</td>
                      <td>{product.isAvailable ? "Yes" : "No"}</td>
                      <td>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={saving}
                          onClick={() => void toggleAvailability(product)}
                        >
                          {product.isAvailable ? "Mark unavailable" : "Mark available"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Surface>
      </div>
    </PageShell>
  );
}

export default function ProductsPage() {
  return (
    <MerchantGate>
      <ProductsContent />
    </MerchantGate>
  );
}
