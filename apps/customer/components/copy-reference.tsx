"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "./ui/button";

export function CopyReference({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="secondary" onClick={() => void handleCopy()}>
      <Copy size={16} aria-hidden />
      {copied ? "Reference copied" : "Copy reference"}
    </Button>
  );
}
