import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="not-found">
      <div>
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The page you opened does not exist.</p>
        <Link className="btn btn-primary" to="/dashboard">Go to dashboard</Link>
      </div>
    </main>
  );
}
