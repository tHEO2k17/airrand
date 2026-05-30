export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="pos-stat-tile">
      <p className="pos-stat-tile__label">{label}</p>
      <p className="pos-stat-tile__value">{value}</p>
      {hint ? <p className="pos-stat-tile__hint">{hint}</p> : null}
    </div>
  );
}
