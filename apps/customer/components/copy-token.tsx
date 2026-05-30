"use client";

import { useState } from "react";

export function CopyToken({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="copy-token">
      <pre className="token-block">{token}</pre>
      <button type="button" className="btn btn-secondary" onClick={() => void handleCopy()}>
        {copied ? "Copied" : "Copy token"}
      </button>
    </div>
  );
}
