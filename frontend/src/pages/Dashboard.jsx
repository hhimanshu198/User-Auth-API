import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import toast from "react-hot-toast";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import MetricCard from "../components/MetricCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import Skeleton from "../components/Skeleton.jsx";
import api, { getApiError } from "../services/api.js";
import { money, number, percentage, roleName } from "../utils/format.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, refreshProfile, loadingProfile } = useAuth();

  const [usage, setUsage] = useState(null);
  const [health, setHealth] = useState({
    backend: "checking",
    auth: "checking",
    usage: "checking"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setError("");
    setLoading(true);

    try {
      setHealth({
        backend: "checking",
        auth: "checking",
        usage: "checking"
      });

      await refreshProfile();

      setHealth((previous) => ({
        ...previous,
        auth: "online"
      }));

      const usageResponse = await api.get("/usage/me");
      setUsage(usageResponse.data);

      setHealth({
        backend: "online",
        auth: "online",
        usage: "online"
      });
    } catch (err) {
      setError(getApiError(err, "Unable to load dashboard"));

      setHealth((previous) => ({
        ...previous,
        backend: "error",
        usage: "error"
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const tokenPercent = percentage(
    usage?.usage?.tokensUsed,
    usage?.plan?.monthlyTokenLimit
  );

  const costPercent = percentage(
    usage?.usage?.costUsed,
    usage?.plan?.monthlyCostLimit
  );

  const planName = usage?.plan?.name || "Basic";

  /*
    Important:
    We are using percentage-based chart data here.

    Why?
    Tokens and cost have very different scales.
    Example:
    tokens = 5000 / 100000
    cost = 0.02 / 1

    If both are shown as raw values on the same Y-axis, the cost bar becomes
    invisible or misleading. So the chart compares usage percentage instead.
  */
  const chartData = useMemo(
    () => [
      {
        name: "Tokens",
        Usage: Number(tokenPercent) || 0,
        usedValue: number(usage?.usage?.tokensUsed),
        limitValue: number(usage?.plan?.monthlyTokenLimit)
      },
      {
        name: "Cost",
        Usage: Number(costPercent) || 0,
        usedValue: money(usage?.usage?.costUsed),
        limitValue: money(usage?.plan?.monthlyCostLimit)
      }
    ],
    [usage, tokenPercent, costPercent]
  );

  const copyToken = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("No token found");
      return;
    }

    await navigator.clipboard.writeText(token);
    toast.success("JWT token copied");
  };

  return (
    <div className="page-stack dashboard-page">
      <Alert type="danger" onClose={() => setError("")}>
        {error}
      </Alert>

      <section className="dashboard-hero premium-hero">
        <div className="hero-content">
          <p className="eyebrow">Project frontend</p>

          <h1>Hello, {user?.name || "User"} 👋</h1>

          <p className="muted hero-text">
            Monitor authentication, role based permissions, AI usage limits,
            fallback handling, and API health from one clean control center.
          </p>

          <div className="hero-meta">
            <span>{roleName(user?.role_id)}</span>
            <span>{planName} plan</span>
            <span>
              {health.backend === "online" ? "API online" : "Checking API"}
            </span>
          </div>
        </div>

        <div className="hero-panel">
          <div>
            <span>Monthly usage</span>
            <strong>{tokenPercent}%</strong>
            <p>Token limit consumed</p>
          </div>

          <div className="mini-progress">
            <div style={{ width: `${Math.min(tokenPercent, 100)}%` }} />
          </div>

          <div className="hero-actions">
            <Button variant="primary" onClick={copyToken}>
              Copy token
            </Button>

            <Button
              variant="secondary"
              loading={loading || loadingProfile}
              onClick={loadDashboard}
            >
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <div className="health-grid">
        <HealthItem label="Backend API" status={health.backend} icon="●" />
        <HealthItem label="Authentication" status={health.auth} icon="◆" />
        <HealthItem label="Usage service" status={health.usage} icon="▲" />
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="Current role"
          value={roleName(user?.role_id)}
          hint={`Role ID: ${user?.role_id || "—"}`}
        />

        <MetricCard
          label="Active plan"
          value={loading ? "Loading..." : planName}
          hint={usage?.plan?.fallbackApplied ? "Fallback applied" : "Normal mode"}
        />

        <MetricCard
          label="Tokens used"
          value={loading ? "..." : number(usage?.usage?.tokensUsed)}
          hint={`${tokenPercent}% of monthly limit`}
        />

        <MetricCard
          label="Cost used"
          value={loading ? "..." : money(usage?.usage?.costUsed)}
          hint={`${costPercent}% of monthly limit`}
        />
      </div>

      <div className="two-column wide-left">
        <Card
          title="Usage analytics"
          subtitle="Percentage-based comparison, so token and cost usage are shown correctly."
        >
          {loading ? (
            <div className="skeleton-stack">
              <Skeleton height={28} />
              <Skeleton height={300} />
            </div>
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 8
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.18)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: "#cbd5e1",
                      fontSize: 13,
                      fontWeight: 700
                    }}
                    axisLine={{
                      stroke: "rgba(148, 163, 184, 0.24)"
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{
                      fill: "#cbd5e1",
                      fontSize: 12,
                      fontWeight: 700
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    cursor={{
                      fill: "rgba(124, 58, 237, 0.12)"
                    }}
                    content={<UsageTooltip />}
                  />

                  <Bar
                    dataKey="Usage"
                    fill="#8b5cf6"
                    radius={[12, 12, 0, 0]}
                    maxBarSize={90}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Usage limits" subtitle="Live monthly AI usage overview.">
          <div className="progress-list">
            <ProgressBar
              label="Token usage"
              value={tokenPercent}
              rightText={`${number(usage?.usage?.tokensUsed)} / ${number(
                usage?.plan?.monthlyTokenLimit
              )}`}
            />

            <ProgressBar
              label="Cost usage"
              value={costPercent}
              rightText={`${money(usage?.usage?.costUsed)} / ${money(
                usage?.plan?.monthlyCostLimit
              )}`}
            />
          </div>

          <div className="usage-summary">
            <div>
              <span>Fallback</span>
              <strong>{usage?.plan?.fallbackApplied ? "Applied" : "No"}</strong>
            </div>

            <div>
              <span>Plan</span>
              <strong>{planName}</strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="two-column">
        <Card title="Profile" subtitle="Fetched securely from /users/me.">
          <div className="info-list">
            <InfoItem label="Name" value={user?.name || "—"} />
            <InfoItem label="Email" value={user?.email || "—"} />
            <InfoItem label="Role" value={roleName(user?.role_id)} />
            <InfoItem label="User ID" value={user?.id || "—"} />
          </div>
        </Card>

        <Card title="Project highlights" subtitle="Good points for project demo.">
          <div className="security-list">
            <SecurityItem
              title="JWT authentication"
              description="The frontend stores the login token and sends it in the Authorization header."
            />

            <SecurityItem
              title="Role based access control"
              description="Admin-only pages are protected and hidden from normal users."
            />

            <SecurityItem
              title="AI usage tracking"
              description="Token and cost limits are displayed from the backend usage APIs."
            />

            <SecurityItem
              title="Fallback logic"
              description="The backend can continue safely even when plan data needs fallback handling."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function UsageTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="custom-chart-tooltip">
      <strong>{label} usage</strong>

      <p>
        Used: <span>{data.usedValue}</span>
      </p>

      <p>
        Limit: <span>{data.limitValue}</span>
      </p>

      <p>
        Usage: <span>{data.Usage}%</span>
      </p>
    </div>
  );
}

function HealthItem({ label, status, icon }) {
  return (
    <div className={`health-item ${status}`}>
      <div className="health-content">
        <span className="health-dot" />

        <div>
          <strong>{label}</strong>
          <p>{status}</p>
        </div>
      </div>

      <div className="health-icon">{icon}</div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SecurityItem({ title, description }) {
  return (
    <div className="security-item">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}