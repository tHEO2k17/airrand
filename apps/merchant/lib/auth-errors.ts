export function isAccountLockedError(code: string): boolean {
  return code.toLowerCase() === "account_locked";
}

export function isSessionRevokedError(code: string): boolean {
  return code === "SESSION_REVOKED" || code === "EXPIRED_TOKEN";
}

export function sessionEndedMessage(code: string): string {
  if (code === "SESSION_REVOKED") {
    return "Your session was ended. Please sign in again.";
  }
  if (code === "EXPIRED_TOKEN") {
    return "Your session has expired. Please sign in again.";
  }
  return "Please sign in again.";
}
