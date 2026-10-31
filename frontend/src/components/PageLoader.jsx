export default function PageLoader({ text = "Loading..." }) {
  return (
    <div className="page-loader">
      <div className="premium-spinner" />
      <p>{text}</p>
    </div>
  );
}