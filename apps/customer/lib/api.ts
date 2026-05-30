import type {
  CreateOrderInput,
  CreateOrderResponse,
  CustomerOrderStatusResponse,
  MerchantResponse,
  ProductResponse,
} from "@airrand/contracts";
import { getApiBaseUrl } from "./config";
import { normalizeStoreSlug } from "./store-slug";

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

export async function fetchMerchantBySlug(slug: string): Promise<MerchantResponse> {
  const encoded = encodeURIComponent(normalizeStoreSlug(slug));
  return request<MerchantResponse>(`/merchants/by-slug/${encoded}`);
}

export async function fetchAvailableProducts(
  merchantId: string,
): Promise<ProductResponse[]> {
  const data = await request<{ products: ProductResponse[] }>(
    `/merchants/${merchantId}/products?availableOnly=true`,
  );
  return data.products;
}

export async function fetchAvailableProductsBySlug(
  merchantSlug: string,
): Promise<ProductResponse[]> {
  const encoded = encodeURIComponent(normalizeStoreSlug(merchantSlug));
  const data = await request<{ products: ProductResponse[] }>(
    `/merchants/by-slug/${encoded}/products?availableOnly=true`,
  );
  return data.products;
}

export async function createOrder(
  merchantId: string,
  input: CreateOrderInput,
): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>(`/merchants/${merchantId}/orders`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchOrderStatus(
  merchantId: string,
  orderId: string,
): Promise<CustomerOrderStatusResponse> {
  return request<CustomerOrderStatusResponse>(
    `/merchants/${merchantId}/orders/${orderId}/status`,
  );
}

export async function fetchOrderStatusByReference(
  merchantId: string,
  reference: string,
): Promise<CustomerOrderStatusResponse> {
  const encoded = encodeURIComponent(reference.trim());
  return request<CustomerOrderStatusResponse>(
    `/merchants/${merchantId}/orders/by-reference/${encoded}/status`,
  );
}

export async function fetchOrderStatusByMerchantSlug(
  merchantSlug: string,
  reference: string,
): Promise<CustomerOrderStatusResponse> {
  const slug = encodeURIComponent(normalizeStoreSlug(merchantSlug));
  const encodedReference = encodeURIComponent(reference.trim());
  return request<CustomerOrderStatusResponse>(
    `/merchants/by-slug/${slug}/orders/by-reference/${encodedReference}/status`,
  );
}
