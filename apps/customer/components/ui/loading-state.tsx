export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="store-loading" role="status" aria-live="polite">
      <span className="store-loading__spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
