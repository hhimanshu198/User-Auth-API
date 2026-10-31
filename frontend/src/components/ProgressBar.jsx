export default function ProgressBar({ label, value = 0, rightText = "" }) {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100);

  return (
    <div className="progress-item">
      <div className="progress-header">
        <span>{label}</span>
        <strong>{rightText}</strong>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${safeValue}%`
          }}
        />
      </div>
    </div>
  );
}