import type {
  AssignableStaffRole,
  AuditLogResponse,
  CreateProductInput,
  CreateStaffRequest,
  MerchantResponse,
  OrderResponse,
  PickupVerifyResponse,
  ProductResponse,
  StaffMemberResponse,
  UpdateProductInput,
} from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import { getApiBaseUrl } from "./config";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

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
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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

export async function fetchOrders(
  merchantId: string,
  options?: { reference?: string },
): Promise<OrderResponse[]> {
  const params = new URLSearchParams();
  if (options?.reference?.trim()) {
    params.set("reference", options.reference.trim());
  }
  const query = params.toString();
  const data = await request<{ orders: OrderResponse[] }>(
    `/merchants/${merchantId}/orders${query ? `?${query}` : ""}`,
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

export async function fetchAuditLogs(
  merchantId: string,
): Promise<AuditLogResponse[]> {
  const data = await request<{ auditLogs: AuditLogResponse[] }>(
    `/merchants/${merchantId}/audit-logs`,
  );
  return data.auditLogs;
}

export async function fetchStaff(merchantId: string): Promise<StaffMemberResponse[]> {
  const data = await request<{ staff: StaffMemberResponse[] }>(
    `/merchants/${merchantId}/staff`,
  );
  return data.staff;
}

export async function createStaffMember(
  merchantId: string,
  input: CreateStaffRequest,
): Promise<StaffMemberResponse> {
  const data = await request<{ staff: StaffMemberResponse }>(
    `/merchants/${merchantId}/staff`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return data.staff;
}

export async function updateStaffMemberRole(
  merchantId: string,
  merchantUserId: string,
  role: AssignableStaffRole,
): Promise<StaffMemberResponse> {
  const data = await request<{ staff: StaffMemberResponse }>(
    `/merchants/${merchantId}/staff/${merchantUserId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
  return data.staff;
}

export async function deactivateStaffMember(
  merchantId: string,
  merchantUserId: string,
): Promise<StaffMemberResponse> {
  const data = await request<{ staff: StaffMemberResponse }>(
    `/merchants/${merchantId}/staff/${merchantUserId}/deactivate`,
    {
      method: "POST",
    },
  );
  return data.staff;
}
