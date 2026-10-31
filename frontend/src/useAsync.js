import { useState } from "react";
import { getApiError } from "../services/api";

export default function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (callback, fallbackMessage = "Something went wrong") => {
    try {
      setLoading(true);
      setError("");
      return await callback();
    } catch (err) {
      const message = getApiError(err, fallbackMessage);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    run
  };
}