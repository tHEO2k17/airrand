"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type {
  ProductCategoryResponse,
  ProductResponse,
  ProductStockState,
} from "@airrand/contracts";
import { AlertMessage } from "../../components/ui/alert-message";
import { LoadingState } from "../../components/ui/loading-state";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { useMerchant } from "../../components/merchant-context";
import { Button } from "../../components/ui/button";
import { Surface } from "../../components/ui/surface";
import { Badge } from "../../components/ui/badge";
import {
  createCategory,
  createProduct,
  fetchCategories,
  fetchProducts,
  updateCategory,
  updateProduct,
  updateProductStockState,
} from "../../lib/api";
import { formatMoney } from "../../lib/format";
import { STOCK_STATE_LABELS } from "../../lib/stock-state";
import { useMerchantPermissions } from "../../lib/use-merchant-permissions";

const STOCK_STATES: ProductStockState[] = ["in_stock", "low_stock", "out_of_stock"];

function ProductsContent() {
  const { merchantId } = useMerchant();
  const { canCreateProduct, canUpdateProduct } = useMerchantPermissions();
  const [categories, setCategories] = useState<ProductCategoryResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryIconKey, setCategoryIconKey] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPriceCents, setUnitPriceCents] = useState("0");
  const [categoryId, setCategoryId] = useState<string>("");
  const [stockState, setStockState] = useState<ProductStockState>("in_stock");
  const [stockQuantity, setStockQuantity] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [categoryList, productList] = await Promise.all([
        fetchCategories(merchantId),
        fetchProducts(merchantId),
      ]);
      setCategories(categoryList);
      setProducts(productList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetCategoryForm() {
    setCategoryName("");
    setCategoryIconKey("");
    setEditingCategoryId(null);
  }

  function resetProductForm() {
    setName("");
    setDescription("");
    setUnitPriceCents("0");
    setCategoryId("");
    setStockState("in_stock");
    setStockQuantity("");
    setEditingProductId(null);
  }

  function startEditCategory(category: ProductCategoryResponse) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryIconKey(category.iconKey ?? "");
  }

  function startEditProduct(product: ProductResponse) {
    setEditingProductId(product.id);
    setName(product.name);
    setDescription(product.description ?? "");
    setUnitPriceCents(String(product.unitPriceCents));
    setCategoryId(product.categoryId ?? "");
    setStockState(product.stockState);
    setStockQuantity(
      product.stockQuantity != null ? String(product.stockQuantity) : "",
    );
  }

  async function handleCategorySubmit(event: FormEvent) {
    event.preventDefault();
    if (!merchantId) {
      return;
    }
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingCategoryId) {
        await updateCategory(merchantId, editingCategoryId, {
          name: trimmedName,
          iconKey: categoryIconKey.trim() || null,
        });
        setSuccess("Category updated.");
      } else {
        await createCategory(merchantId, {
          name: trimmedName,
          iconKey: categoryIconKey.trim() || undefined,
          sortOrder: categories.length,
          isActive: true,
        });
        setSuccess("Category created.");
      }
      resetCategoryForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  async function handleProductSubmit(event: FormEvent) {
    event.preventDefault();
    if (!merchantId) {
      return;
    }

    const trimmedName = name.trim();
    const cents = Number(unitPriceCents);
    const qtyRaw = stockQuantity.trim();
    const parsedQty = qtyRaw === "" ? null : Number(qtyRaw);

    if (!trimmedName) {
      setError("Product name is required.");
      return;
    }
    if (!Number.isInteger(cents) || cents < 0) {
      setError("Unit price must be a whole number of cents (0 or greater).");
      return;
    }
    if (parsedQty != null && (!Number.isInteger(parsedQty) || parsedQty < 0)) {
      setError("Stock quantity must be a whole number 0 or greater.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
        unitPriceCents: cents,
        categoryId: categoryId || null,
        stockState,
        stockQuantity: parsedQty,
        isAvailable: stockState !== "out_of_stock",
      };

      if (editingProductId) {
        await updateProduct(merchantId, editingProductId, payload);
        setSuccess("Product updated.");
      } else {
        await createProduct(merchantId, payload);
        setSuccess("Product created.");
      }
      resetProductForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStock(
    product: ProductResponse,
    nextState: ProductStockState,
  ) {
    if (!merchantId) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProductStockState(merchantId, product.id, nextState);
      setSuccess(`"${product.name}" marked ${STOCK_STATE_LABELS[nextState].toLowerCase()}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Products"
      description="Organize your catalog with categories and lightweight stock state."
    >
      {error ? <AlertMessage variant="error" message={error} /> : null}
      {success ? <AlertMessage variant="success" message={success} /> : null}

      <div className="pos-split">
        {canCreateProduct ? (
          <Surface>
            <h2 className="pos-section-title">Categories</h2>
            <form className="pos-form-grid" onSubmit={handleCategorySubmit}>
              <label>
                Name
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </label>
              <label>
                Icon key (optional)
                <input
                  value={categoryIconKey}
                  onChange={(e) => setCategoryIconKey(e.target.value)}
                  placeholder="cup"
                />
              </label>
              <div className="pos-form-actions">
                <Button type="submit" disabled={saving}>
                  {editingCategoryId ? "Update category" : "Add category"}
                </Button>
                {editingCategoryId ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    onClick={resetCategoryForm}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
            {categories.length > 0 ? (
              <ul className="pos-category-list">
                {categories.map((category) => (
                  <li key={category.id}>
                    <span>{category.name}</span>
                    <Badge tone={category.isActive ? "success" : "neutral"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {canUpdateProduct ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => startEditCategory(category)}
                      >
                        Edit
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </Surface>
        ) : null}

        {canCreateProduct ? (
          <Surface>
            <h2 className="pos-section-title">
              {editingProductId ? "Edit product" : "Add product"}
            </h2>
            <form className="pos-form-grid" onSubmit={handleProductSubmit}>
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
                Category
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
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
              <label>
                Stock state
                <select
                  value={stockState}
                  onChange={(e) =>
                    setStockState(e.target.value as ProductStockState)
                  }
                >
                  {STOCK_STATES.map((state) => (
                    <option key={state} value={state}>
                      {STOCK_STATE_LABELS[state]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Stock quantity (optional)
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="Informational only"
                />
              </label>
              <div className="pos-form-actions">
                <Button type="submit" disabled={saving}>
                  {editingProductId ? "Update product" : "Create product"}
                </Button>
                {editingProductId ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    onClick={resetProductForm}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </Surface>
        ) : null}

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
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    {canUpdateProduct ? <th /> : null}
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
                      <td>{product.category?.name ?? "—"}</td>
                      <td>{formatMoney(product.unitPriceCents)}</td>
                      <td>
                        <Badge
                          tone={
                            product.stockState === "in_stock"
                              ? "success"
                              :                             product.stockState === "low_stock"
                                ? "accent"
                                : "neutral"
                          }
                        >
                          {STOCK_STATE_LABELS[product.stockState]}
                        </Badge>
                        {product.stockQuantity != null ? (
                          <span className="pos-muted"> · {product.stockQuantity}</span>
                        ) : null}
                      </td>
                      {canUpdateProduct ? (
                        <td className="pos-table-actions">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => startEditProduct(product)}
                          >
                            Edit
                          </Button>
                          {STOCK_STATES.map((state) => (
                            <Button
                              key={state}
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={saving || product.stockState === state}
                              onClick={() => void handleQuickStock(product, state)}
                            >
                              {STOCK_STATE_LABELS[state]}
                            </Button>
                          ))}
                        </td>
                      ) : null}
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
