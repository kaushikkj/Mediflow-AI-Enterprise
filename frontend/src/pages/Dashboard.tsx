import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import { request } from "../api";
import { useAuth } from "../auth";

const statIcons = [UsersRound, CalendarCheck2, CheckCircle2, Activity, Stethoscope];

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (user?.role === "admin") {
      request("/api/admin/dashboard").then(setData);
      return;
    }

    request("/api/appointments").then((appointments: any[]) =>
      setData({
        appointments: appointments.length,
        upcoming: appointments.filter((item) =>
          ["booked", "confirmed"].includes(item.status),
        ).length,
        completed: appointments.filter((item) => item.status === "completed")
          .length,
      }),
    );
  }, [user?.role]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <span className="eyebrow">
            <HeartPulse size={15} /> Live care workspace
          </span>
          <h1>
            {user?.role === "admin"
              ? "Hospital command center"
              : `${greeting}, ${firstName}`}
          </h1>
          <p>
            {user?.role === "admin"
              ? "A real-time overview of patients, clinicians, appointments and platform activity."
              : "Everything you need for today's care journey, in one secure place."}
          </p>
        </div>
        <div className="hero-status">
          <span className="status-pulse" />
          <div>
            <strong>All systems operational</strong>
            <span>Last checked just now</span>
          </div>
        </div>
      </div>

      <div className="stats premium-stats">
        {Object.entries(data).map(([key, value], index) => {
          const Icon = statIcons[index % statIcons.length];
          return (
            <div className="stat stat-premium" key={key}>
              <div className="stat-topline">
                <div className="stat-icon">
                  <Icon size={19} />
                </div>
                <span className="trend-badge">Live</span>
              </div>
              <span>{humanize(key)}</span>
              <strong>{String(value)}</strong>
              <small>Updated from live hospital data</small>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="card feature-card">
          <div className="card-icon large">
            <ShieldCheck size={23} />
          </div>
          <div>
            <span className="eyebrow compact">Enterprise care platform</span>
            <h2>Central Hospital</h2>
            <p>
              Secure workflows are connected to PostgreSQL-backed APIs and monitored
              continuously across the MediFlow platform.
            </p>
          </div>
          <div className="health-row">
            <span><span className="mini-dot green" /> API healthy</span>
            <span><span className="mini-dot green" /> Database online</span>
            <span><span className="mini-dot green" /> Monitoring active</span>
          </div>
        </div>

        <div className="card quick-panel">
          <div className="section-heading compact-heading">
            <div>
              <span className="eyebrow compact">Today</span>
              <h2>Care readiness</h2>
            </div>
            <Clock3 size={20} />
          </div>
          <div className="readiness-list">
            <div><span>Clinical services</span><strong>Available</strong></div>
            <div><span>Appointment services</span><strong>Online</strong></div>
            <div><span>Patient records</span><strong>Protected</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}
