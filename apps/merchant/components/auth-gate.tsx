"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "./ui/loading-state";
import { useAuth } from "./auth-context";

const PUBLIC_PATHS = ["/login", "/setup"];
const PASSWORD_CHANGE_PATH = "/change-password";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, loading, mustChangePassword } = useAuth();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isPasswordChange = pathname === PASSWORD_CHANGE_PATH;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!token && !isPublic) {
      router.replace("/login");
      return;
    }

    if (token && mustChangePassword && !isPasswordChange) {
      router.replace(PASSWORD_CHANGE_PATH);
      return;
    }

    if (token && pathname === "/login") {
      router.replace(mustChangePassword ? PASSWORD_CHANGE_PATH : "/");
    }
  }, [isPasswordChange, isPublic, loading, mustChangePassword, pathname, router, token]);

  if (loading) {
    return <LoadingState label="Checking session…" />;
  }

  if (!token && !isPublic) {
    return <LoadingState label="Redirecting to login…" />;
  }

  if (token && mustChangePassword && !isPasswordChange) {
    return <LoadingState label="Password change required…" />;
  }

  if (token && pathname === "/login") {
    return <LoadingState label="Redirecting…" />;
  }

  return <>{children}</>;
}
