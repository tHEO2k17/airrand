import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function jsonOk<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ data }, status);
}

export function jsonError(
  c: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode = 400,
) {
  return c.json({ error: { code, message } }, status);
}
