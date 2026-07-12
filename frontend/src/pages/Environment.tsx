import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Cloud, Zap, Droplets, Trash2, Plus, X, Trash } from "lucide-react";
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
  { key: "carbon", label: "Carbon", icon: Cloud, color: "#2E7D32" },
  { key: "energy", label: "Energy", icon: Zap, color: "#F59E0B" },
  { key: "water", label: "Water", icon: Droplets, color: "#0EA5E9" },
  { key: "waste", label: "Waste", icon: Trash2, color: "#8B5CF6" },
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Environment</h1>
          <p className="text-sm text-slate-500">Track carbon, energy, water and waste metrics.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] transition-colors"
        >
          <Plus size={16} /> Log Metric
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          const catSummary = summary?.summary[cat.key];
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`rounded-lg border p-5 text-left shadow-soft transition-all ${
                isActive ? "border-[#2E7D32] bg-[#E8F5E9]" : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <Icon size={20} style={{ color: cat.color }} />
              <p className="mt-3 text-2xl font-bold text-slate-800">{catSummary?.total ?? 0}</p>
              <p className="text-xs font-medium text-slate-500">
                {cat.label} · {catSummary?.entries ?? 0} entries
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          {CATEGORIES.find((c) => c.key === activeCategory)?.label} trend (last periods)
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2E7D32" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Metric</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMetrics.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No {activeCategory} entries yet. Log your first metric to get started.
                </td>
              </tr>
            )}
            {filteredMetrics.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{m.metric_name}</td>
                <td className="px-4 py-3 text-slate-600">{m.value}</td>
                <td className="px-4 py-3 text-slate-600">{m.unit}</td>
                <td className="px-4 py-3 text-slate-600">{m.period}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-500">
                    <Trash size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Log Environment Metric</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Metric name</label>
                <input
                  required
                  value={form.metric_name}
                  onChange={(e) => setForm({ ...form, metric_name: e.target.value })}
                  placeholder="e.g. Scope 1 Emissions"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Value</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Unit</label>
                  <input
                    required
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="tCO2e, kWh..."
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Period</label>
                <input
                  required
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  placeholder="2026-Q2"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] disabled:opacity-60 transition-colors"
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
