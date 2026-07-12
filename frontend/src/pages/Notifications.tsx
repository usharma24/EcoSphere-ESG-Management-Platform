import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Bell, CheckCheck, AlertCircle, Info, Award, ShieldAlert } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  compliance: <ShieldAlert size={16} className="text-red-500" />,
  approval: <CheckCheck size={16} className="text-blue-500" />,
  policy: <Info size={16} className="text-slate-500" />,
  badge: <Award size={16} className="text-amber-500" />,
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/notifications/${filter === "unread" ? "?unread_only=true" : ""}`);
      setNotifications(res.data);
    } catch {
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const markRead = async (id: number) => {
    try {
      await apiClient.post(`/api/notifications/${id}/read`);
      load();
    } catch {
      setError("Couldn't mark notification as read.");
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.post("/api/notifications/read-all");
      load();
    } catch {
      setError("Couldn't mark all as read.");
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
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Bell className="text-[#2E7D32]" size={22} /> Notifications
          </h1>
          <p className="text-sm text-slate-500">Stay on top of compliance, approvals, and badge updates.</p>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <CheckCheck size={16} /> Mark all read
        </button>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === f ? "bg-[#2E7D32] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-soft">
        {notifications.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <AlertCircle size={24} />
            <p className="text-sm">No notifications to show.</p>
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markRead(n.id)}
            className={`flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors hover:bg-slate-50 ${
              !n.is_read ? "bg-[#F7FBF7]" : ""
            }`}
          >
            <div className="mt-0.5">{TYPE_ICON[n.type] || <Info size={16} className="text-slate-400" />}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
