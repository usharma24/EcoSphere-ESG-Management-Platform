import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import { 
  Shield, FileText, AlertTriangle, Calendar, Clipboard, 
  Plus, Check, AlertCircle, UserCheck, ShieldAlert,
  ArrowRight, ShieldCheck, Activity
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

  // Handlers
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
    if (score >= 15) return "bg-red-50 text-red-700 border-red-200";
    if (score >= 8) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-green-50 text-green-700 border-green-200";
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-100 text-red-800 border-red-200";
      case "High": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Medium": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Resolved":
      case "Closed":
      case "Mitigated":
      case "Completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "Under Review":
      case "In Progress":
      case "Monitoring":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Loading Governance Module...</p>
        </div>
      </div>
    );
  }

  // Dashboard Stats calculations
  const pendingAcksCount = policies.filter(p => !p.acknowledged).length;
  const activeRisksCount = risks.filter(r => r.status !== "Mitigated").length;
  const openIssuesCount = complianceIssues.filter(c => c.status === "Open" || c.status === "Under Review").length;
  const upcomingAuditsCount = audits.filter(a => a.status === "Scheduled" || a.status === "In Progress").length;

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-12">
      {/* Upper Navigation and Header */}
      <div className="bg-white border-b border-slate-100 py-6 px-8 shadow-sm">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#2E7D32] font-semibold text-sm">
              <Shield className="h-4 w-4" />
              <span>Governance & Compliance</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">EcoSphere Corporate Governance</h1>
            <p className="text-slate-500 text-sm">Policies, Risk registers, Scheduling audits, and tracking Compliance</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {isAdminOrManager && (
              <>
                <button
                  onClick={() => setShowCreatePolicy(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#2E7D32] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Publish Policy
                </button>
                <button
                  onClick={() => setShowCreateAudit(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Calendar className="h-4 w-4 text-[#43A047]" /> Schedule Audit
                </button>
                <button
                  onClick={() => setShowCreateRisk(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Activity className="h-4 w-4 text-orange-500" /> Register Risk
                </button>
              </>
            )}
            <button
              onClick={() => setShowReportIssue(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors shadow-sm"
            >
              <AlertTriangle className="h-4 w-4" /> Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-8 mt-8">
        
        {/* Error / Success Toast Notifications */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200 shadow-soft">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-auto font-semibold hover:underline">Dismiss</button>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-md bg-green-50 p-4 text-sm text-green-800 border border-green-200 shadow-soft">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#2E7D32]" />
            <span className="font-medium">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-auto font-semibold hover:underline">Dismiss</button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 gap-6 mb-8 overflow-x-auto">
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
              className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-[#2E7D32] text-[#2E7D32]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab.id === "compliance" ? "bg-red-100 text-red-800" : "bg-[#2E7D32]/10 text-[#2E7D32]"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Pending Policies", value: pendingAcksCount, desc: "Awaiting your signature", icon: FileText, color: "text-[#2E7D32] bg-green-50" },
                { title: "Active Governance Risks", value: activeRisksCount, desc: "Monitored threat points", icon: Clipboard, color: "text-orange-600 bg-orange-50" },
                { title: "Unresolved Compliance Issues", value: openIssuesCount, desc: "Pending internal cases", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
                { title: "Upcoming Audits", value: upcomingAuditsCount, desc: "Scheduled inspections", icon: Calendar, color: "text-blue-600 bg-blue-50" }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg border border-slate-100 shadow-soft flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{kpi.title}</span>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{kpi.value}</h3>
                    <p className="text-xs text-slate-500 mt-1.5">{kpi.desc}</p>
                  </div>
                  <div className={`p-4 rounded-md ${kpi.color}`}>
                    <kpi.icon className="h-6 w-6" />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Overview Boards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Policies list preview */}
              <div className="bg-white rounded-lg border border-slate-100 shadow-soft p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#2E7D32]" /> Action Items: Policies
                  </h3>
                  <button onClick={() => setActiveTab("policies")} className="text-xs font-semibold text-[#2E7D32] hover:underline flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-4">
                  {policies.slice(0, 3).map((policyUser) => (
                    <div 
                      key={policyUser.policy.id} 
                      onClick={() => setShowPolicyModal(policyUser)}
                      className="border border-slate-100 hover:border-[#2E7D32]/30 rounded-md p-4 bg-slate-50/50 hover:bg-white transition-all duration-200 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800">{policyUser.policy.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">Version {policyUser.policy.version} • Published {new Date(policyUser.policy.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        {policyUser.acknowledged ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-700">
                            <Check className="h-3 w-3" /> Signed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2E7D32]/10 border border-[#2E7D32]/20 text-[#2E7D32]">
                            Sign now
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {policies.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No policies published yet.</p>
                  )}
                </div>
              </div>

              {/* Audits preview */}
              <div className="bg-white rounded-lg border border-slate-100 shadow-soft p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" /> Audit Schedule
                  </h3>
                  <button onClick={() => setActiveTab("audits")} className="text-xs font-semibold text-[#2E7D32] hover:underline flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-4">
                  {audits.slice(0, 3).map((audit) => (
                    <div key={audit.id} className="border border-slate-100 rounded-md p-4 bg-slate-50/50 flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Scope: {audit.scope || "General"}</span>
                        <h4 className="font-semibold text-sm text-slate-800 mt-0.5">{audit.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">Auditor: {audit.auditor_name}</p>
                        <p className="text-[11px] text-[#2E7D32] font-medium mt-1">Scheduled: {new Date(audit.scheduled_date).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getStatusBadgeColor(audit.status)}`}>
                        {audit.status}
                      </span>
                    </div>
                  ))}
                  {audits.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No audits scheduled.</p>
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
              <h3 className="text-lg font-bold text-slate-800">Corporate Policies & Digital Sign-off</h3>
              <span className="text-xs text-slate-500">Every policy requires employee acknowledgement to ensure compliance standards.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policies.map((pUser) => (
                <div key={pUser.policy.id} className="bg-white rounded-lg border border-slate-100 shadow-soft p-6 flex flex-col justify-between hover:border-slate-200 transition-all duration-200">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-500">v{pUser.policy.version}</span>
                      {pUser.acknowledged ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-700">
                          <Check className="h-3.5 w-3.5" /> Acknowledged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-700">
                          Pending Action
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mt-3">{pUser.policy.title}</h4>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-3 bg-slate-50 p-3 rounded">
                      {pUser.policy.content}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Published {new Date(pUser.policy.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => setShowPolicyModal(pUser)}
                      className="text-sm font-semibold text-[#2E7D32] hover:text-[#1B5E20] flex items-center gap-1"
                    >
                      {pUser.acknowledged ? "View Signed Policy" : "Read & Sign"} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {policies.length === 0 && (
                <div className="col-span-2 bg-white rounded-lg border border-slate-100 p-12 text-center text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p>No active policies published.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: COMPLIANCE CASES */}
        {activeTab === "compliance" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Compliance & Regulatory Incident Logs</h3>
              <button
                onClick={() => setShowReportIssue(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#2E7D32] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] transition-colors"
              >
                <Plus className="h-4 w-4" /> Report New Case
              </button>
            </div>

            <div className="bg-white rounded-lg border border-slate-100 shadow-soft overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported Case</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reporter</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {complianceIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{issue.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{issue.description}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Date: {new Date(issue.created_at).toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 border text-xs font-semibold rounded-full ${getSeverityBadgeColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 border text-[11px] font-bold uppercase rounded-full ${getStatusBadgeColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {issue.reported_by_name || "Internal"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {issue.assigned_to_name ? (
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <UserCheck className="h-4 w-4 text-[#2E7D32]" /> {issue.assigned_to_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex justify-end gap-2">
                          {/* Assign to me option */}
                          {!issue.assigned_to_id && (
                            <button
                              onClick={() => handleAssignIssueToMe(issue.id)}
                              className="font-semibold text-[#2E7D32] hover:underline"
                            >
                              Assign to me
                            </button>
                          )}
                          
                          {/* Management state transition buttons */}
                          {(isAdminOrManager || isDeptManager) && (
                            <>
                              {issue.status === "Open" && (
                                <button
                                  onClick={() => handleUpdateIssueStatus(issue.id, "Under Review")}
                                  className="font-semibold text-blue-600 hover:underline"
                                >
                                  Review
                                </button>
                              )}
                              {(issue.status === "Open" || issue.status === "Under Review") && (
                                <button
                                  onClick={() => handleUpdateIssueStatus(issue.id, "Resolved")}
                                  className="font-semibold text-green-600 hover:underline"
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
                        <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No compliance issues logged.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RISK REGISTER */}
        {activeTab === "risks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Governance & Climate Risk Register</h3>
                <p className="text-sm text-slate-500">Evaluating likelihood and business impacts of compliance and operational items.</p>
              </div>
              {isAdminOrManager && (
                <button
                  onClick={() => setShowCreateRisk(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#2E7D32] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Add Risk Item
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-100 shadow-soft overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Threat Details</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Likelihood (1-5)</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Impact (1-5)</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Score</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mitigation Plan</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    {isAdminOrManager && <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {risks.map((risk) => {
                    const score = risk.likelihood * risk.impact;
                    let threatLabel = "Low";
                    if (score >= 15) threatLabel = "High / Critical";
                    else if (score >= 8) threatLabel = "Medium";

                    return (
                      <tr key={risk.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{risk.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{risk.description || "No description provided."}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-slate-700">
                          {risk.likelihood}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-slate-700">
                          {risk.impact}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 border text-xs font-semibold rounded-full ${getRiskBadgeColor(risk.likelihood, risk.impact)}`}>
                            {score} - {threatLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-600 italic bg-slate-50/50 p-2.5 border border-slate-100 rounded-md max-w-xs">{risk.mitigation_strategy || "No mitigation mapped."}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 border text-[10px] font-bold uppercase rounded-full ${getStatusBadgeColor(risk.status)}`}>
                            {risk.status}
                          </span>
                        </td>
                        {isAdminOrManager && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                            <div className="flex justify-end gap-2">
                              {risk.status !== "Mitigated" && (
                                <button
                                  onClick={() => handleUpdateRiskStatus(risk.id, "Mitigated")}
                                  className="font-semibold text-green-600 hover:underline"
                                >
                                  Mitigate
                                </button>
                              )}
                              {risk.status === "Identified" && (
                                <button
                                  onClick={() => handleUpdateRiskStatus(risk.id, "Monitoring")}
                                  className="font-semibold text-blue-600 hover:underline"
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
                        <Shield className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No risk items registered.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: AUDITS */}
        {activeTab === "audits" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Governance & Policy Audits Schedule</h3>
              <p className="text-sm text-slate-500">Systematic independent verification tracks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {audits.map((audit) => (
                <div key={audit.id} className="bg-white rounded-lg border border-slate-100 shadow-soft p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded">Scope: {audit.scope || "General"}</span>
                      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getStatusBadgeColor(audit.status)}`}>
                        {audit.status}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mt-3">{audit.title}</h4>
                    <p className="text-sm text-slate-500 mt-2 bg-slate-50/50 p-3 rounded border border-slate-100">
                      {audit.description || "No audit details supplied."}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs text-slate-500">
                    <div>
                      <span className="block text-slate-400">Auditor Contact</span>
                      <span className="font-semibold text-slate-700">{audit.auditor_name}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">Scheduled Date</span>
                      <span className="font-semibold text-[#2E7D32]">{new Date(audit.scheduled_date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {audits.length === 0 && (
                <div className="col-span-2 bg-white rounded-lg border border-slate-100 p-12 text-center text-slate-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3" />
                  <p>No compliance audits scheduled.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* POLICY DIGITAL ACKNOWLEDGEMENT MODAL */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-soft border border-slate-200 p-8 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800">{showPolicyModal.policy.title}</h3>
            <div className="flex gap-4 text-xs text-slate-400 mt-2 border-b border-slate-100 pb-3">
              <span>Version {showPolicyModal.policy.version}</span>
              <span>Published {new Date(showPolicyModal.policy.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="mt-6 text-sm text-slate-700 bg-slate-50/50 border border-slate-100 p-6 rounded-md whitespace-pre-wrap leading-relaxed">
              {showPolicyModal.policy.content}
            </div>

            {showPolicyModal.acknowledged ? (
              <div className="mt-8 flex items-center gap-3 bg-green-50 text-green-700 border border-green-200 p-4 rounded-md text-sm">
                <ShieldCheck className="h-6 w-6 text-[#2E7D32] shrink-0" />
                <div>
                  <p className="font-semibold">You acknowledged this policy digitally.</p>
                  <p className="text-xs text-green-600 mt-0.5">Signed at: {new Date(showPolicyModal.acknowledged_at!).toLocaleString()}</p>
                </div>
                <button onClick={() => setShowPolicyModal(null)} className="ml-auto font-semibold hover:underline">Close</button>
              </div>
            ) : (
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowPolicyModal(null)}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleAcknowledgePolicy(showPolicyModal.policy.id)}
                  className="rounded-md bg-[#2E7D32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B5E20] transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-soft border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Publish Corporate Policy</h3>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">Policy Title</label>
                <input
                  type="text"
                  required
                  value={newPolicyTitle}
                  onChange={(e) => setNewPolicyTitle(e.target.value)}
                  placeholder="e.g. Carbon Neutral Workplace Policy"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Version</label>
                  <input
                    type="text"
                    required
                    value={newPolicyVersion}
                    onChange={(e) => setNewPolicyVersion(e.target.value)}
                    placeholder="1.0"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Policy Content</label>
                <textarea
                  rows={6}
                  required
                  value={newPolicyContent}
                  onChange={(e) => setNewPolicyContent(e.target.value)}
                  placeholder="Insert the text of the policy here..."
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePolicy(false)}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#2E7D32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B5E20]"
                >
                  Publish Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE AUDIT DIALOG */}
      {showCreateAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-soft border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Schedule Internal Audit</h3>
            <form onSubmit={handleCreateAudit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">Audit Title</label>
                <input
                  type="text"
                  required
                  value={newAuditTitle}
                  onChange={(e) => setNewAuditTitle(e.target.value)}
                  placeholder="e.g. Q3 Energy Efficiency Audit"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Auditor Name</label>
                  <input
                    type="text"
                    required
                    value={newAuditAuditor}
                    onChange={(e) => setNewAuditAuditor(e.target.value)}
                    placeholder="John Doe"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Audit Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newAuditDate}
                    onChange={(e) => setNewAuditDate(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Scope</label>
                <input
                  type="text"
                  value={newAuditScope}
                  onChange={(e) => setNewAuditScope(e.target.value)}
                  placeholder="e.g. IT Department Infrastructure"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Description</label>
                <textarea
                  rows={3}
                  value={newAuditDescription}
                  onChange={(e) => setNewAuditDescription(e.target.value)}
                  placeholder="Audit procedures summary..."
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAudit(false)}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#2E7D32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B5E20]"
                >
                  Schedule Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT COMPLIANCE ISSUE DIALOG */}
      {showReportIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-soft border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Report Governance Incident</h3>
            <form onSubmit={handleReportIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">Incident Subject</label>
                <input
                  type="text"
                  required
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  placeholder="e.g. Non-compliant waste disposal in building B"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Severity</label>
                  <select
                    value={newIssueSeverity}
                    onChange={(e) => setNewIssueSeverity(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Linked Policy (Optional)</label>
                  <select
                    value={newIssuePolicyId}
                    onChange={(e) => setNewIssuePolicyId(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                  >
                    <option value="">None</option>
                    {policies.map(p => (
                      <option key={p.policy.id} value={p.policy.id}>{p.policy.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Describe Incident details</label>
                <textarea
                  rows={4}
                  required
                  value={newIssueDescription}
                  onChange={(e) => setNewIssueDescription(e.target.value)}
                  placeholder="Include dates, department areas, and details..."
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportIssue(false)}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Submit Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER RISK DIALOG */}
      {showCreateRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-soft border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Register Risk Entry</h3>
            <form onSubmit={handleCreateRisk} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">Risk Title</label>
                <input
                  type="text"
                  required
                  value={newRiskTitle}
                  onChange={(e) => setNewRiskTitle(e.target.value)}
                  placeholder="e.g. Regulatory changes in carbon taxation"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Likelihood (1-5)</label>
                  <select
                    value={newRiskLikelihood}
                    onChange={(e) => setNewRiskLikelihood(Number(e.target.value))}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Impact (1-5)</label>
                  <select
                    value={newRiskImpact}
                    onChange={(e) => setNewRiskImpact(Number(e.target.value))}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Department</label>
                  <select
                    value={newRiskDeptId}
                    onChange={(e) => setNewRiskDeptId(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                  >
                    <option value="">None (Global)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Description</label>
                <textarea
                  rows={2}
                  value={newRiskDescription}
                  onChange={(e) => setNewRiskDescription(e.target.value)}
                  placeholder="Explain the source and details of this threat..."
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Mitigation Strategy</label>
                <textarea
                  rows={3}
                  value={newRiskMitigation}
                  onChange={(e) => setNewRiskMitigation(e.target.value)}
                  placeholder="Specific actions to mitigate the risk..."
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 mt-1 py-2.5 px-3 text-sm text-slate-800 focus:outline-[#2E7D32]"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRisk(false)}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#2E7D32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B5E20]"
                >
                  Register Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Governance;
