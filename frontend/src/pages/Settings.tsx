import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Settings as SettingsIcon, Bell, SlidersHorizontal, Sparkles } from "lucide-react";

interface NotificationSettings {
  email_enabled: boolean;
  in_app_enabled: boolean;
  notify_compliance: boolean;
  notify_approvals: boolean;
  notify_policies: boolean;
  notify_badges: boolean;
}

interface SystemSettings {
  auto_emission_calculation: boolean;
  csr_evidence_requirement: boolean;
  badge_auto_award: boolean;
}

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`relative h-6 w-11 rounded-full transition-all duration-200 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer ${
      checked ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-slate-200"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200 ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

const Settings: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin" || user?.role === "ESG Manager";
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [sysSettings, setSysSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const requests: Promise<any>[] = [apiClient.get("/api/notifications/settings")];
      if (isAdmin && user?.organization_id) requests.push(apiClient.get("/api/settings/"));
      const results = await Promise.all(requests);
      setNotifSettings(results[0].data);
      if (results[1]) setSysSettings(results[1].data);
    } catch {
      setError("Couldn't load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateNotif = async (key: keyof NotificationSettings) => {
    if (!notifSettings) return;
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    try {
      await apiClient.put("/api/notifications/settings", { [key]: updated[key] });
      setMessage("Notification preferences saved successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setError("Couldn't save notification preferences.");
    }
  };

  const updateSys = async (key: keyof SystemSettings) => {
    if (!sysSettings) return;
    const updated = { ...sysSettings, [key]: !sysSettings[key] };
    setSysSettings(updated);
    try {
      await apiClient.put("/api/settings/", { [key]: updated[key] });
      setMessage("System configurations updated.");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setError("Couldn't save system settings.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="shimmer-skeleton h-10 w-48 rounded-xl" />
        <div className="shimmer-skeleton h-64 rounded-2xl w-full" />
        <div className="shimmer-skeleton h-48 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Title */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 tracking-tight">
          <SettingsIcon className="text-emerald-500" size={24} /> Settings Panel
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Configure notification routing profiles and system automation toggles.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">{error}</div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold shadow-sm">{message}</div>
      )}

      {/* Notification Preferences Card */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden bg-white/70 shadow-soft">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
        <h2 className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
          <Bell size={16} className="text-emerald-500" /> Notification Channels
        </h2>
        
        {notifSettings ? (
          <div className="divide-y divide-slate-100/50">
            {[
              { key: "email_enabled", label: "Email Notifications", desc: "Receive automated compliance audits via work mail" },
              { key: "in_app_enabled", label: "In-App Alerts", desc: "Show prompt alert cards inside workspace navigation" },
              { key: "notify_compliance", label: "Regulatory Cases", desc: "Receive immediate updates on new compliance log status" },
              { key: "notify_approvals", label: "Approval & Signatures", desc: "Get notified when a pending document is ready to sign" },
              { key: "notify_policies", label: "Policy Publications", desc: "Receive updates when a corporate handbook is edited" },
              { key: "notify_badges", label: "Gamified Badges", desc: "Notify immediately when an achievement badge is unlocked" },
            ].map((item, idx) => (
              <div key={item.key} className={`flex items-center justify-between py-4 ${idx === 0 ? "pt-0" : ""} ${idx === 5 ? "pb-0" : ""}`}>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{item.desc}</p>
                </div>
                <Toggle
                  checked={(notifSettings as any)[item.key]}
                  onChange={() => updateNotif(item.key as keyof NotificationSettings)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Settings currently unavailable.</p>
        )}
      </div>

      {/* System Settings Card */}
      {isAdmin && (
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden bg-white/70 shadow-soft">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
          <h2 className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <SlidersHorizontal size={16} className="text-emerald-500" /> Executive Configurations
          </h2>
          
          {sysSettings ? (
            <div className="divide-y divide-slate-100/50">
              {[
                { key: "auto_emission_calculation", label: "Auto Emission Calculations", desc: "Automatically compile carbon metrics upon raw logging" },
                { key: "csr_evidence_requirement", label: "CSR File Auditing", desc: "Mandate attachment uploads for all wellbeing initiatives" },
                { key: "badge_auto_award", label: "Automated Gamification", desc: "Auto-grant catalog badges when rank levels trigger" },
              ].map((item, idx) => (
                <div key={item.key} className={`flex items-center justify-between py-4 ${idx === 0 ? "pt-0" : ""} ${idx === 2 ? "pb-0" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={(sysSettings as any)[item.key]}
                    onChange={() => updateSys(item.key as keyof SystemSettings)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 text-center">
              <p className="text-sm text-slate-400 font-semibold flex items-center justify-center gap-1">
                <Sparkles size={14} className="text-amber-500 animate-pulse" /> Join an organization to configure system settings.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
