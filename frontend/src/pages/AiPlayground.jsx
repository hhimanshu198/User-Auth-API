import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import JsonBox from "../components/JsonBox.jsx";
import api, { getApiError } from "../services/api.js";

const examples = [
  "Explain JWT authentication in simple words",
  "Give me 5 best security practices for an auth API",
  "Explain role based access control with an example",
  "Write a short project summary for my Auth RBAC API",
  "How can AI usage limits protect my backend?"
];

export default function AiPlayground() {
  const [prompt, setPrompt] = useState(examples[0]);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [responseTime, setResponseTime] = useState(null);

  const canSubmit = prompt.trim().length >= 3 && !loading;

  const promptStats = useMemo(() => {
    const trimmed = prompt.trim();

    return {
      characters: trimmed.length,
      words: trimmed ? trimmed.split(/\s+/).length : 0
    };
  }, [prompt]);

  const runPrompt = async (event) => {
    event.preventDefault();

    if (!prompt.trim()) {
      setError("Prompt is required");
      return;
    }

    if (prompt.trim().length < 3) {
      setError("Prompt must be at least 3 characters");
      return;
    }

    setError("");
    setLoading(true);
    setResponseTime(null);

    const startTime = performance.now();

    try {
      const result = await api.post("/usage/test-ai", {
        prompt: prompt.trim()
      });

      const endTime = performance.now();

      setResponse(result.data);
      setLastPrompt(prompt.trim());
      setResponseTime(Math.round(endTime - startTime));

      toast.success("AI request completed");
    } catch (err) {
      setError(getApiError(err, "Unable to run AI request"));
    } finally {
      setLoading(false);
    }
  };

  const useExample = (text) => {
    setPrompt(text);
    setError("");
  };

  const clearOutput = () => {
    setResponse(null);
    setLastPrompt("");
    setResponseTime(null);
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
    <div className="page-stack ai-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">AI playground</p>
          <h1>Test AI Usage</h1>
          <p className="muted">
            Run AI prompts, test token/cost limits, verify caching behavior, and
            demonstrate your backend AI usage system.
          </p>
        </div>

        <div className="page-actions">
          <Button variant="secondary" onClick={clearOutput}>
            Clear output
          </Button>

          <Button variant="primary" loading={loading} onClick={runPrompt}>
            Run prompt
          </Button>
        </div>
      </div>

      <Alert type="danger" onClose={() => setError("")}>
        {error}
      </Alert>

      <div className="two-column wide-left">
        <Card
          title="Prompt console"
          subtitle="Send a prompt to your backend AI usage test endpoint."
          className="ai-console-card"
        >
          <form className="form-stack" onSubmit={runPrompt}>
            <label>
              Prompt
              <textarea
                className="prompt-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Enter a prompt to test AI usage..."
                rows={8}
              />
            </label>

            <div className="prompt-footer">
              <div className="prompt-stats">
                <span>{promptStats.words} words</span>
                <span>{promptStats.characters} chars</span>
              </div>

              <Button type="submit" variant="primary" loading={loading} disabled={!canSubmit}>
                Run AI request
              </Button>
            </div>
          </form>

          <div className="example-section">
            <div className="mini-section-title">
              <strong>Quick prompts</strong>
              <span>Click any example to test faster</span>
            </div>

            <div className="chip-list">
              {examples.map((item) => (
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

        <Card title="Request details" subtitle="Useful for explaining your project.">
          <div className="ai-info-list">
            <div>
              <span>Endpoint</span>
              <strong>POST /usage/test-ai</strong>
            </div>

            <div>
              <span>Purpose</span>
              <strong>AI usage testing</strong>
            </div>

            <div>
              <span>Cache test</span>
              <strong>Run same prompt twice</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{loading ? "Running..." : response ? "Completed" : "Idle"}</strong>
            </div>
          </div>

          <div className="ai-tip-box">
            <strong>Demo tip</strong>
            <p>
              Run one prompt, then run the exact same prompt again. If your
              backend cache is enabled, the second response should be faster or
              marked as cached depending on your backend response.
            </p>
          </div>
        </Card>
      </div>

      <Card
        title="AI response"
        subtitle="Raw backend response from the AI usage endpoint."
        className="ai-response-card"
      >
        <div className="response-toolbar">
          <div>
            <strong>{lastPrompt ? "Last prompt" : "No prompt executed yet"}</strong>
            {lastPrompt && <p>{lastPrompt}</p>}
          </div>

          <div className="response-meta">
            {responseTime !== null && <span>{responseTime} ms</span>}

            {response?.cached !== undefined && (
              <span>{response.cached ? "Cached" : "Fresh"}</span>
            )}

            <Button variant="secondary" onClick={copyResponse}>
              Copy JSON
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="ai-loading-box">
            <div className="premium-spinner" />
            <p>Running AI request...</p>
          </div>
        ) : response ? (
          <JsonBox data={response} />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <h3>No response yet</h3>
            <p>Write a prompt and run the request to see backend output here.</p>
          </div>
        )}
      </Card>
    </div>
  );
}