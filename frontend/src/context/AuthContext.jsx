import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { getApiError } from "../services/api.js";

const AuthContext = createContext(null);

const getSavedUser = () => {
  try {
    const saved = localStorage.getItem("authUser");
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem("authUser");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(getSavedUser);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const isAuthenticated = Boolean(token);
  const isAdmin = Number(user?.role_id) === 1;

  const saveSession = (nextToken, nextUser) => {
    localStorage.setItem("authToken", nextToken);
    localStorage.setItem("authUser", JSON.stringify(nextUser));

    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");

    setToken(null);
    setUser(null);
  };

  const login = async ({ email, password }) => {
    const response = await api.post("/auth/login", { email, password });

    const nextToken = response.data?.token;
    const nextUser = response.data?.user;

    if (!nextToken || !nextUser) {
      throw new Error("Login response did not include token or user");
    }

    saveSession(nextToken, nextUser);

    return response.data;
  };

  const signup = async ({ name, email, password }) => {
    const response = await api.post("/auth/signup", {
      name,
      email,
      password
    });

    return response.data;
  };

  const refreshProfile = async () => {
    const savedToken = localStorage.getItem("authToken");

    if (!savedToken) {
      clearSession();
      return null;
    }

    try {
      setLoadingProfile(true);

      const response = await api.get("/users/me");
      const profile = response.data;

      localStorage.setItem("authUser", JSON.stringify(profile));
      setUser(profile);

      return profile;
    } catch (error) {
      const message = getApiError(error, "Unable to refresh profile");
      console.warn(message);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      isAdmin,
      loadingProfile,
      login,
      signup,
      logout: clearSession,
      refreshProfile
    }),
    [token, user, isAuthenticated, isAdmin, loadingProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};