export default function Alert({ type = "info", children, onClose }) {
  if (!children) return null;

  return (
    <div className={`alert alert-${type}`}>
      <span>{children}</span>
      {onClose ? (
        <button className="icon-btn" onClick={onClose} aria-label="Close alert">
          ×
        </button>
      ) : null}
    </div>
  );
}
