import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Users, Plus, X, Trash, Heart, GraduationCap, HandHeart, Scale, Sparkles } from "lucide-react";

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
  DEI: <Scale size={15} />,
  Community: <HandHeart size={15} />,
  Wellbeing: <Heart size={15} />,
  Training: <GraduationCap size={15} />,
};

const STATUS_CLASSES: Record<string, string> = {
  Planned: "bg-slate-100 text-slate-600 border border-slate-200/50",
  Active: "bg-emerald-50 text-emerald-700 border border-emerald-100/50",
  Completed: "bg-sky-50 text-sky-700 border border-sky-100/50",
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="shimmer-skeleton h-10 w-48 rounded-xl" />
          <div className="shimmer-skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="shimmer-skeleton h-28 rounded-2xl w-full" />
          ))}
        </div>
        <div className="shimmer-skeleton h-10 w-64 rounded-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="shimmer-skeleton h-44 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  const reachedCount = initiatives.reduce((sum, i) => sum + i.actual_participants, 0);

  const kpis = [
    { label: "Total Initiatives", value: summary?.total ?? 0, icon: <Users size={20} className="text-emerald-600" /> },
    { label: "Active Programs", value: summary?.active ?? 0, icon: <ActivityIcon /> },
    { label: "Completed Projects", value: summary?.completed ?? 0, icon: <CheckIcon /> },
    { label: "Participants Reached", value: reachedCount, icon: <PeopleIcon /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Social Impact</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage diversity, equity & inclusion (DEI), wellbeing, and community partnerships.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus size={16} /> New Initiative
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">{error}</div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-emerald-500/30 to-teal-500/30" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">{kpi.icon}</span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/20 max-w-max">
        <button
          onClick={() => setFilterCategory("all")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            filterCategory === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              filterCategory === cat
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <span className="shrink-0">{CATEGORY_ICONS[cat]}</span>
            <span>{cat}</span>
            {summary && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterCategory === cat ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                {summary.by_category[cat] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          /* Empty state block */
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-slate-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 mb-4">
              <Users size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800">No initiatives found</h4>
            <p className="mt-1 text-sm text-slate-400 max-w-xs">
              No initiatives match the category filter. Start an initiative to see entries here.
            </p>
          </div>
        ) : (
          filtered.map((init) => {
            const ratio = init.target_participants > 0 ? init.actual_participants / init.target_participants : 0;
            const pct = Math.min(100, Math.round(ratio * 100));
            return (
              <div key={init.id} className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-100/80 border border-slate-200/50 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                      {CATEGORY_ICONS[init.category]} {init.category}
                    </span>
                    <button
                      onClick={() => handleDelete(init.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                  
                  <h3 className="mt-4 font-bold text-slate-800 text-base leading-snug">{init.title}</h3>
                  {init.description && (
                    <p className="mt-2 text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">{init.description}</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 space-y-4">
                  {/* Custom progress bar */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      <span>Reach Progress</span>
                      <span className="text-slate-700">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_CLASSES[init.status] || "bg-slate-100 text-slate-600"}`}>
                      {init.status}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {init.actual_participants} / {init.target_participants} reached
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-500" /> Launch Social Initiative
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
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Initiative Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Annual DEI Training Workshop"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Summarize objectives, goals, and outline of the initiative."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                  >
                    {["Planned", "Active", "Completed"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Target Reach</label>
                  <input
                    type="number"
                    min={0}
                    value={form.target_participants}
                    onChange={(e) => setForm({ ...form, target_participants: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Actual Reach</label>
                  <input
                    type="number"
                    min={0}
                    value={form.actual_participants}
                    onChange={(e) => setForm({ ...form, actual_participants: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
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

// SVG Icon placeholders
const ActivityIcon = () => (
  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PeopleIcon = () => (
  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export default Social;
