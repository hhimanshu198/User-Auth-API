import { Navigate } from "react-router-dom";
import PageLoader from "./PageLoader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminRoute({ children }) {
  const { user, isAdmin, loadingProfile } = useAuth();

  if (loadingProfile && !user) {
    return <PageLoader text="Checking admin access..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}