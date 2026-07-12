import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Leaf, Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";

const Login: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!email || !password) {
      setValidationError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      // AuthContext sets error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-lg shadow-soft border border-slate-100/50">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary-light text-primary">
            <Leaf className="h-8 w-8 animate-pulse text-[#2E7D32]" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-800">
            EcoSphere
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            ESG & Sustainability Management Platform
          </p>
        </div>

        {/* Form Alerts */}
        {(error || validationError) && (
          <div className="flex items-center gap-3 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-600">
                Work Email Address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                    setValidationError(null);
                  }}
                  placeholder="name@company.com"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2E7D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#2E7D32] hover:text-[#1B5E20] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                    setValidationError(null);
                  }}
                  placeholder="••••••••"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2E7D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full justify-center rounded-md bg-[#2E7D32] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1B5E20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32] disabled:opacity-50 transition-all duration-200"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        {/* Redirect Section */}
        <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm">
          <span className="text-slate-500">New to EcoSphere? </span>
          <Link
            to="/register"
            className="font-semibold text-[#2E7D32] hover:text-[#1B5E20] transition-colors"
          >
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
