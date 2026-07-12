import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Loading EcoSphere...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Guard (prevents logged-in users from hitting login/register)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Loading EcoSphere...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Placeholder Home / Dashboard component to verify authentication works
const DashboardPlaceholder: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-8">
      <div className="mx-auto max-w-4xl bg-white shadow-soft rounded-lg p-8 border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-[#2E7D32]">🌍</span> EcoSphere Dashboard
            </h1>
            <p className="text-slate-500 text-sm">Welcome back, {user?.full_name}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-all duration-200"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-100 rounded-md p-6 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">User Information</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Email:</dt>
                <dd className="text-sm font-semibold text-slate-800">{user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Role:</dt>
                <dd className="text-sm font-semibold text-[#2E7D32]">{user?.role}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Points (XP):</dt>
                <dd className="text-sm font-semibold text-slate-800">{user?.xp} XP</dd>
              </div>
            </dl>
          </div>

          <div className="border border-slate-100 rounded-md p-6 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Company Context</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Organization:</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {user?.organization?.name || "None / External"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Department:</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {user?.department?.name || "None / External"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400 text-center">
            Phase 1 Active: Auth, Base Styling & Database Handshake Validated.
          </p>
        </div>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder />
          </ProtectedRoute>
        }
      />
      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
