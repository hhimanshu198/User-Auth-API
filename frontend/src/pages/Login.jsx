import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiError } from "../services/api.js";

const initialForm = {
  name: "",
  email: "",
  password: ""
};

export default function Login() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = mode === "login";

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setError("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetForm();
  };

  const validateForm = () => {
    if (!isLogin && !form.name.trim()) {
      return "Name is required";
    }

    if (!form.email.trim()) {
      return "Email is required";
    }

    if (!form.email.includes("@")) {
      return "Enter a valid email address";
    }

    if (!form.password.trim()) {
      return "Password is required";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login({
          email: form.email.trim(),
          password: form.password
        });

        toast.success("Login successful");
        navigate(redirectTo, { replace: true });
      } else {
        await signup({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password
        });

        toast.success("Account created. Please login now.");
        setMode("login");
        setForm({
          name: "",
          email: form.email,
          password: ""
        });
      }
    } catch (err) {
      setError(
        getApiError(
          err,
          isLogin ? "Login failed" : "Signup failed"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="hero-pill">Auth RBAC API</div>

        <h1>
          Secure authentication dashboard for your AI-powered backend.
        </h1>

        <p>
          Login, manage roles, test protected routes, monitor AI usage limits,
          and demonstrate your backend features with a polished React frontend.
        </p>

        <div className="hero-grid">
          <div>
            <strong>JWT</strong>
            <span>Token auth</span>
          </div>

          <div>
            <strong>RBAC</strong>
            <span>Role control</span>
          </div>

          <div>
            <strong>AI</strong>
            <span>Usage limits</span>
          </div>

          <div>
            <strong>NLAC</strong>
            <span>Natural access</span>
          </div>
        </div>
      </section>

      <section className="auth-card premium-auth-card">
        <div className="auth-logo-row">
          <div className="brand-mark">A</div>

          <div>
            <strong>Auth Console</strong>
            <span>Project frontend</span>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? "active" : ""}
            onClick={() => switchMode("login")}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? "active" : ""}
            onClick={() => switchMode("signup")}
          >
            Signup
          </button>
        </div>

        <h2>{isLogin ? "Welcome back" : "Create account"}</h2>

        <p>
          {isLogin
            ? "Enter your credentials to access your dashboard."
            : "Create a new account and then login to continue."}
        </p>

        <Alert type="danger" onClose={() => setError("")}>
          {error}
        </Alert>

        <form className="form-stack" onSubmit={handleSubmit}>
          {!isLogin && (
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </label>

          <Button type="submit" variant="primary" loading={loading}>
            {isLogin ? "Login to dashboard" : "Create account"}
          </Button>
        </form>

        <div className="auth-helper-card">
          <strong>Testing tip</strong>
          <p>
            Use an admin account to access the Users page. Normal users can
            still test dashboard, AI playground, access lab, and billing.
          </p>
        </div>

        <p className="auth-switch">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isLogin ? "signup" : "login")}
          >
            {isLogin ? "Create account" : "Login instead"}
          </button>
        </p>
      </section>
    </main>
  );
}