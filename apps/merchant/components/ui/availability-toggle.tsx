export function AvailabilityToggle({
  available,
  disabled,
  onChange,
  label = "Available",
}: {
  available: boolean;
  disabled?: boolean;
  onChange: () => void;
  label?: string;
}) {
  return (
    <label className="pos-availability-toggle">
      <span className="pos-availability-toggle__label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={available}
        className={`pos-availability-toggle__switch ${available ? "is-on" : ""}`}
        disabled={disabled}
        onClick={onChange}
      >
        <span className="pos-availability-toggle__thumb" />
      </button>
    </label>
  );
}
