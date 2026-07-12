import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Leaf, Lock, Mail, User, AlertCircle, Building, Briefcase } from "lucide-react";

const Register: React.FC = () => {
  const { register, error, clearError, organizations, departments, fetchOrganizations, fetchDepartments } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Organization variables
  const [orgMode, setOrgMode] = useState<"select" | "create">("select");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [newOrgName, setNewOrgName] = useState("");

  // Department variables
  const [deptMode, setDeptMode] = useState<"select" | "create">("select");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [newDeptName, setNewDeptName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fetch departments when organization selection changes
  useEffect(() => {
    if (orgMode === "select" && selectedOrgId) {
      fetchDepartments(Number(selectedOrgId));
    }
  }, [selectedOrgId, orgMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Validate entries
    if (!fullName || !email || !password) {
      setValidationError("Please fill in all general fields.");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }

    // Resolve organization parameters
    let organization_name = "";
    if (orgMode === "create") {
      if (!newOrgName.trim()) {
        setValidationError("Please specify the organization name.");
        return;
      }
      organization_name = newOrgName.trim();
    } else {
      const selectedOrgObj = organizations.find((o) => String(o.id) === selectedOrgId);
      if (!selectedOrgObj) {
        setValidationError("Please select or create an organization.");
        return;
      }
      organization_name = selectedOrgObj.name;
    }

    // Resolve department parameters
    let department_name = "";
    if (deptMode === "create") {
      if (!newDeptName.trim()) {
        setValidationError("Please specify the department name.");
        return;
      }
      department_name = newDeptName.trim();
    } else {
      const selectedDeptObj = departments.find((d) => String(d.id) === selectedDeptId);
      if (!selectedDeptObj && orgMode === "select") {
        setValidationError("Please select or create a department.");
        return;
      }
      department_name = selectedDeptObj ? selectedDeptObj.name : "";
    }

    setSubmitting(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role: "Employee", // Default signed up role
        organization_name,
        department_name,
      });
      navigate("/");
    } catch (err) {
      // AuthContext handles error display
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 bg-white p-10 rounded-lg shadow-soft border border-slate-100/50">
        
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-light text-primary">
            <Leaf className="h-6 w-6 text-[#2E7D32]" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-slate-800">
            Create your account
          </h2>
          <p className="mt-1.5 text-center text-sm text-slate-500">
            Join EcoSphere to track and improve sustainability performance
          </p>
        </div>

        {/* Errors */}
        {(error || validationError) && (
          <div className="flex items-center gap-3 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-600">
              Full Name
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-5 w-5" />
              </div>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2E7D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-all duration-200"
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-600">
              Password
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 characters)"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2E7D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-all duration-200"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">Organizational Context</span>
            </div>
          </div>

          {/* Organization Widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-600">
                Organization
              </label>
              <button
                type="button"
                onClick={() => {
                  setOrgMode(orgMode === "select" ? "create" : "select");
                  setSelectedOrgId("");
                  setNewOrgName("");
                  setSelectedDeptId("");
                  setNewDeptName("");
                }}
                className="text-xs font-semibold text-[#2E7D32] hover:underline"
              >
                {orgMode === "select" ? "+ Create new organization" : "Join existing organization"}
              </button>
            </div>

            {orgMode === "select" ? (
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Building className="h-5 w-5" />
                </div>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 focus:border-[#2E7D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-all duration-200 appearance-none"
                >
                  <option value="">Select Organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Building className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Acme Corp"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2E7D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-all duration-200"
                />
              </div>
            )}
          </div>

          {/* Department Widget */}
          {((orgMode === "select" && selectedOrgId) || orgMode === "create") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-600">
                  Department
                </label>
                {orgMode === "select" && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeptMode(deptMode === "select" ? "create" : "select");
                      setSelectedDeptId("");
                      setNewDeptName("");
                    }}
                    className="text-xs font-semibold text-[#2E7D32] hover:underline"
                  >
                    {deptMode === "select" ? "+ Create new department" : "Join existing department"}
                  </button>
                )}
              </div>

              {deptMode === "select" && orgMode === "select" ? (
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 focus:border-[#2E7D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-all duration-200 appearance-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Engineering / Sustainability"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2E7D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-all duration-200"
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full justify-center rounded-md bg-[#2E7D32] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1B5E20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32] disabled:opacity-50 transition-all duration-200"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        {/* Redirect */}
        <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm">
          <span className="text-slate-500">Already have an account? </span>
          <Link
            to="/login"
            className="font-semibold text-[#2E7D32] hover:text-[#1B5E20] transition-colors"
          >
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
