export default function EmptyState({ title = "Nothing here yet", text = "Data will appear here once available." }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">⌁</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
