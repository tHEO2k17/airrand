"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "./loading-state";
import { useAuth } from "./auth-context";

const PUBLIC_PATHS = ["/login"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, loading } = useAuth();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!token && !isPublic) {
      router.replace("/login");
      return;
    }

    if (token && pathname === "/login") {
      router.replace("/");
    }
  }, [isPublic, loading, pathname, router, token]);

  if (loading) {
    return <LoadingState label="Checking session…" />;
  }

  if (!token && !isPublic) {
    return <LoadingState label="Redirecting to login…" />;
  }

  if (token && pathname === "/login") {
    return <LoadingState label="Redirecting…" />;
  }

  return <>{children}</>;
}
