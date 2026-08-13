import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Bot,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileClock,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorCog,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { useAuth } from "../auth";

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

const navigation: Record<"patient" | "doctor" | "admin", NavItem[]> = {
  patient: [
    { label: "Dashboard", path: "/patient", icon: LayoutDashboard },
    { label: "Find a doctor", path: "/patient/doctors", icon: Stethoscope },
    { label: "Appointments", path: "/patient/appointments", icon: CalendarDays },
    { label: "Medical records", path: "/patient/records", icon: FileText },
    { label: "Documents", path: "/patient/documents", icon: ClipboardList },
    { label: "AI Health Summary", path: "/patient/ai", icon: Bot },
    { label: "My profile", path: "/patient/profile", icon: UserRound },
  ],
  doctor: [
    { label: "Dashboard", path: "/doctor", icon: LayoutDashboard },
    { label: "Appointments", path: "/doctor/appointments", icon: CalendarDays },
    { label: "Availability", path: "/doctor/schedule", icon: FileClock },
  ],
  admin: [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Users & doctors", path: "/admin/users", icon: UsersRound },
    { label: "Appointments", path: "/admin/appointments", icon: CalendarDays },
    { label: "Audit logs", path: "/admin/audit", icon: ShieldCheck },
    { label: "Operations", path: "/admin/operations", icon: MonitorCog },
  ],
};

const roleLabels = {
  patient: "Patient portal",
  doctor: "Clinical workspace",
  admin: "Administration",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel = useMemo(() => {
    if (!user) return "MediFlow";
    const items = navigation[user.role];
    return (
      [...items]
        .sort((a, b) => b.path.length - a.path.length)
        .find((item) =>
          item.path === `/${user.role}`
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path),
        )?.label ?? "MediFlow"
    );
  }, [location.pathname, user]);

  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <HeartPulse size={24} strokeWidth={2.4} />
          </div>
          <div>
            <strong>MediFlow</strong>
            <span>One Health Platform</span>
          </div>
          <button
            className="icon-button sidebar-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="facility-card">
          <div className="facility-icon">
            <Activity size={18} />
          </div>
          <div>
            <span>Connected facility</span>
            <strong>Central Hospital</strong>
          </div>
          <span className="online-dot" title="Platform online" />
        </div>

        <div className="nav-label">{roleLabels[user.role]}</div>

        <nav className="sidebar-nav">
          {navigation[user.role].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === `/${user.role}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={19} strokeWidth={2} />
                <span>{item.label}</span>
                <ChevronRight className="nav-chevron" size={15} />
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar avatar-small">{initials || "MF"}</div>
            <div>
              <strong>{user.full_name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <button className="signout-button" type="button" onClick={signOut}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="app-workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-button"
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="page-context">
              <span>MediFlow / {roleLabels[user.role]}</span>
              <strong>{currentLabel}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="topbar-search">
              <Search size={17} />
              <span>Search workspace</span>
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={19} />
              <span className="notification-dot" />
            </button>
            <div className="topbar-profile">
              <div className="avatar">{initials || "MF"}</div>
              <div>
                <strong>{user.full_name}</strong>
                <span>{user.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
