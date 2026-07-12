import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import {
  Leaf, LayoutDashboard, Cloud, Users, ShieldCheck, Trophy,
  Gift, FileBarChart, Sparkles, Bell, Settings as SettingsIcon,
  LogOut, Menu, X, ChevronLeft, ChevronRight,
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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

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

  const activeItem = NAV_ITEMS.find((item) =>
    item.to === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.to)
  );

  const SidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/10">
            <Leaf size={18} className="animate-pulse" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-white bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              EcoSphere
            </span>
          )}
        </div>
        
        {/* Toggle Button for desktop only */}
        {!mobileOpen && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all cursor-pointer"
          >
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.to === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={() => setMobileOpen(false)}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
                isActive
                  ? "bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-l-2 border-emerald-500 text-emerald-400 font-semibold bg-slate-800"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </span>
              {!isCollapsed && item.to === "/notifications" && unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
              {isCollapsed && item.to === "/notifications" && unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4 bg-slate-950/40">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-xs font-bold text-white">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.full_name}</p>
              <p className="truncate text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user?.role}</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            Log out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-r border-slate-100 bg-slate-900 transition-all duration-300 z-30 ${
          isCollapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-55 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 shadow-soft">{SidebarContent}</aside>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 lg:hidden shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md">
            <Leaf size={16} />
          </div>
          <span className="text-base font-bold text-slate-800">EcoSphere</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-600 cursor-pointer">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop Sticky Header */}
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-20 hidden lg:flex items-center justify-between border-b border-slate-100/80 bg-white/80 backdrop-blur-md px-8 py-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="font-medium hover:text-slate-800 transition-colors cursor-pointer" onClick={() => navigate("/")}>
              EcoSphere
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">{activeItem?.label || "Dashboard"}</span>
          </div>

          {/* User profile / Quick Actions */}
          <div className="flex items-center gap-5">
            <NavLink
              to="/notifications"
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </NavLink>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 rounded-full hover:bg-slate-50/80 p-1.5 transition-all text-left cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-500/10">
                  {initials}
                </div>
                <div className="hidden xl:block">
                  <p className="text-xs font-semibold text-slate-800 leading-none">{user?.full_name}</p>
                  <p className="text-[9px] text-slate-500 font-medium leading-tight mt-0.5">{user?.role}</p>
                </div>
              </button>

              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50">
                    <div className="px-3 py-2 border-b border-slate-50">
                      <p className="text-[10px] font-medium text-slate-400">Signed in as</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        navigate("/settings");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <SettingsIcon size={14} />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
