import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";

export const REQUEST_ID_HEADER = "x-request-id";

declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
  }
}

export function requestIdMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const incoming = c.req.header(REQUEST_ID_HEADER)?.trim();
    const requestId =
      incoming && incoming.length > 0 && incoming.length <= 128
        ? incoming
        : randomUUID();

    c.set("requestId", requestId);
    c.header(REQUEST_ID_HEADER, requestId);
    await next();
  };
}
