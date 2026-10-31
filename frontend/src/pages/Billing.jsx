import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import JsonBox from "../components/JsonBox.jsx";
import api, { getApiError } from "../services/api.js";

const plans = [
  {
    id: 1,
    slug: "free",
    name: "Free",
    price: "₹0",
    label: "Default",
    description:
      "Default fallback plan assigned to new users. Useful for safe limited access.",
    features: [
      "Default signup plan",
      "Dashboard access",
      "Limited AI usage",
      "Fallback protection"
    ]
  },
  {
    id: 2,
    slug: "basic",
    name: "Basic",
    price: "Basic",
    label: "Standard",
    description:
      "Allows access to basic protected features and gives more usage than Free.",
    features: [
      "Basic feature access",
      "GET /users/basic allowed",
      "Higher usage than Free",
      "Good for normal users"
    ]
  },
  {
    id: 3,
    slug: "pro",
    name: "Pro",
    price: "Pro",
    label: "Premium",
    description:
      "Highest plan in this project. Required for pro-only protected features.",
    features: [
      "Pro feature access",
      "GET /users/pro allowed",
      "Highest usage limits",
      "Best for full demo"
    ]
  }
];

export default function Billing() {
  const [selectedPlanId, setSelectedPlanId] = useState(3);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === Number(selectedPlanId)),
    [selectedPlanId]
  );

  const currentPlanId = Number(currentPlan?.id || 1);

  const selectedPlanStatus = useMemo(() => {
    if (!selectedPlan) return "unknown";

    if (selectedPlan.id === currentPlanId) {
      return "current";
    }

    if (selectedPlan.id < currentPlanId) {
      return "lower";
    }

    return "upgrade";
  }, [selectedPlan, currentPlanId]);

  const canCreatePayment = selectedPlanStatus === "upgrade";

  const loadCurrentPlan = async () => {
    setError("");
    setLoadingUsage(true);

    try {
      const result = await api.get("/usage/me");
      const plan = result.data?.plan;

      setCurrentPlan(plan || null);

      if (plan?.id) {
        const nextUpgrade = plans.find((item) => item.id > Number(plan.id));

        if (nextUpgrade) {
          setSelectedPlanId(nextUpgrade.id);
        } else {
          setSelectedPlanId(Number(plan.id));
        }
      }
    } catch (err) {
      setError(getApiError(err, "Unable to load current subscription"));
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const createPayment = async () => {
    if (!canCreatePayment) {
      if (selectedPlanStatus === "current") {
        toast.error("You are already on this plan.");
        return;
      }

      if (selectedPlanStatus === "lower") {
        toast.error("Downgrade is not available from this page.");
        return;
      }

      toast.error("Select an upgrade plan first.");
      return;
    }

    setError("");
    setLoadingPayment(true);

    try {
      const result = await api.post("/payments/create", {
        plan_id: Number(selectedPlanId)
      });

      setResponse(result.data);
      toast.success(`Payment created for ${selectedPlan?.name} plan`);
    } catch (err) {
      setError(getApiError(err, "Unable to create payment"));
      setResponse(err?.response?.data || null);
    } finally {
      setLoadingPayment(false);
    }
  };

  const selectPlan = (planId) => {
    setSelectedPlanId(planId);
    setResponse(null);
    setError("");
  };

  const copyResponse = async () => {
    if (!response) {
      toast.error("No response to copy");
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    toast.success("Payment response copied");
  };

  const clearOutput = () => {
    setResponse(null);
    setError("");
  };

  const getPlanCardStatus = (planId) => {
    if (planId === currentPlanId) return "Current plan";
    if (planId < currentPlanId) return "Lower plan";
    return "Upgrade";
  };

  const getSelectedPlanMessage = () => {
    if (loadingUsage) return "Checking your current subscription...";

    if (selectedPlanStatus === "current") {
      return "You are already subscribed to this plan.";
    }

    if (selectedPlanStatus === "lower") {
      return "This is below your current plan. Downgrade is not available here.";
    }

    if (selectedPlanStatus === "upgrade") {
      return "This plan is available as an upgrade.";
    }

    return "Select a plan to continue.";
  };

  return (
    <div className="page-stack billing-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Billing lab</p>
          <h1>Subscription Testing</h1>
          <p className="muted">
            View your current plan and create payment only for valid upgrades.
            The backend payment API expects plan_id.
          </p>
        </div>

        <div className="page-actions">
          <Button variant="secondary" onClick={clearOutput}>
            Clear output
          </Button>

          <Button
            variant="primary"
            loading={loadingPayment}
            disabled={!canCreatePayment || loadingUsage}
            onClick={createPayment}
          >
            {canCreatePayment ? "Create payment" : "Not available"}
          </Button>
        </div>
      </div>

      <Alert type="danger" onClose={() => setError("")}>
        {error}
      </Alert>

      <section className="billing-hero-card">
        <div>
          <p className="eyebrow">Current subscription</p>
          <h2>{loadingUsage ? "Loading..." : currentPlan?.name || "Free"}</h2>
          <p>
            {currentPlan?.fallbackApplied
              ? "No active paid subscription found, so fallback Free plan is applied."
              : "This is your active subscription according to /usage/me."}
          </p>
        </div>

        <div className="billing-price-box">
          <span>Selected plan</span>
          <strong>#{selectedPlan?.id}</strong>
          <p>{selectedPlan?.name}</p>
        </div>
      </section>

      <div className="plan-grid premium-plan-grid">
        {plans.map((plan) => {
          const isSelected = Number(selectedPlanId) === plan.id;
          const isCurrent = plan.id === currentPlanId;
          const isLower = plan.id < currentPlanId;
          const isUpgrade = plan.id > currentPlanId;

          return (
            <button
              key={plan.id}
              type="button"
              className={`plan-card ${isSelected ? "selected" : ""} ${
                isCurrent ? "current-plan-card" : ""
              } ${isLower ? "disabled-plan-card" : ""}`}
              onClick={() => selectPlan(plan.id)}
            >
              <div className="plan-top-row">
                <span>{plan.label}</span>

                <small
                  className={
                    isCurrent
                      ? "plan-status-current"
                      : isLower
                      ? "plan-status-muted"
                      : "plan-status-upgrade"
                  }
                >
                  {getPlanCardStatus(plan.id)}
                </small>
              </div>

              <strong>{plan.name}</strong>

              <h3>Plan #{plan.id}</h3>

              <p>{plan.description}</p>

              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              {isUpgrade && (
                <div className="plan-upgrade-note">
                  Available upgrade
                </div>
              )}

              {isCurrent && (
                <div className="plan-upgrade-note current">
                  You are here
                </div>
              )}

              {isLower && (
                <div className="plan-upgrade-note muted">
                  Downgrade not available
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="two-column wide-left">
        <Card
          title="Payment request"
          subtitle="Payment is only created when the selected plan is higher than your current plan."
        >
          <div className="billing-request-card">
            <div>
              <span>Endpoint</span>
              <strong>POST /payments/create</strong>
            </div>

            <div>
              <span>Payload</span>
              <strong>{`{ "plan_id": ${selectedPlanId} }`}</strong>
            </div>

            <div>
              <span>Selected plan status</span>
              <strong>{getSelectedPlanMessage()}</strong>
            </div>

            <div>
              <span>Current plan</span>
              <strong>
                {currentPlan?.name || "Free"} / ID {currentPlanId}
              </strong>
            </div>
          </div>

          <div className="billing-action-box">
            <div>
              <strong>
                {canCreatePayment
                  ? `Upgrade to ${selectedPlan?.name}`
                  : "Payment disabled"}
              </strong>
              <p>{getSelectedPlanMessage()}</p>
            </div>

            <Button
              variant="primary"
              loading={loadingPayment}
              disabled={!canCreatePayment || loadingUsage}
              onClick={createPayment}
            >
              {canCreatePayment ? "Create payment" : "Not available"}
            </Button>
          </div>
        </Card>

        <Card title="Billing demo notes" subtitle="Use this in your explanation.">
          <div className="billing-notes-list">
            <div>
              <strong>Current plan check</strong>
              <p>
                The frontend reads /usage/me to know the user’s active
                subscription before allowing payment.
              </p>
            </div>

            <div>
              <strong>Upgrade-only flow</strong>
              <p>
                Current and lower plans are shown but payment is disabled for
                them to avoid confusing behavior.
              </p>
            </div>

            <div>
              <strong>Backend behavior</strong>
              <p>
                The backend currently creates pending payment records. It does
                not block lower/current plan payments by itself.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Payment response"
        subtitle="Raw backend response from the payment creation endpoint."
      >
        <div className="response-toolbar">
          <div>
            <strong>
              {response ? "Payment response received" : "No payment request yet"}
            </strong>
            <p>
              {response
                ? "Backend output is shown below."
                : "Select a valid upgrade plan and create a payment request."}
            </p>
          </div>

          <div className="response-meta">
            {response?.success !== undefined && (
              <span>{response.success ? "Success" : "Failed"}</span>
            )}

            <span>{selectedPlan?.name} plan</span>
            <span>plan_id: {selectedPlanId}</span>

            <Button variant="secondary" onClick={copyResponse}>
              Copy JSON
            </Button>
          </div>
        </div>

        {loadingPayment ? (
          <div className="ai-loading-box">
            <div className="premium-spinner" />
            <p>Creating payment request...</p>
          </div>
        ) : response ? (
          <JsonBox data={response} />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">◇</div>
            <h3>No payment response yet</h3>
            <p>
              Payment creation is available only for plans above your current
              subscription.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}