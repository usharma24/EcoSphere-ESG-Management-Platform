import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { FileText, FileSpreadsheet, Download, Plus, X, Trash } from "lucide-react";

interface Report {
  id: number;
  title: string;
  report_type: string;
  format: string;
  created_at: string;
}

const REPORT_TYPES = [
  { key: "environmental", label: "Environmental" },
  { key: "social", label: "Social" },
  { key: "governance", label: "Governance" },
  { key: "comprehensive", label: "Comprehensive (all)" },
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500">Generate and download ESG reports in PDF or CSV.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] transition-colors"
        >
          <Plus size={16} /> Generate Report
        </button>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Generated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No reports generated yet.
                </td>
              </tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{r.title}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{r.report_type}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                    {r.format === "pdf" ? <FileText size={13} /> : <FileSpreadsheet size={13} />}
                    {r.format.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => handleDownload(r)} className="flex items-center gap-1 text-xs font-semibold text-[#2E7D32] hover:text-[#1B5E20]">
                      <Download size={14} /> Download
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-red-500">
                      <Trash size={14} />
                    </button>
                  </div>
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
              <h3 className="text-lg font-semibold text-slate-800">Generate Report</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Q2 2026 ESG Report"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Report type</label>
                <select
                  value={form.report_type}
                  onChange={(e) => setForm({ ...form, report_type: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                >
                  {REPORT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Format</label>
                <div className="flex gap-2">
                  {["pdf", "csv"].map((fmt) => (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() => setForm({ ...form, format: fmt })}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                        form.format === fmt ? "border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20]" : "border-slate-200 text-slate-500"
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
                className="w-full rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] disabled:opacity-60 transition-colors"
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
