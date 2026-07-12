import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Settings as SettingsIcon, Bell, SlidersHorizontal } from "lucide-react";

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
    className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-[#2E7D32]" : "bg-slate-200"}`}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-5" : "translate-x-0.5"
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
      setMessage("Notification preferences saved.");
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
      setMessage("System settings saved.");
    } catch {
      setError("Couldn't save system settings.");
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <SettingsIcon className="text-[#2E7D32]" size={22} /> Settings
        </h1>
        <p className="text-sm text-slate-500">Manage notification preferences and system-wide toggles.</p>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-md border border-[#C8E6C9] bg-[#E8F5E9] px-4 py-3 text-sm text-[#1B5E20]">{message}</div>}

      <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-soft">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Bell size={16} className="text-[#2E7D32]" /> Notification Preferences
        </h2>
        {notifSettings && (
          <div className="space-y-4">
            {[
              { key: "email_enabled", label: "Email notifications", desc: "Receive updates via email" },
              { key: "in_app_enabled", label: "In-app notifications", desc: "Show notifications in the app" },
              { key: "notify_compliance", label: "Compliance alerts", desc: "New compliance issues and risks" },
              { key: "notify_approvals", label: "Approval requests", desc: "Items awaiting your review" },
              { key: "notify_policies", label: "Policy updates", desc: "New or changed policies" },
              { key: "notify_badges", label: "Badges & achievements", desc: "When you earn a new badge" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <Toggle
                  checked={(notifSettings as any)[item.key]}
                  onChange={() => updateNotif(item.key as keyof NotificationSettings)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <SlidersHorizontal size={16} className="text-[#2E7D32]" /> System Settings
          </h2>
          {sysSettings ? (
            <div className="space-y-4">
              {[
                { key: "auto_emission_calculation", label: "Auto emission calculation", desc: "Automatically compute emissions from raw data" },
                { key: "csr_evidence_requirement", label: "CSR evidence requirement", desc: "Require supporting evidence for CSR initiatives" },
                { key: "badge_auto_award", label: "Auto-award badges", desc: "Automatically grant badges when criteria are met" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={(sysSettings as any)[item.key]}
                    onChange={() => updateSys(item.key as keyof SystemSettings)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Join an organization to manage system settings.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
