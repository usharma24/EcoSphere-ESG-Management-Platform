import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API request timeout
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-lg shadow-soft border border-slate-100/50">
        
        {/* Brand/Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-light text-primary">
            <Leaf className="h-6 w-6 text-[#2E7D32]" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-slate-800">
            Reset password
          </h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            We will email you instructions to reset your password
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center text-green-500">
              <CheckCircle2 className="h-14 w-14 text-[#2E7D32]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">Check your email</h3>
              <p className="text-sm text-slate-500">
                We've sent a link to <span className="font-semibold text-slate-700">{email}</span>. 
                Please click the link to configure a new password.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E7D32] hover:text-[#1B5E20] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
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
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@company.com"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2E7D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !email}
                className="group relative flex w-full justify-center rounded-md bg-[#2E7D32] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1B5E20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32] disabled:opacity-50 transition-all duration-200"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E7D32] hover:text-[#1B5E20] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
