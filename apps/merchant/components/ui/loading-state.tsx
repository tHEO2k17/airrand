export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="pos-loading" role="status" aria-live="polite">
      <span className="pos-loading__spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
