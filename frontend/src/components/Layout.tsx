import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
const nav = {
  patient: [
    ["Dashboard", "/patient"],
    ["Doctors", "/patient/doctors"],
    ["Appointments", "/patient/appointments"],
    ["Medical Records", "/patient/records"],
    ["Documents", "/patient/documents"],
    ["AI Summary", "/patient/ai"],
    ["Profile", "/patient/profile"],
  ],
  doctor: [
    ["Dashboard", "/doctor"],
    ["Appointments", "/doctor/appointments"],
    ["Schedule", "/doctor/schedule"],
  ],
  admin: [
    ["Dashboard", "/admin"],
    ["Users", "/admin/users"],
    ["Appointments", "/admin/appointments"],
    ["Audit Logs", "/admin/audit"],
    ["Operations", "/admin/operations"],
  ],
};
export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const go = useNavigate();
  if (!user) return null;
  return (
    <div className="app">
      <aside>
        <div className="brand">MediFlow One</div>
        <div className="hospital">Central Hospital</div>
        <nav>
          {nav[user.role as keyof typeof nav].map(([n, p]) => (
            <NavLink key={p} to={p} end>
              {n}
            </NavLink>
          ))}
        </nav>
        <button
          className="secondary"
          onClick={() => {
            logout();
            go("/login");
          }}
        >
          Sign out
        </button>
      </aside>
      <main>
        <header>
          <div>
            <h2>{user.full_name}</h2>
            <span>{user.role}</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
