import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Bell, CheckCheck, AlertCircle, Info, Award, ShieldAlert, Sparkles } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  compliance: (
    <div className="p-2 rounded-xl bg-rose-50 border border-rose-100/50 text-rose-500 shrink-0">
      <ShieldAlert size={16} />
    </div>
  ),
  approval: (
    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-500 shrink-0">
      <CheckCheck size={16} />
    </div>
  ),
  policy: (
    <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100/50 text-indigo-500 shrink-0">
      <Info size={16} />
    </div>
  ),
  badge: (
    <div className="p-2 rounded-xl bg-amber-50 border border-amber-100/50 text-amber-500 shrink-0">
      <Award size={16} />
    </div>
  ),
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="shimmer-skeleton h-10 w-48 rounded-xl" />
          <div className="shimmer-skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="shimmer-skeleton h-[calc(100vh-14rem)] rounded-2xl w-full" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            <Bell className="text-emerald-500 animate-swing" size={24} /> Notification Feed
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Review policy handbooks signature actions, gamified achievements and compliance updates.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-650 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <CheckCheck size={14} className="text-emerald-500" /> Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">{error}</div>
      )}

      {/* Filter Segment */}
      <div className="flex gap-2 items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/20 max-w-max">
        {(["all", "unread"] as const).map((f) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <span>{f}</span>
              {f === "unread" && unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white ml-1.5">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List Card */}
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-md shadow-soft">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-350 mb-4">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800">Clear notifications</h4>
            <p className="mt-1 text-sm text-slate-400 max-w-xs font-medium">
              You are completely up to date. We'll alert you when updates trigger.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`flex items-start gap-4 px-6 py-5 transition-all duration-200 cursor-pointer ${
                !n.is_read
                  ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-emerald-500"
                  : "hover:bg-slate-50/50 border-l-4 border-transparent"
              }`}
            >
              <div className="mt-0.5">
                {TYPE_ICON[n.type] || (
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-400 shrink-0">
                    <Info size={16} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 leading-snug truncate">{n.title}</p>
                  {!n.is_read && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-emerald-500 text-white uppercase tracking-wider">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500 leading-relaxed">{n.message}</p>
                <p className="mt-2 text-[10px] font-medium text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
