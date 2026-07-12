import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import {
  Cloud, Zap, Droplets, Trash2, Users, ShieldCheck, AlertTriangle,
  Trophy, TrendingUp,
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

const CATEGORY_COLORS = ["#2E7D32", "#43A047", "#66BB6A", "#A5D6A7"];

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
        { label: "Carbon Tracked", value: stats.total_carbon, icon: <Cloud size={20} />, unit: "" },
        { label: "Energy Tracked", value: stats.total_energy, icon: <Zap size={20} />, unit: "" },
        { label: "Water Tracked", value: stats.total_water, icon: <Droplets size={20} />, unit: "" },
        { label: "Waste Tracked", value: stats.total_waste, icon: <Trash2 size={20} />, unit: "" },
        { label: "Active Initiatives", value: stats.active_initiatives, icon: <Users size={20} /> },
        { label: "Policies", value: stats.total_policies, icon: <ShieldCheck size={20} /> },
        { label: "Open Issues", value: stats.open_issues, icon: <AlertTriangle size={20} /> },
        { label: "Active Challenges", value: stats.active_challenges, icon: <Trophy size={20} /> },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span className="text-[#2E7D32]">🌍</span> ESG Dashboard
        </h1>
        <p className="text-sm text-slate-500">Welcome back, {user?.full_name}. Here's your organization's ESG overview.</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-slate-100 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{kpi.icon}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{kpi.value}</p>
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <TrendingUp size={16} className="text-[#2E7D32]" /> Environmental Metrics Totals
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={envChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#2E7D32" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Users size={16} className="text-[#2E7D32]" /> Organization Activity
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={orgChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {orgChartData.map((_, idx) => (
                  <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
