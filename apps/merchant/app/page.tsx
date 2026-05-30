"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderResponse, ProductResponse } from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import { MerchantGate } from "../components/merchant-gate";
import { OrderDetailPanel } from "../components/pos/order-detail-panel";
import { OrderLineCards } from "../components/pos/order-line-cards";
import { OrderSummaryCard } from "../components/pos/order-summary-card";
import { PosHeader } from "../components/pos/pos-header";
import { ProductGrid } from "../components/pos/product-grid";
import { AlertMessage } from "../components/ui/alert-message";
import { LoadingState } from "../components/ui/loading-state";
import { useMerchant } from "../components/merchant-context";
import {
  fetchOrders,
  fetchProducts,
  updateOrderStatus,
  updateProduct,
} from "../lib/api";
import { isActiveOrderStatus } from "../lib/order-progress";

function PosConsoleContent() {
  const { merchantId } = useMerchant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [productList, orderList] = await Promise.all([
        fetchProducts(merchantId),
        fetchOrders(merchantId),
      ]);
      setProducts(productList);
      const sorted = [...orderList].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setOrders(sorted);
      setSelectedOrderId((current) => {
        if (current && sorted.some((o) => o.id === current)) {
          return current;
        }
        const firstActive = sorted.find((o) => isActiveOrderStatus(o.status));
        return firstActive?.id ?? sorted[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load console");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeOrders = useMemo(
    () => orders.filter((o) => isActiveOrderStatus(o.status)),
    [orders],
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    if (!merchantId) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateOrderStatus(merchantId, orderId, status);
      setSuccess(`Order updated to ${status.replace("_", " ")}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAvailability(product: ProductResponse) {
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
        `"${product.name}" is now ${product.isAvailable ? "unavailable" : "available"}.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pos-console">
      <PosHeader />

      {error ? <AlertMessage variant="error" message={error} /> : null}
      {success ? <AlertMessage variant="success" message={success} /> : null}

      {loading ? (
        <LoadingState label="Loading merchant console…" />
      ) : (
        <>
          <section className="pos-section" aria-label="Order queue">
            <h2 className="pos-section-title">Active order queue</h2>
            <OrderLineCards
              orders={activeOrders}
              selectedOrderId={selectedOrderId}
              onSelect={setSelectedOrderId}
            />
          </section>

          <div className="pos-workspace-grid">
            <section className="pos-section" aria-label="Menu">
              <h2 className="pos-section-title">Menu</h2>
              <ProductGrid
                products={products}
                saving={saving}
                onToggleAvailability={handleToggleAvailability}
              />
            </section>

            <aside className="pos-right-rail" aria-label="Order details">
              <OrderDetailPanel
                order={selectedOrder}
                saving={saving}
                onStatusChange={handleStatusChange}
              />
              <OrderSummaryCard order={selectedOrder} />
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

export default function PosDashboardPage() {
  return (
    <MerchantGate>
      <PosConsoleContent />
    </MerchantGate>
  );
}
