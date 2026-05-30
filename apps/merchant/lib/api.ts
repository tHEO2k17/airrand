import type {
  CreateProductInput,
  MerchantResponse,
  OrderResponse,
  PickupVerifyResponse,
  ProductResponse,
  UpdateProductInput,
} from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import { getApiBaseUrl } from "./config";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiEnvelope<T> = { data: T } | { error: { code: string; message: string } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || "error" in body) {
    const err = "error" in body ? body.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(err.code, err.message, res.status);
  }

  return body.data;
}

export async function fetchMerchants(): Promise<MerchantResponse[]> {
  const data = await request<{ merchants: MerchantResponse[] }>("/merchants");
  return data.merchants;
}

export async function fetchProducts(merchantId: string): Promise<ProductResponse[]> {
  const data = await request<{ products: ProductResponse[] }>(
    `/merchants/${merchantId}/products`,
  );
  return data.products;
}

export async function createProduct(
  merchantId: string,
  input: CreateProductInput,
): Promise<ProductResponse> {
  return request<ProductResponse>(`/merchants/${merchantId}/products`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProduct(
  merchantId: string,
  productId: string,
  input: UpdateProductInput,
): Promise<ProductResponse> {
  return request<ProductResponse>(
    `/merchants/${merchantId}/products/${productId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function fetchOrders(merchantId: string): Promise<OrderResponse[]> {
  const data = await request<{ orders: OrderResponse[] }>(
    `/merchants/${merchantId}/orders`,
  );
  return data.orders;
}

export async function updateOrderStatus(
  merchantId: string,
  orderId: string,
  status: OrderStatus,
): Promise<OrderResponse> {
  return request<OrderResponse>(
    `/merchants/${merchantId}/orders/${orderId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export async function verifyPickup(
  merchantId: string,
  orderId: string,
  token: string,
): Promise<PickupVerifyResponse> {
  return request<PickupVerifyResponse>(
    `/merchants/${merchantId}/orders/${orderId}/pickup/verify`,
    {
      method: "POST",
      body: JSON.stringify({ token }),
    },
  );
}
