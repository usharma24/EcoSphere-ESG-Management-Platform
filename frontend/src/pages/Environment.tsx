import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Cloud, Zap, Droplets, Trash2, Plus, X, Trash, Sparkles } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Metric {
  id: number;
  category: string;
  metric_name: string;
  value: number;
  unit: string;
  period: string;
  notes: string | null;
  created_at: string;
}

interface Summary {
  summary: Record<string, { total: number; entries: number }>;
  trends: Record<string, { period: string; value: number }[]>;
}

const CATEGORIES = [
  { key: "carbon", label: "Carbon", icon: Cloud, color: "#059669" },
  { key: "energy", label: "Energy", icon: Zap, color: "#d97706" },
  { key: "water", label: "Water", icon: Droplets, color: "#0284c7" },
  { key: "waste", label: "Waste", icon: Trash2, color: "#7c3aed" },
];

const emptyForm = { category: "carbon", metric_name: "", value: 0, unit: "", period: "", notes: "" };

const Environment: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("carbon");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [metricsRes, summaryRes] = await Promise.all([
        apiClient.get("/api/environment/metrics"),
        apiClient.get("/api/environment/summary"),
      ]);
      setMetrics(metricsRes.data);
      setSummary(summaryRes.data);
    } catch {
      setError("Couldn't load environment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/api/environment/metrics", {
        ...form,
        value: Number(form.value),
      });
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Couldn't save this metric.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/environment/metrics/${id}`);
      load();
    } catch {
      setError("Couldn't delete this metric.");
    }
  };

  const filteredMetrics = metrics.filter((m) => m.category === activeCategory);
  const trendData = summary?.trends[activeCategory] || [];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Title skeleton */}
        <div className="flex items-center justify-between">
          <div className="shimmer-skeleton h-10 w-48 rounded-xl" />
          <div className="shimmer-skeleton h-10 w-32 rounded-xl" />
        </div>
        {/* Category cards skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="shimmer-skeleton h-28 rounded-2xl w-full" />
          ))}
        </div>
        {/* Trend graph skeleton */}
        <div className="shimmer-skeleton h-72 rounded-2xl w-full" />
        {/* Table skeleton */}
        <div className="shimmer-skeleton h-64 rounded-2xl w-full" />
      </div>
    );
  }

  const activeCategoryDetails = CATEGORIES.find((c) => c.key === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header view */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Environmental Impact</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Track carbon footprint, energy logs, water usage, and waste generation.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus size={16} /> Log Metric
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">{error}</div>
      )}

      {/* Category Selection Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          const catSummary = summary?.summary[cat.key];
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`glass-card p-5 text-left rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                isActive 
                  ? "border-emerald-500/50 bg-emerald-500/5 ring-2 ring-emerald-500/10" 
                  : "hover:border-slate-200"
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: cat.color }} />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cat.label}</span>
                <span className="p-1 rounded-lg bg-slate-50 border border-slate-100/50">
                  <Icon size={16} style={{ color: cat.color }} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">{catSummary?.total ?? 0}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                {catSummary?.entries ?? 0} total logs
              </p>
            </button>
          );
        })}
      </div>

      {/* Analytics chart */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden border border-slate-100/50 shadow-soft bg-white/70">
        <h2 className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
          <Sparkles size={16} className="text-[#059669]" /> {activeCategoryDetails?.label} Trend & Analysis
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.3} />
            <XAxis dataKey="period" tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              dot={{ r: 4, stroke: "#ffffff", strokeWidth: 2, fill: "#059669" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Log list table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metric Audit Trail</h3>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-full capitalize">
            {activeCategoryDetails?.label} logs
          </span>
        </div>
        
        {filteredMetrics.length === 0 ? (
          /* Premium Empty state illustration */
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 border border-slate-100 mb-4">
              <Cloud size={28} className="text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No logs found</h4>
            <p className="mt-1 text-sm text-slate-400 max-w-xs">
              There are no {activeCategoryDetails?.label} records stored for this period. Click 'Log Metric' to record your first entry.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              Log Metric
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">Metric Label</th>
                  <th className="px-6 py-3.5">Log Value</th>
                  <th className="px-6 py-3.5">Measurement Unit</th>
                  <th className="px-6 py-3.5">Reporting Period</th>
                  <th className="px-6 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMetrics.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 font-semibold text-slate-800">{m.metric_name}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{m.value}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{m.unit}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-100/50">
                        {m.period}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-500" /> Log Environment Metric
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Metric name</label>
                <input
                  required
                  value={form.metric_name}
                  onChange={(e) => setForm({ ...form, metric_name: e.target.value })}
                  placeholder="e.g. Scope 1 Emissions"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Value</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Unit</label>
                  <input
                    required
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="tCO2e, kWh..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Period</label>
                <input
                  required
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  placeholder="2026-Q2"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
              >
                {submitting ? "Saving..." : "Save Metric"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Environment;
