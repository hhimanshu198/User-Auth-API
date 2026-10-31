export default function Button({
  children,
  type = "button",
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="btn-loader" /> : children}
    </button>
  );
}