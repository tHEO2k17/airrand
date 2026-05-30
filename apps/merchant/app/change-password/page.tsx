"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertMessage } from "../../components/ui/alert-message";
import { Button } from "../../components/ui/button";
import { Surface } from "../../components/ui/surface";
import { useAuth } from "../../components/auth-context";
import { changeMerchantPassword } from "../../lib/auth-api";
import { saveSession } from "../../lib/auth-session";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, token, mustChangePassword, applyPasswordChange } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await changeMerchantPassword(
        {
          currentPassword: mustChangePassword ? undefined : currentPassword,
          newPassword,
        },
        token,
      );
      saveSession({ token: result.token });
      applyPasswordChange(result.user);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pos-login-page">
      <Surface className="pos-login-card">
        <h1>{mustChangePassword ? "Set a new password" : "Change password"}</h1>
        <p className="pos-muted">
          {mustChangePassword
            ? "Your account uses a temporary password. Choose a new password before using the merchant app."
            : "Update your sign-in password."}
        </p>
        {user ? (
          <p className="pos-muted" style={{ marginBottom: "1rem" }}>
            Signed in as <strong>{user.email}</strong>
          </p>
        ) : null}
        {error ? <AlertMessage variant="error" message={error} /> : null}
        <form className="pos-form-grid" onSubmit={(event) => void handleSubmit(event)}>
          {!mustChangePassword ? (
            <label className="pos-field">
              <span>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
          ) : null}
          <label className="pos-field">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className="pos-field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save password"}
          </Button>
        </form>
      </Surface>
    </div>
  );
}
