import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

interface Organization {
  id: number;
  name: string;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  organization_id: number;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  xp: number;
  is_active: boolean;
  organization_id?: number;
  department_id?: number;
  organization?: Organization;
  department?: Department;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  organizations: Organization[];
  departments: Department[];
  fetchOrganizations: () => Promise<void>;
  fetchDepartments: (orgId: number) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const fetchOrganizations = async () => {
    try {
      const response = await apiClient.get("/api/auth/organizations");
      setOrganizations(response.data);
    } catch (err: any) {
      console.error("Failed to fetch organizations", err);
    }
  };

  const fetchDepartments = async (orgId: number) => {
    try {
      const response = await apiClient.get(`/api/auth/departments?organization_id=${orgId}`);
      setDepartments(response.data);
    } catch (err: any) {
      console.error("Failed to fetch departments", err);
    }
  };

  const clearError = () => setError(null);

  // Initialize and check if user session is valid
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get("/api/auth/me");
        setUser(response.data);
      } catch (err) {
        console.error("Authentication check failed", err);
        // apiClient interceptor will clear local storage if refresh fails
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for session expiry event from Axios client
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener("auth_session_expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth_session_expired", handleSessionExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/api/auth/login", { email, password });
      const { access_token, refresh_token, user: userData } = response.data;
      
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/api/auth/register", data);
      const { access_token, refresh_token, user: userData } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please check your details.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        organizations,
        departments,
        fetchOrganizations,
        fetchDepartments,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
