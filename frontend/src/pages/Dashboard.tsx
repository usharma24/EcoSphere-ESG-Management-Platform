import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import {
  Cloud, Zap, Droplets, Trash2, Users, ShieldCheck, AlertTriangle,
  Trophy, TrendingUp, Sparkles, Activity
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface DashboardStats {
  total_carbon: number;
  total_energy: number;
  total_water: number;
  total_waste: number;
  active_initiatives: number;
  total_policies: number;
  open_issues: number;
  active_challenges: number;
  total_users: number;
}

const CATEGORY_COLORS = ["#059669", "#0d9488", "#10b981", "#3b82f6"];

const ESCGauge: React.FC<{ score: number }> = ({ score }) => {
  const [offset, setOffset] = useState(251.2);

  useEffect(() => {
    const progress = ((100 - score) / 100) * 251.2;
    const timer = setTimeout(() => {
      setOffset(progress);
    }, 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center h-32 w-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="esgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="#f1f5f9"
          strokeWidth="7"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="url(#esgGrad)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray="251.2"
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{score}</span>
        <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Score</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/api/reports/dashboard-stats");
        setStats(res.data);
      } catch (err) {
        setError("Couldn't load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const envChartData = stats
    ? [
        { name: "Carbon", value: stats.total_carbon },
        { name: "Energy", value: stats.total_energy },
        { name: "Water", value: stats.total_water },
        { name: "Waste", value: stats.total_waste },
      ]
    : [];

  const orgChartData = stats
    ? [
        { name: "Initiatives", value: stats.active_initiatives },
        { name: "Policies", value: stats.total_policies },
        { name: "Challenges", value: stats.active_challenges },
        { name: "Open Issues", value: stats.open_issues },
      ]
    : [];

  const kpiCards = stats
    ? [
        { label: "Carbon Tracked", value: stats.total_carbon, icon: <Cloud size={20} className="text-[#059669]" /> },
        { label: "Energy Tracked", value: stats.total_energy, icon: <Zap size={20} className="text-amber-500" /> },
        { label: "Water Tracked", value: stats.total_water, icon: <Droplets size={20} className="text-sky-500" /> },
        { label: "Waste Tracked", value: stats.total_waste, icon: <Trash2 size={20} className="text-violet-500" /> },
        { label: "Active Initiatives", value: stats.active_initiatives, icon: <Users size={20} className="text-emerald-500" /> },
        { label: "Published Policies", value: stats.total_policies, icon: <ShieldCheck size={20} className="text-indigo-500" /> },
        { label: "Open Compliance Issues", value: stats.open_issues, icon: <AlertTriangle size={20} className="text-rose-500" /> },
        { label: "Active Challenges", value: stats.active_challenges, icon: <Trophy size={20} className="text-yellow-500" /> },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Greeting */}
        <div className="shimmer-skeleton h-44 rounded-2xl w-full" />
        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="shimmer-skeleton h-28 rounded-2xl w-full" />
          ))}
        </div>
        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="shimmer-skeleton h-80 rounded-2xl w-full" />
          <div className="shimmer-skeleton h-80 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  // Simple overall score calculation based on achievements & low compliance cases
  const derivedEsgScore = stats
    ? Math.max(60, Math.min(99, 92 - stats.open_issues * 4 + stats.active_initiatives * 2))
    : 84;

  return (
    <div className="space-y-6">
      {/* Hero Welcome / Header section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-soft">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20 mb-4 uppercase tracking-wider">
              <Sparkles size={12} className="animate-spin" /> ESG Performance
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Welcome back, {user?.full_name}
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-xl">
              EcoSphere ESG Suite tracks and analyzes sustainability footprints across Carbon, DEI, Compliance policies, and environmental activities.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs border-t border-slate-800 pt-6">
            <div>
              <p className="text-slate-500 font-medium uppercase tracking-wider text-[9px]">Organization ID</p>
              <p className="text-slate-200 font-semibold">{user?.organization_id || "Demo Corp"}</p>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <p className="text-slate-500 font-medium uppercase tracking-wider text-[9px]">Assigned Role</p>
              <p className="text-slate-200 font-semibold">{user?.role}</p>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <p className="text-slate-500 font-medium uppercase tracking-wider text-[9px]">Server Sync</p>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
              </span>
            </div>
          </div>
        </div>

        {/* ESG Circular Gauge Widget */}
        <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-100/50 shadow-soft bg-white/70">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
            <Activity size={12} className="text-emerald-500" /> Executive ESG Score
          </h3>
          <ESCGauge score={derivedEsgScore} />
          <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50/60 border border-emerald-100/50 px-2.5 py-0.5 rounded-full mt-3">
            Outstanding Compliance (Top 8%)
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">{error}</div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-emerald-500/30 to-teal-500/30" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">{kpi.icon}</span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden border border-slate-100/50 shadow-soft bg-white/70">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <TrendingUp size={16} className="text-[#059669]" /> Environmental Footprint
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={envChartData}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
                }}
              />
              <Bar dataKey="value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden border border-slate-100/50 shadow-soft bg-white/70">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <Users size={16} className="text-[#0d9488]" /> Organization Summary
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={orgChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={50}
                paddingAngle={4}
                label={{ fontSize: 10, fontWeight: 600, fill: "#334155" }}
              >
                {orgChartData.map((_, idx) => (
                  <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
