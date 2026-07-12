import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Users, Plus, X, Trash, Heart, GraduationCap, HandHeart, Scale } from "lucide-react";

interface Initiative {
  id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  target_participants: number;
  actual_participants: number;
  created_at: string;
}

interface Summary {
  total: number;
  active: number;
  completed: number;
  by_category: Record<string, number>;
}

const CATEGORIES = ["DEI", "Community", "Wellbeing", "Training"];
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  DEI: <Scale size={16} />,
  Community: <HandHeart size={16} />,
  Wellbeing: <Heart size={16} />,
  Training: <GraduationCap size={16} />,
};
const STATUS_COLORS: Record<string, string> = {
  Planned: "bg-slate-100 text-slate-600",
  Active: "bg-[#E8F5E9] text-[#1B5E20]",
  Completed: "bg-blue-50 text-blue-600",
};

const emptyForm = {
  title: "", description: "", category: "DEI", status: "Planned",
  target_participants: 0, actual_participants: 0,
};

const Social: React.FC = () => {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [initRes, summaryRes] = await Promise.all([
        apiClient.get("/api/social/initiatives"),
        apiClient.get("/api/social/summary"),
      ]);
      setInitiatives(initRes.data);
      setSummary(summaryRes.data);
    } catch {
      setError("Couldn't load social impact data.");
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
      await apiClient.post("/api/social/initiatives", {
        ...form,
        target_participants: Number(form.target_participants),
        actual_participants: Number(form.actual_participants),
      });
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Couldn't save this initiative.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/social/initiatives/${id}`);
      load();
    } catch {
      setError("Couldn't delete this initiative.");
    }
  };

  const filtered = filterCategory === "all" ? initiatives : initiatives.filter((i) => i.category === filterCategory);

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
          <h1 className="text-2xl font-bold text-slate-800">Social Impact</h1>
          <p className="text-sm text-slate-500">DEI, community engagement, and employee wellbeing initiatives.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] transition-colors"
        >
          <Plus size={16} /> New Initiative
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-soft">
          <Users size={20} className="text-[#2E7D32]" />
          <p className="mt-3 text-2xl font-bold text-slate-800">{summary?.total ?? 0}</p>
          <p className="text-xs font-medium text-slate-500">Total Initiatives</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-soft">
          <p className="text-2xl font-bold text-slate-800">{summary?.active ?? 0}</p>
          <p className="text-xs font-medium text-slate-500">Active</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-soft">
          <p className="text-2xl font-bold text-slate-800">{summary?.completed ?? 0}</p>
          <p className="text-xs font-medium text-slate-500">Completed</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-soft">
          <p className="text-2xl font-bold text-slate-800">
            {initiatives.reduce((sum, i) => sum + i.actual_participants, 0)}
          </p>
          <p className="text-xs font-medium text-slate-500">Participants Reached</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterCategory === "all" ? "bg-[#2E7D32] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterCategory === cat ? "bg-[#2E7D32] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {CATEGORY_ICONS[cat]} {cat} {summary && `(${summary.by_category[cat] ?? 0})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-slate-200 py-12 text-center text-slate-400">
            No initiatives in this category yet.
          </div>
        )}
        {filtered.map((init) => (
          <div key={init.id} className="rounded-lg border border-slate-100 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {CATEGORY_ICONS[init.category]} {init.category}
              </span>
              <button onClick={() => handleDelete(init.id)} className="text-slate-300 hover:text-red-500">
                <Trash size={14} />
              </button>
            </div>
            <h3 className="mt-3 font-semibold text-slate-800">{init.title}</h3>
            {init.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{init.description}</p>}
            <div className="mt-4 flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[init.status] || "bg-slate-100 text-slate-600"}`}>
                {init.status}
              </span>
              <span className="text-xs text-slate-500">
                {init.actual_participants}/{init.target_participants} participants
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">New Social Initiative</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  >
                    {["Planned", "Active", "Completed"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Target participants</label>
                  <input
                    type="number"
                    min={0}
                    value={form.target_participants}
                    onChange={(e) => setForm({ ...form, target_participants: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Actual participants</label>
                  <input
                    type="number"
                    min={0}
                    value={form.actual_participants}
                    onChange={(e) => setForm({ ...form, actual_participants: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] disabled:opacity-60 transition-colors"
              >
                {submitting ? "Saving..." : "Create Initiative"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Social;
