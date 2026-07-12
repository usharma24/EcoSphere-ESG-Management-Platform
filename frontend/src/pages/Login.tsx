import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Leaf, Lock, Mail, AlertCircle, Eye, EyeOff, Sparkles } from "lucide-react";

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
      navigate("/dashboard");
    } catch (err) {
      // AuthContext sets error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute -right-32 -top-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 glass-card p-10 rounded-2xl border border-slate-200/50 shadow-soft bg-white/80 relative">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
        
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-55/10 border border-emerald-100/50 text-emerald-600 shadow-sm shadow-emerald-500/5">
            <Leaf className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            EcoSphere
          </h2>
          <p className="mt-2 text-center text-sm font-medium text-slate-500">
            ESG & Sustainability Management Platform
          </p>
        </div>

        {/* Form Alerts */}
        {(error || validationError) && (
          <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-250/30">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
            <span className="font-semibold">{validationError || error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Work Email Address
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
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
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all duration-200 outline-none font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
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
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all duration-200 outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-emerald-500/10"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="animate-pulse" /> Sign In
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Redirect Section */}
        <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm">
          <span className="text-slate-500 font-medium">New to EcoSphere? </span>
          <Link
            to="/register"
            className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
