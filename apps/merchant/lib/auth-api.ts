import type {
  MerchantAuthResponse,
  MerchantLoginInput,
  MerchantMeResponse,
} from "@airrand/contracts";
import { getApiBaseUrl } from "./config";
import { ApiError } from "./api";

type ApiEnvelope<T> = { data: T } | { error: { code: string; message: string } };

async function authRequest<T>(
  path: string,
  init?: RequestInit,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || "error" in body) {
    const err = "error" in body ? body.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(err.code, err.message, res.status);
  }

  return body.data;
}

export async function loginMerchant(
  input: MerchantLoginInput,
): Promise<MerchantAuthResponse> {
  return authRequest<MerchantAuthResponse>("/auth/merchant/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutMerchant(token: string | null): Promise<void> {
  await authRequest<{ loggedOut: boolean }>(
    "/auth/merchant/logout",
    { method: "POST" },
    token,
  );
}

export async function fetchMerchantMe(token: string): Promise<MerchantMeResponse> {
  return authRequest<MerchantMeResponse>("/auth/merchant/me", undefined, token);
}
