"use client";

import { FormEvent, useState } from "react";
import { Alert } from "../../components/alert";
import { useAuth } from "../../components/auth-context";
import { ApiError } from "../../lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("owner@demo-cafe.test");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel page-shell" style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h1>Merchant sign in</h1>
      <p className="muted">
        Local demo credentials only. Do not use in production.
      </p>

      {error ? <Alert variant="error" message={error} /> : null}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
