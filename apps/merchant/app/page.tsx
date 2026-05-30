"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  OrderResponse,
  ProductCategoryResponse,
  ProductResponse,
} from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import { MerchantGate } from "../components/merchant-gate";
import { OrderDetailPanel } from "../components/pos/order-detail-panel";
import { OrderLineCards } from "../components/pos/order-line-cards";
import { OrderLineStats } from "../components/pos/order-line-stats";
import { PosHeader } from "../components/pos/pos-header";
import { ProductGrid } from "../components/pos/product-grid";
import { NotificationFeedback } from "../components/ui/notification-feedback";
import { NOTIFICATION_UI_COPY } from "@airrand/notifications/templates";
import { LoadingState } from "../components/ui/loading-state";
import { PickupVerificationModal } from "../components/pickup-verification-modal";
import { useAuth } from "../components/auth-context";
import { useMerchant } from "../components/merchant-context";
import { useMerchantPermissions } from "../lib/use-merchant-permissions";
import { useMerchantRealtime } from "../lib/use-merchant-realtime";
import {
  fetchCategories,
  fetchOrders,
  fetchProducts,
  updateOrderStatus,
  updateProduct,
  updateProductStockState,
} from "../lib/api";
import { isActiveOrderStatus } from "../lib/order-progress";
function PosConsoleContent() {
  const { merchantId } = useMerchant();
  const { token } = useAuth();
  const { canUpdateProduct } = useMerchantPermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notificationInfo, setNotificationInfo] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<ProductCategoryResponse[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [pickupModalOrder, setPickupModalOrder] = useState<OrderResponse | null>(
    null,
  );

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!merchantId) {
      return;
    }
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [productList, categoryList, orderList] = await Promise.all([
        fetchProducts(merchantId),
        fetchCategories(merchantId),
        fetchOrders(merchantId),
      ]);
      setProducts(productList);
      setCategories(categoryList);
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
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load console");
    } finally {
      if (options?.silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const { connectionStatus } = useMerchantRealtime({
    merchantId,
    token,
    enabled: Boolean(merchantId) && !loading && !saving,
    onRefresh: () => load({ silent: true }),
  });

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
    setNotificationInfo(null);
    try {
      await updateOrderStatus(merchantId, orderId, status);
      setSuccess(`Order updated to ${status.replace("_", " ")}.`);
      setNotificationInfo(
        status === "ready" ? NOTIFICATION_UI_COPY.orderReadyQueued : null,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setSaving(false);
    }
  }

  async function handleStockStateChange(
    product: ProductResponse,
    stockState: ProductResponse["stockState"],
  ) {
    if (!merchantId) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProductStockState(merchantId, product.id, stockState);
      setSuccess(`"${product.name}" stock set to ${stockState.replace("_", " ")}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stock");
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

  function openPickupModal(order?: OrderResponse) {
    setPickupModalOrder(order ?? null);
    setPickupModalOpen(true);
  }

  function closePickupModal() {
    setPickupModalOpen(false);
    setPickupModalOrder(null);
  }

  return (
    <div className="pos-console">
      {error ? <NotificationFeedback kind="error" message={error} /> : null}
      {success ? <NotificationFeedback kind="actionSuccess" message={success} /> : null}
      {notificationInfo ? (
        <NotificationFeedback kind="notificationQueued" message={notificationInfo} />
      ) : null}

      {loading ? (
        <LoadingState label="Loading merchant console…" />
      ) : (
        <div className="pos-dashboard">
          <div className="pos-dashboard__main">
            <PosHeader
              lastUpdated={lastUpdated}
              onRefresh={() => void load({ silent: true })}
              refreshing={refreshing}
              connectionStatus={connectionStatus}
            />

            <section className="pos-section" aria-label="Order line">
              <OrderLineStats orders={orders} />
              <h2 className="pos-section-title pos-section-title--inline">
                Active order queue
              </h2>
              <OrderLineCards
                orders={activeOrders}
                selectedOrderId={selectedOrderId}
                onSelect={setSelectedOrderId}
                onVerifyPickup={openPickupModal}
              />
            </section>

            <section className="pos-section" aria-label="Menu">
              <h2 className="pos-section-title">Menu</h2>
              <ProductGrid
                products={products}
                categories={categories}
                saving={saving}
                canManageProducts={canUpdateProduct}
                onToggleAvailability={handleToggleAvailability}
                onStockStateChange={handleStockStateChange}
              />
            </section>
          </div>

          <aside className="pos-dashboard__rail" aria-label="Current order">
            <OrderDetailPanel
              order={selectedOrder}
              saving={saving}
              onStatusChange={handleStatusChange}
            />
          </aside>
        </div>
      )}

      <PickupVerificationModal
        open={pickupModalOpen}
        onClose={closePickupModal}
        orderReference={pickupModalOrder?.reference ?? null}
        onVerified={() => {
          void load({ silent: true });
          setSuccess("Pickup verified successfully.");
        }}
      />
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
