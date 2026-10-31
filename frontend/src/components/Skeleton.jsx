export default function Skeleton({ height = 18, width = "100%" }) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width
      }}
    />
  );
}