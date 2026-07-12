import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import { 
  Shield, FileText, AlertTriangle, Calendar, Clipboard, 
  Plus, Check, AlertCircle, UserCheck, ShieldAlert,
  ArrowRight, ShieldCheck, Activity, Sparkles, X
} from "lucide-react";

interface Policy {
  id: number;
  title: string;
  content: string;
  version: string;
  created_by_id: number;
  created_at: string;
}

interface PolicyUser {
  policy: Policy;
  acknowledged: boolean;
  acknowledged_at: string | null;
}

interface Audit {
  id: number;
  title: string;
  description: string | null;
  scheduled_date: string;
  status: string;
  auditor_name: string;
  scope: string | null;
  created_at: string;
}

interface ComplianceIssue {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  policy_id: number | null;
  reported_by_id: number;
  assigned_to_id: number | null;
  created_at: string;
  resolved_at: string | null;
  reported_by_name: string | null;
  assigned_to_name: string | null;
}

interface Risk {
  id: number;
  title: string;
  description: string | null;
  likelihood: number;
  impact: number;
  mitigation_strategy: string | null;
  status: string;
  department_id: number | null;
  created_at: string;
}

const Governance: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === "Super Admin" || user?.role === "ESG Manager";
  const isDeptManager = user?.role === "Department Manager";

  // State management
  const [activeTab, setActiveTab] = useState<"overview" | "policies" | "risks" | "compliance" | "audits">("overview");
  const [policies, setPolicies] = useState<PolicyUser[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal / Form state
  const [showPolicyModal, setShowPolicyModal] = useState<PolicyUser | null>(null);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [showCreateAudit, setShowCreateAudit] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showCreateRisk, setShowCreateRisk] = useState(false);

  // New Policy form state
  const [newPolicyTitle, setNewPolicyTitle] = useState("");
  const [newPolicyContent, setNewPolicyContent] = useState("");
  const [newPolicyVersion, setNewPolicyVersion] = useState("1.0");

  // New Audit form state
  const [newAuditTitle, setNewAuditTitle] = useState("");
  const [newAuditDescription, setNewAuditDescription] = useState("");
  const [newAuditDate, setNewAuditDate] = useState("");
  const [newAuditAuditor, setNewAuditAuditor] = useState("");
  const [newAuditScope, setNewAuditScope] = useState("");

  // New Compliance Issue form state
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueDescription, setNewIssueDescription] = useState("");
  const [newIssueSeverity, setNewIssueSeverity] = useState("Medium");
  const [newIssuePolicyId, setNewIssuePolicyId] = useState("");

  // New Risk form state
  const [newRiskTitle, setNewRiskTitle] = useState("");
  const [newRiskDescription, setNewRiskDescription] = useState("");
  const [newRiskLikelihood, setNewRiskLikelihood] = useState(3);
  const [newRiskImpact, setNewRiskImpact] = useState(3);
  const [newRiskMitigation, setNewRiskMitigation] = useState("");
  const [newRiskDeptId, setNewRiskDeptId] = useState("");

  // Load module data
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [policiesRes, auditsRes, complianceRes, risksRes] = await Promise.all([
        apiClient.get("/api/governance/policies"),
        apiClient.get("/api/governance/audits"),
        apiClient.get("/api/governance/compliance"),
        apiClient.get("/api/governance/risks")
      ]);
      setPolicies(policiesRes.data);
      setAudits(auditsRes.data);
      setComplianceIssues(complianceRes.data);
      setRisks(risksRes.data);
      
      // Fetch departments for risk assignment
      if (user?.organization_id) {
        const deptsRes = await apiClient.get(`/api/auth/departments?organization_id=${user.organization_id}`);
        setDepartments(deptsRes.data);
      }
    } catch (err: any) {
      setErrorMessage("Failed to load governance information. Please make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleAcknowledgePolicy = async (policyId: number) => {
    try {
      await apiClient.post(`/api/governance/policies/${policyId}/acknowledge`);
      setShowPolicyModal(null);
      triggerSuccess("Policy acknowledged successfully!");
      loadData();
    } catch (err) {
      setErrorMessage("Failed to acknowledge policy.");
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyTitle || !newPolicyContent) return;
    try {
      await apiClient.post("/api/governance/policies", {
        title: newPolicyTitle,
        content: newPolicyContent,
        version: newPolicyVersion
      });
      setShowCreatePolicy(false);
      setNewPolicyTitle("");
      setNewPolicyContent("");
      setNewPolicyVersion("1.0");
      triggerSuccess("New policy published successfully!");
      loadData();
    } catch (err) {
      setErrorMessage("Failed to publish policy.");
    }
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuditTitle || !newAuditDate || !newAuditAuditor) return;
    try {
      await apiClient.post("/api/governance/audits", {
        title: newAuditTitle,
        description: newAuditDescription || null,
        scheduled_date: new Date(newAuditDate).toISOString(),
        auditor_name: newAuditAuditor,
        scope: newAuditScope || null
      });
      setShowCreateAudit(false);
      setNewAuditTitle("");
      setNewAuditDescription("");
      setNewAuditDate("");
      setNewAuditAuditor("");
      setNewAuditScope("");
      triggerSuccess("New audit scheduled successfully!");
      loadData();
    } catch (err) {
      setErrorMessage("Failed to schedule audit.");
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueTitle || !newIssueDescription) return;
    try {
      await apiClient.post("/api/governance/compliance", {
        title: newIssueTitle,
        description: newIssueDescription,
        severity: newIssueSeverity,
        policy_id: newIssuePolicyId ? Number(newIssuePolicyId) : null
      });
      setShowReportIssue(false);
      setNewIssueTitle("");
      setNewIssueDescription("");
      setNewIssueSeverity("Medium");
      setNewIssuePolicyId("");
      triggerSuccess("Compliance issue reported successfully!");
      loadData();
    } catch (err) {
      setErrorMessage("Failed to report compliance issue.");
    }
  };

  const handleUpdateIssueStatus = async (issueId: number, newStatus: string) => {
    try {
      await apiClient.patch(`/api/governance/compliance/${issueId}`, {
        status: newStatus
      });
      triggerSuccess(`Issue updated to ${newStatus}.`);
      loadData();
    } catch (err) {
      setErrorMessage("Failed to update compliance issue status.");
    }
  };

  const handleAssignIssueToMe = async (issueId: number) => {
    if (!user) return;
    try {
      await apiClient.patch(`/api/governance/compliance/${issueId}`, {
        assigned_to_id: user.id
      });
      triggerSuccess("Issue successfully assigned to you.");
      loadData();
    } catch (err) {
      setErrorMessage("Failed to assign issue.");
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiskTitle) return;
    try {
      await apiClient.post("/api/governance/risks", {
        title: newRiskTitle,
        description: newRiskDescription || null,
        likelihood: newRiskLikelihood,
        impact: newRiskImpact,
        mitigation_strategy: newRiskMitigation || null,
        department_id: newRiskDeptId ? Number(newRiskDeptId) : null
      });
      setShowCreateRisk(false);
      setNewRiskTitle("");
      setNewRiskDescription("");
      setNewRiskLikelihood(3);
      setNewRiskImpact(3);
      setNewRiskMitigation("");
      setNewRiskDeptId("");
      triggerSuccess("Risk item registered successfully!");
      loadData();
    } catch (err) {
      setErrorMessage("Failed to register risk item.");
    }
  };

  const handleUpdateRiskStatus = async (riskId: number, newStatus: string) => {
    try {
      await apiClient.patch(`/api/governance/risks/${riskId}`, {
        status: newStatus
      });
      triggerSuccess(`Risk status updated to ${newStatus}.`);
      loadData();
    } catch (err) {
      setErrorMessage("Failed to update risk item status.");
    }
  };

  // Helper formatting logic
  const getRiskBadgeColor = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    if (score >= 15) return "bg-rose-50 text-rose-700 border-rose-200/50 font-bold";
    if (score >= 8) return "bg-amber-50 text-amber-700 border-amber-200/50 font-semibold";
    return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-rose-100 text-rose-800 border-rose-200/60 font-bold";
      case "High": return "bg-orange-50 text-orange-700 border-orange-200/60 font-semibold";
      case "Medium": return "bg-amber-50 text-amber-700 border-amber-200/60";
      default: return "bg-blue-50 text-blue-700 border-blue-200/60";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Resolved":
      case "Closed":
      case "Mitigated":
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60 font-semibold";
      case "Under Review":
      case "In Progress":
      case "Monitoring":
        return "bg-sky-50 text-sky-700 border-sky-200/60 font-medium";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200/60";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="shimmer-skeleton h-24 rounded-2xl w-full" />
        <div className="shimmer-skeleton h-10 w-96 rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="shimmer-skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="shimmer-skeleton h-80 rounded-2xl w-full" />
      </div>
    );
  }

  // Dashboard Stats calculations
  const pendingAcksCount = policies.filter(p => !p.acknowledged).length;
  const activeRisksCount = risks.filter(r => r.status !== "Mitigated").length;
  const openIssuesCount = complianceIssues.filter(c => c.status === "Open" || c.status === "Under Review").length;
  const upcomingAuditsCount = audits.filter(a => a.status === "Scheduled" || a.status === "In Progress").length;

  return (
    <div className="space-y-6">
      {/* Header Board */}
      <div className="glass-card p-6 rounded-2xl border border-slate-100/50 shadow-soft bg-white/70">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>Governance & Compliance</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">EcoSphere Governance Panel</h1>
            <p className="text-slate-500 text-sm mt-0.5">Control audits schedule, manage compliance reports, corporate policies and evaluated risk logs.</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {isAdminOrManager && (
              <>
                <button
                  onClick={() => setShowCreatePolicy(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Publish Policy
                </button>
                <button
                  onClick={() => setShowCreateAudit(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-emerald-500" /> Schedule Audit
                </button>
                <button
                  onClick={() => setShowCreateRisk(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <Activity className="h-4 w-4 text-orange-500 animate-pulse" /> Register Risk
                </button>
              </>
            )}
            <button
              onClick={() => setShowReportIssue(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm cursor-pointer"
            >
              <AlertTriangle className="h-4 w-4 animate-bounce" /> Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* Error / Success Toast Notifications */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span className="font-semibold">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto font-bold hover:underline">Dismiss</button>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200 shadow-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
          <span className="font-semibold">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Tab Selection */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: Shield },
          { id: "policies", label: "Policies & Sign-off", icon: FileText, badge: pendingAcksCount > 0 ? pendingAcksCount : null },
          { id: "compliance", label: "Compliance Cases", icon: AlertTriangle, badge: openIssuesCount > 0 ? openIssuesCount : null },
          { id: "risks", label: "Risk Register", icon: Clipboard, badge: activeRisksCount > 0 ? activeRisksCount : null },
          { id: "audits", label: "Audits", icon: Calendar, badge: upcomingAuditsCount > 0 ? upcomingAuditsCount : null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-800"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {tab.badge !== null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab.id === "compliance" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Pending Sign-offs", value: pendingAcksCount, desc: "Awaiting your signature", icon: FileText, color: "text-emerald-600 bg-emerald-50" },
              { title: "Active Governance Risks", value: activeRisksCount, desc: "Monitored threat points", icon: Clipboard, color: "text-amber-600 bg-amber-50" },
              { title: "Unresolved Issues", value: openIssuesCount, desc: "Pending internal cases", icon: AlertTriangle, color: "text-rose-600 bg-rose-50" },
              { title: "Upcoming Audits", value: upcomingAuditsCount, desc: "Scheduled inspections", icon: Calendar, color: "text-sky-600 bg-sky-50" }
            ].map((kpi, idx) => (
              <div key={idx} className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-emerald-500/30 to-teal-500/30" />
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{kpi.value}</h3>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">{kpi.desc}</p>
                </div>
                <div className={`p-3 rounded-xl border border-slate-100/50 ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Overview Boards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Policies list preview */}
            <div className="glass-card p-6 rounded-2xl border border-slate-100/50 shadow-soft bg-white/70">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-500" /> Action Items: Policies
                </h3>
                <button
                  onClick={() => setActiveTab("policies")}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-3">
                {policies.slice(0, 3).map((policyUser) => (
                  <div 
                    key={policyUser.policy.id} 
                    onClick={() => setShowPolicyModal(policyUser)}
                    className="border border-slate-100 hover:border-emerald-500/30 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all duration-200 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{policyUser.policy.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">v{policyUser.policy.version} • Published {new Date(policyUser.policy.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      {policyUser.acknowledged ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                          <Check className="h-3 w-3" /> Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                          Sign now
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {policies.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">No policies published yet.</p>
                )}
              </div>
            </div>

            {/* Audits preview */}
            <div className="glass-card p-6 rounded-2xl border border-slate-100/50 shadow-soft bg-white/70">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-sky-500" /> Audit Schedule
                </h3>
                <button
                  onClick={() => setActiveTab("audits")}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-3">
                {audits.slice(0, 3).map((audit) => (
                  <div key={audit.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Scope: {audit.scope || "General"}</span>
                      <h4 className="font-bold text-sm text-slate-800 mt-0.5">{audit.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Auditor: {audit.auditor_name}</p>
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">Scheduled: {new Date(audit.scheduled_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase ${getStatusBadgeColor(audit.status)}`}>
                      {audit.status}
                    </span>
                  </div>
                ))}
                {audits.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">No audits scheduled.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POLICIES */}
      {activeTab === "policies" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Corporate Policies & Digital Sign-off</h3>
            <span className="text-xs font-medium text-slate-500">Every policy requires employee acknowledgement for audit transparency.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policies.map((pUser) => (
              <div key={pUser.policy.id} className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-200 transition-all duration-200">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div>
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-500">v{pUser.policy.version}</span>
                    {pUser.acknowledged ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <Check className="h-3.5 w-3.5" /> Acknowledged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 animate-pulse">
                        Signature Needed
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mt-3">{pUser.policy.title}</h4>
                  <p className="text-xs font-medium text-slate-400 mt-2 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {pUser.policy.content}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Published {new Date(pUser.policy.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => setShowPolicyModal(pUser)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                  >
                    {pUser.acknowledged ? "View Signed Policy" : "Read & Sign"} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {policies.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-slate-200">
                <FileText className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm text-slate-400">No active policies published.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COMPLIANCE CASES */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Compliance & Regulatory Incident Logs</h3>
            <button
              onClick={() => setShowReportIssue(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Report New Case
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                    <th className="px-6 py-3.5">Reported Case Details</th>
                    <th className="px-6 py-3.5">Severity</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Reporter</th>
                    <th className="px-6 py-3.5">Assignee</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {complianceIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-snug">{issue.title}</h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm line-clamp-2">{issue.description}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-1">Logged: {new Date(issue.created_at).toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-full ${getSeverityBadgeColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 border text-[9px] font-bold uppercase rounded-full ${getStatusBadgeColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                        {issue.reported_by_name || "System Automated"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                        {issue.assigned_to_name ? (
                          <span className="flex items-center gap-1.5 text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-500" /> {issue.assigned_to_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex justify-end gap-2.5">
                          {!issue.assigned_to_id && (
                            <button
                              onClick={() => handleAssignIssueToMe(issue.id)}
                              className="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            >
                              Assign to me
                            </button>
                          )}
                          
                          {(isAdminOrManager || isDeptManager) && (
                            <>
                              {issue.status === "Open" && (
                                <button
                                  onClick={() => handleUpdateIssueStatus(issue.id, "Under Review")}
                                  className="font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                                >
                                  Review
                                </button>
                              )}
                              {(issue.status === "Open" || issue.status === "Under Review") && (
                                <button
                                  onClick={() => handleUpdateIssueStatus(issue.id, "Resolved")}
                                  className="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                >
                                  Resolve
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {complianceIssues.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <ShieldAlert className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No compliance issues logged.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RISK REGISTER */}
      {activeTab === "risks" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Governance Risk Register</h3>
              <p className="text-xs text-slate-500 mt-1">Evaluating likelihood and operational business impacts of operational items.</p>
            </div>
            {isAdminOrManager && (
              <button
                onClick={() => setShowCreateRisk(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Risk Item
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                    <th className="px-6 py-3.5">Risk Threat Details</th>
                    <th className="px-6 py-3.5">Likelihood (1-5)</th>
                    <th className="px-6 py-3.5">Impact (1-5)</th>
                    <th className="px-6 py-3.5">Risk Score</th>
                    <th className="px-6 py-3.5">Mitigation Plan</th>
                    <th className="px-6 py-3.5">Status</th>
                    {isAdminOrManager && <th className="px-6 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {risks.map((risk) => {
                    const score = risk.likelihood * risk.impact;
                    let threatLabel = "Low";
                    if (score >= 15) threatLabel = "Critical";
                    else if (score >= 8) threatLabel = "Medium";

                    return (
                      <tr key={risk.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 leading-snug">{risk.title}</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">{risk.description || "No description provided."}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                          {risk.likelihood}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                          {risk.impact}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-full ${getRiskBadgeColor(risk.likelihood, risk.impact)}`}>
                            {score} - {threatLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-500 italic bg-slate-50/80 p-2.5 border border-slate-100 rounded-xl max-w-xs leading-relaxed">{risk.mitigation_strategy || "No mitigation mapped."}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 border text-[9px] font-bold uppercase rounded-full ${getStatusBadgeColor(risk.status)}`}>
                            {risk.status}
                          </span>
                        </td>
                        {isAdminOrManager && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                            <div className="flex justify-end gap-2.5">
                              {risk.status !== "Mitigated" && (
                                <button
                                  onClick={() => handleUpdateRiskStatus(risk.id, "Mitigated")}
                                  className="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                >
                                  Mitigate
                                </button>
                              )}
                              {risk.status === "Identified" && (
                                <button
                                  onClick={() => handleUpdateRiskStatus(risk.id, "Monitoring")}
                                  className="font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                                >
                                  Monitor
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {risks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <Shield className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No risk items registered.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDITS */}
      {activeTab === "audits" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Governance & Policy Audits Schedule</h3>
            <p className="text-xs text-slate-500">Systematic verification tracks mapped across corporate branches.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {audits.map((audit) => (
              <div key={audit.id} className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100/50">Scope: {audit.scope || "General"}</span>
                    <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase ${getStatusBadgeColor(audit.status)}`}>
                      {audit.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mt-3">{audit.title}</h4>
                  <p className="text-xs font-medium text-slate-400 mt-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    {audit.description || "No audit details supplied."}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs text-slate-500">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Auditor Contact</span>
                    <span className="font-semibold text-slate-700">{audit.auditor_name}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Scheduled Date</span>
                    <span className="font-bold text-emerald-600">{new Date(audit.scheduled_date).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {audits.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm text-slate-400">No compliance audits scheduled.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POLICY DIGITAL ACKNOWLEDGEMENT MODAL */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-100 p-8 max-h-[85vh] overflow-y-auto relative">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <h3 className="text-xl font-bold text-slate-800">{showPolicyModal.policy.title}</h3>
            <div className="flex gap-4 text-xs font-semibold text-slate-400 mt-2 border-b border-slate-50 pb-3">
              <span>Version {showPolicyModal.policy.version}</span>
              <span>Published {new Date(showPolicyModal.policy.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="mt-6 text-xs font-medium text-slate-600 bg-slate-50/80 border border-slate-100 p-6 rounded-xl whitespace-pre-wrap leading-relaxed">
              {showPolicyModal.policy.content}
            </div>

            {showPolicyModal.acknowledged ? (
              <div className="mt-8 flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-xl text-sm">
                <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">You acknowledged this policy digitally.</p>
                  <p className="text-xs text-emerald-600 mt-0.5 font-medium">Signed at: {new Date(showPolicyModal.acknowledged_at!).toLocaleString()}</p>
                </div>
                <button onClick={() => setShowPolicyModal(null)} className="ml-auto font-bold hover:underline cursor-pointer">Close</button>
              </div>
            ) : (
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowPolicyModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handleAcknowledgePolicy(showPolicyModal.policy.id)}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  Digitally Acknowledge & Sign
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE POLICY DIALOG */}
      {showCreatePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-500" /> Publish Corporate Policy
              </h3>
              <button
                onClick={() => setShowCreatePolicy(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Policy Title</label>
                <input
                  type="text"
                  required
                  value={newPolicyTitle}
                  onChange={(e) => setNewPolicyTitle(e.target.value)}
                  placeholder="e.g. Carbon Neutral Workplace Policy"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Version</label>
                <input
                  type="text"
                  required
                  value={newPolicyVersion}
                  onChange={(e) => setNewPolicyVersion(e.target.value)}
                  placeholder="1.0"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Policy Content</label>
                <textarea
                  rows={5}
                  required
                  value={newPolicyContent}
                  onChange={(e) => setNewPolicyContent(e.target.value)}
                  placeholder="Insert the text of the policy here..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
              >
                Publish Policy
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE AUDIT DIALOG */}
      {showCreateAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-500" /> Schedule Internal Audit
              </h3>
              <button
                onClick={() => setShowCreateAudit(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateAudit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Audit Title</label>
                <input
                  type="text"
                  required
                  value={newAuditTitle}
                  onChange={(e) => setNewAuditTitle(e.target.value)}
                  placeholder="e.g. Q3 Energy Efficiency Audit"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Auditor Name</label>
                  <input
                    type="text"
                    required
                    value={newAuditAuditor}
                    onChange={(e) => setNewAuditAuditor(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newAuditDate}
                    onChange={(e) => setNewAuditDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-850"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Scope</label>
                <input
                  type="text"
                  value={newAuditScope}
                  onChange={(e) => setNewAuditScope(e.target.value)}
                  placeholder="e.g. IT Department Infrastructure"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  rows={2}
                  value={newAuditDescription}
                  onChange={(e) => setNewAuditDescription(e.target.value)}
                  placeholder="Audit procedures summary..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
              >
                Schedule Audit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REPORT COMPLIANCE ISSUE DIALOG */}
      {showReportIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle size={18} className="text-rose-500" /> Report Incident
              </h3>
              <button
                onClick={() => setShowReportIssue(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReportIssue} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Incident Subject</label>
                <input
                  type="text"
                  required
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  placeholder="e.g. Non-compliant waste disposal"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Severity</label>
                  <select
                    value={newIssueSeverity}
                    onChange={(e) => setNewIssueSeverity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Linked Policy (Optional)</label>
                  <select
                    value={newIssuePolicyId}
                    onChange={(e) => setNewIssuePolicyId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                  >
                    <option value="">None</option>
                    {policies.map(p => (
                      <option key={p.policy.id} value={p.policy.id}>{p.policy.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Describe Details</label>
                <textarea
                  rows={4}
                  required
                  value={newIssueDescription}
                  onChange={(e) => setNewIssueDescription(e.target.value)}
                  placeholder="Include dates, department areas, and details..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 py-3 text-sm font-bold text-white hover:from-rose-700 hover:to-red-700 transition-all cursor-pointer shadow-md shadow-rose-500/10"
              >
                Submit Incident Case
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER RISK DIALOG */}
      {showCreateRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-500" /> Register Risk Entry
              </h3>
              <button
                onClick={() => setShowCreateRisk(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRisk} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Risk Title</label>
                <input
                  type="text"
                  required
                  value={newRiskTitle}
                  onChange={(e) => setNewRiskTitle(e.target.value)}
                  placeholder="e.g. Regulatory changes in carbon taxation"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Likelihood (1-5)</label>
                  <select
                    value={newRiskLikelihood}
                    onChange={(e) => setNewRiskLikelihood(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Impact (1-5)</label>
                  <select
                    value={newRiskImpact}
                    onChange={(e) => setNewRiskImpact(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Department</label>
                  <select
                    value={newRiskDeptId}
                    onChange={(e) => setNewRiskDeptId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                  >
                    <option value="">None (Global)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  rows={2}
                  value={newRiskDescription}
                  onChange={(e) => setNewRiskDescription(e.target.value)}
                  placeholder="Explain the source and details of this threat..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Mitigation Strategy</label>
                <textarea
                  rows={2}
                  value={newRiskMitigation}
                  onChange={(e) => setNewRiskMitigation(e.target.value)}
                  placeholder="Mitigation mapping actions..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
              >
                Register Risk Entry
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Governance;
