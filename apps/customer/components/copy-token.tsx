"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "./ui/button";

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
    <div className="store-copy">
      <pre className="store-token-block">{token}</pre>
      <Button variant="secondary" onClick={() => void handleCopy()}>
        <Copy size={16} aria-hidden />
        {copied ? "Copied" : "Copy pickup token"}
      </Button>
    </div>
  );
}
