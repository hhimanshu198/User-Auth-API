import { useState } from "react";
import toast from "react-hot-toast";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import JsonBox from "../components/JsonBox.jsx";
import api, { getApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { roleName } from "../utils/format.js";

const nlacExamples = [
  "Can I delete a user?",
  "Can I view other users' profiles?",
  "Can non-admins delete users?",
  "Can admins manage all users?",
  "Can I access the pro feature?"
];

export default function Access() {
  const { user } = useAuth();

  const [query, setQuery] = useState("Can I delete a user?");
  const [response, setResponse] = useState(null);
  const [lastAction, setLastAction] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  const runRequest = async ({ label, request }) => {
    setError("");
    setLoadingAction(label);

    try {
      const result = await request();

      setResponse(result.data);
      setLastAction(label);

      toast.success(`${label} completed`);
    } catch (err) {
      setError(getApiError(err, `${label} failed`));
      setResponse(err?.response?.data || null);
      setLastAction(label);
    } finally {
      setLoadingAction("");
    }
  };

  const testBasicFeature = () => {
    runRequest({
      label: "Basic feature",
      request: () => api.get("/users/basic")
    });
  };

  const testProFeature = () => {
    runRequest({
      label: "Pro feature",
      request: () => api.get("/users/pro")
    });
  };

  const testMyProfile = () => {
    runRequest({
      label: "My profile",
      request: () => api.get("/users/me")
    });
  };

  const checkNaturalAccess = (event) => {
    event?.preventDefault();

    if (!query.trim()) {
      setError("Natural language query is required");
      return;
    }

    runRequest({
      label: "Natural language access",
      request: () =>
        api.post("/nlac/check", {
          request: query.trim()
        })
    });
  };

  const useExample = (text) => {
    setQuery(text);
    setError("");
  };

  const clearOutput = () => {
    setResponse(null);
    setLastAction("");
    setError("");
  };

  const copyResponse = async () => {
    if (!response) {
      toast.error("No response to copy");
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    toast.success("Response copied");
  };

  return (
    <div className="page-stack access-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Access lab</p>
          <h1>RBAC Permission Testing</h1>
          <p className="muted">
            Test protected routes, role-based permissions, and natural language
            access control from one interactive panel.
          </p>
        </div>

        <div className="page-actions">
          <Button variant="secondary" onClick={clearOutput}>
            Clear output
          </Button>

          <Button
            variant="primary"
            loading={loadingAction === "Natural language access"}
            onClick={checkNaturalAccess}
          >
            Check access
          </Button>
        </div>
      </div>

      <Alert type="danger" onClose={() => setError("")}>
        {error}
      </Alert>

      <div className="access-identity-card">
        <div>
          <span className="identity-label">Logged in as</span>
          <strong>{user?.name || "User"}</strong>
          <p>{user?.email || "No email available"}</p>
        </div>

        <div>
          <span className="identity-label">Current role</span>
          <strong>{roleName(user?.role_id)}</strong>
          <p>Role ID: {user?.role_id || "—"}</p>
        </div>

        <div>
          <span className="identity-label">Access model</span>
          <strong>JWT + RBAC</strong>
          <p>Authorization header protected</p>
        </div>
      </div>

      <div className="two-column wide-left">
        <Card
          title="Protected route tests"
          subtitle="Run backend routes that depend on authentication, roles, or plan access."
        >
          <div className="action-grid premium-action-grid">
            <button
              type="button"
              className="access-action"
              onClick={testMyProfile}
              disabled={Boolean(loadingAction)}
            >
              <strong>My profile</strong>
              <span>GET /users/me</span>
              <small>Requires valid JWT token</small>
            </button>

            <button
              type="button"
              className="access-action"
              onClick={testBasicFeature}
              disabled={Boolean(loadingAction)}
            >
              <strong>Basic feature</strong>
              <span>GET /users/basic</span>
              <small>Available to basic allowed users</small>
            </button>

            <button
              type="button"
              className="access-action"
              onClick={testProFeature}
              disabled={Boolean(loadingAction)}
            >
              <strong>Pro feature</strong>
              <span>GET /users/pro</span>
              <small>Tests plan/permission restriction</small>
            </button>
          </div>

          {loadingAction && loadingAction !== "Natural language access" && (
            <div className="inline-loading">
              <span className="btn-loader" />
              Running {loadingAction}...
            </div>
          )}
        </Card>

        <Card title="Access guide" subtitle="How to explain this page in demo.">
          <div className="access-guide-list">
            <div>
              <strong>Authentication</strong>
              <p>Every protected request sends the JWT token from localStorage.</p>
            </div>

            <div>
              <strong>Authorization</strong>
              <p>The backend decides whether the logged-in user can access a route.</p>
            </div>

            <div>
              <strong>Natural language access</strong>
              <p>
                The user writes a normal English permission question and the
                backend maps it to action/resource policy.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Natural Language Access Control"
        subtitle="Ask permission questions in plain English."
      >
        <form className="nlac-form" onSubmit={checkNaturalAccess}>
          <label>
            Access query
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Example: Can I delete a user?"
              rows={4}
            />
          </label>

          <div className="nlac-actions">
            <Button
              type="submit"
              variant="primary"
              loading={loadingAction === "Natural language access"}
            >
              Evaluate query
            </Button>
          </div>
        </form>

        <div className="example-section">
          <div className="mini-section-title">
            <strong>Quick access questions</strong>
            <span>Use these to test your NLAC engine faster</span>
          </div>

          <div className="chip-list">
            {nlacExamples.map((item) => (
              <button
                key={item}
                type="button"
                className="chip"
                onClick={() => useExample(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card
        title="Access response"
        subtitle="Raw backend result from the selected access test."
      >
        <div className="response-toolbar">
          <div>
            <strong>{lastAction || "No request executed yet"}</strong>
            <p>
              {lastAction
                ? "Backend response is shown below."
                : "Run any access test to view output."}
            </p>
          </div>

          <div className="response-meta">
            {response?.success !== undefined && (
              <span>{response.success ? "Success" : "Failed"}</span>
            )}

            {response?.result?.allowed !== undefined && (
              <span>{response.result.allowed ? "Allowed" : "Denied"}</span>
            )}

            <Button variant="secondary" onClick={copyResponse}>
              Copy JSON
            </Button>
          </div>
        </div>

        {response ? (
          <JsonBox data={response} />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <h3>No access result yet</h3>
            <p>Test a protected route or natural language permission query.</p>
          </div>
        )}
      </Card>
    </div>
  );
}