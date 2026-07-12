import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import {
  Leaf, LayoutDashboard, Cloud, Users, ShieldCheck, Trophy,
  Gift, FileBarChart, Sparkles, Bell, Settings as SettingsIcon,
  LogOut, Menu, X,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/environment", label: "Environment", icon: <Cloud size={18} /> },
  { to: "/social", label: "Social", icon: <Users size={18} /> },
  { to: "/governance", label: "Governance", icon: <ShieldCheck size={18} /> },
  { to: "/gamification", label: "Challenges", icon: <Trophy size={18} /> },
  { to: "/rewards", label: "Rewards", icon: <Gift size={18} /> },
  { to: "/reports", label: "Reports", icon: <FileBarChart size={18} /> },
  { to: "/ai-advisor", label: "AI Advisor", icon: <Sparkles size={18} /> },
  { to: "/notifications", label: "Notifications", icon: <Bell size={18} /> },
  { to: "/settings", label: "Settings", icon: <SettingsIcon size={18} /> },
];

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await apiClient.get("/api/notifications/?unread_only=true");
        setUnreadCount(res.data.length);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.full_name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2E7D32] text-white">
          <Leaf size={18} />
        </div>
        <span className="text-lg font-bold text-slate-800">EcoSphere</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#E8F5E9] text-[#1B5E20]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <span className="flex items-center gap-3">
              {item.icon}
              {item.label}
            </span>
            {item.to === "/notifications" && unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user?.full_name}</p>
            <p className="truncate text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-slate-100 bg-white">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-soft">{SidebarContent}</aside>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2E7D32] text-white">
            <Leaf size={16} />
          </div>
          <span className="text-base font-bold text-slate-800">EcoSphere</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-600">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
};

export default MainLayout;
