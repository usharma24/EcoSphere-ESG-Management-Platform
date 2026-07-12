import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { FileText, FileSpreadsheet, Download, Plus, X, Trash, Sparkles } from "lucide-react";

interface Report {
  id: number;
  title: string;
  report_type: string;
  format: string;
  created_at: string;
}

const REPORT_TYPES = [
  { key: "environmental", label: "Environmental Impact Report" },
  { key: "social", label: "Social Initiatives Report" },
  { key: "governance", label: "Governance & Policies Audit" },
  { key: "comprehensive", label: "Comprehensive ESG Overview" },
];

const emptyForm = { title: "", report_type: "comprehensive", format: "pdf" };

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/reports/");
      setReports(res.data);
    } catch {
      setError("Couldn't load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    try {
      await apiClient.post("/api/reports/generate", form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Couldn't generate this report.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const res = await apiClient.get(`/api/reports/${report.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${report.title}.${report.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't download this report.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/reports/${id}`);
      load();
    } catch {
      setError("Couldn't delete this report.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="shimmer-skeleton h-10 w-48 rounded-xl" />
          <div className="shimmer-skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="shimmer-skeleton h-64 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ESG Compliance Reports</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Compile and export audit-ready PDF summaries and CSV data metrics.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus size={16} /> Generate Report
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">{error}</div>
      )}

      {/* Reports Table view */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Documents</h3>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-full">
            {reports.length} files available
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 mb-4">
              <FileText size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800">No reports generated</h4>
            <p className="mt-1 text-sm text-slate-400 max-w-xs font-medium">
              You haven't compiled any ESG metrics reports yet. Select 'Generate Report' to compile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">Document Title</th>
                  <th className="px-6 py-3.5">Report Category</th>
                  <th className="px-6 py-3.5">Export Format</th>
                  <th className="px-6 py-3.5">Date Compiled</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 font-semibold text-slate-800">{r.title}</td>
                    <td className="px-6 py-4 font-semibold text-slate-500 capitalize">{r.report_type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-bold border ${
                        r.format === "pdf"
                          ? "bg-rose-50 border-rose-100 text-rose-600"
                          : "bg-emerald-50 border-emerald-100 text-emerald-600"
                      }`}>
                        {r.format === "pdf" ? <FileText size={13} /> : <FileSpreadsheet size={13} />}
                        {r.format.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-400 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3.5">
                        <button
                          onClick={() => handleDownload(r)}
                          className="inline-flex items-center gap-1.5 font-bold text-emerald-650 hover:text-emerald-700 text-xs uppercase tracking-wider cursor-pointer"
                        >
                          <Download size={14} /> Download
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-slate-300 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-500 animate-spin" /> Compile ESG Report
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Report Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Q2 2026 ESG Report"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Report Scope</label>
                <select
                  value={form.report_type}
                  onChange={(e) => setForm({ ...form, report_type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                >
                  {REPORT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Format</label>
                <div className="flex gap-3">
                  {["pdf", "csv"].map((fmt) => (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() => setForm({ ...form, format: fmt })}
                      className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        form.format === fmt
                          ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-700 ring-2 ring-emerald-500/10 font-bold"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={generating}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
              >
                {generating ? "Generating..." : "Generate & Compile"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
