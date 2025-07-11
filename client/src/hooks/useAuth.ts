import { useState, useEffect } from "react";

interface User {
  username: string;
  schoolCode?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    const handler = () => {
      setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
      const userData = localStorage.getItem("user");
      setUser(userData ? JSON.parse(userData) : null);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = (userData?: User) => {
    localStorage.setItem("isAuthenticated", "true");
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
    setIsAuthenticated(true);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Call logout API endpoint
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear local storage and state regardless of API response
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      // Redirect to login page
      window.location.href = "/login";
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
  };
}
