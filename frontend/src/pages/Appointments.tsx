import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Stethoscope,
  UserRound,
  XCircle,
} from "lucide-react";

import { request } from "../api";
import { useAuth } from "../auth";

type Appointment = {
  id: number;
  start_at: string;
  status: string;
  doctor_name?: string;
  patient_name?: string;
  department?: string;
  reason?: string;
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");
      setAppointments(await request<Appointment[]>("/api/appointments"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAppointments(); }, []);

  async function handleAction(appointmentId: number, action: "cancel" | "confirm") {
    try {
      setError("");
      const rolePrefix = user?.role === "doctor" ? "doctor/" : "";
      await request(`/api/${rolePrefix}appointments/${appointmentId}/${action}`, { method: "POST" });
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${action} appointment.`);
    }
  }

  const counts = useMemo(() => ({
    total: appointments.length,
    upcoming: appointments.filter((item) => ["booked", "confirmed"].includes(item.status)).length,
    completed: appointments.filter((item) => item.status === "completed").length,
    cancelled: appointments.filter((item) => item.status === "cancelled").length,
  }), [appointments]);

  return (
    <section className="page-stack appointments-page">
      <div className="page-heading premium-page-heading">
        <div>
          <span className="eyebrow"><CalendarClock size={15} /> Care schedule</span>
          <h1>Appointments</h1>
          <p>{user?.role === "doctor" ? "Review patient visits, confirm bookings and begin consultations." : user?.role === "admin" ? "Track appointments across the hospital." : "Manage upcoming visits and review your appointment history."}</p>
        </div>
        <button className="secondary" type="button" onClick={() => void loadAppointments()}><RefreshCw size={16} /> Refresh</button>
      </div>

      <div className="appointment-summary-grid">
        <div className="summary-tile"><CalendarDays size={18} /><div><span>Total</span><strong>{counts.total}</strong></div></div>
        <div className="summary-tile"><Clock3 size={18} /><div><span>Upcoming</span><strong>{counts.upcoming}</strong></div></div>
        <div className="summary-tile"><CheckCircle2 size={18} /><div><span>Completed</span><strong>{counts.completed}</strong></div></div>
        <div className="summary-tile"><XCircle size={18} /><div><span>Cancelled</span><strong>{counts.cancelled}</strong></div></div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="premium-list-card">
        <div className="list-card-heading">
          <div><strong>Appointment timeline</strong><span>{loading ? "Loading schedule..." : `${appointments.length} appointment${appointments.length === 1 ? "" : "s"}`}</span></div>
        </div>

        {loading ? (
          <div className="page-loading"><span className="loading-ring" /> Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="empty-state-card compact-empty"><CalendarDays size={26} /><h3>No appointments yet</h3><p>Your appointment activity will appear here.</p></div>
        ) : (
          <div className="appointment-cards">
            {appointments.map((appointment) => {
              const canPatientModify = user?.role === "patient" && ["booked", "confirmed"].includes(appointment.status);
              const canDoctorConfirm = user?.role === "doctor" && appointment.status === "booked";
              const canDoctorConsult = user?.role === "doctor" && ["booked", "confirmed"].includes(appointment.status);
              const person = user?.role === "patient" ? appointment.doctor_name : appointment.patient_name;
              const date = new Date(appointment.start_at);

              return (
                <article className="appointment-card" key={appointment.id}>
                  <div className="appointment-date-block"><span>{date.toLocaleDateString(undefined, { month: "short" })}</span><strong>{date.getDate()}</strong><small>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
                  <div className="appointment-main">
                    <div className="appointment-person"><div className="appointment-avatar">{user?.role === "patient" ? <Stethoscope size={18} /> : <UserRound size={18} />}</div><div><strong>{person || "Appointment"}</strong><span>{appointment.department || (user?.role === "patient" ? "Clinical consultation" : "Patient visit")}</span></div></div>
                    {appointment.reason && <p className="appointment-reason">{appointment.reason}</p>}
                  </div>
                  <div className="appointment-meta"><span className={`status ${appointment.status}`}>{appointment.status}</span><span className="appointment-full-date">{date.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</span></div>
                  <div className="appointment-actions">
                    {canPatientModify && <><button type="button" className="secondary small" onClick={() => navigate(`/patient/reschedule/${appointment.id}`)}>Reschedule</button><button type="button" className="small danger" onClick={() => void handleAction(appointment.id, "cancel")}>Cancel</button></>}
                    {canDoctorConfirm && <button type="button" className="secondary small" onClick={() => void handleAction(appointment.id, "confirm")}>Confirm</button>}
                    {canDoctorConsult && <button type="button" className="small" onClick={() => navigate(`/doctor/consult/${appointment.id}`)}>Start consultation</button>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
