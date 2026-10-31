import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { roleName } from "../utils/format.js";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "▣" },
  { to: "/ai", label: "AI Playground", icon: "✦" },
  { to: "/access", label: "Access Lab", icon: "◈" },
  { to: "/billing", label: "Billing", icon: "◇" }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">A</div>

          <div>
            <h1>Auth Console</h1>
            <p>RBAC + AI API</p>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/users"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>◎</span>
              Users
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="mini-profile">
            <div className="avatar">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>

            <div>
              <strong>{user?.name || "User"}</strong>
              <p>{roleName(user?.role_id)}</p>
            </div>
          </div>

          <button className="btn btn-ghost full" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button
            className="mobile-menu-btn"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            ☰
          </button>

          <div className="topbar-title">
            <p className="eyebrow">Project frontend</p>
            <h2>Auth RBAC API Dashboard</h2>
          </div>

          <div className="topbar-actions">
            <a
              className="btn btn-ghost"
              href="http://localhost:5000/api-docs"
              target="_blank"
              rel="noreferrer"
            >
              API Docs
            </a>

            <button className="btn btn-secondary" onClick={toggleTheme}>
              {theme === "dark" ? "Light" : "Dark"} mode
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}