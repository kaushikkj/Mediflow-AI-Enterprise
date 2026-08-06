import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { request } from "../api";
import { useAuth } from "../auth";

type Appointment = {
  id: number;
  start_at: string;
  status: string;
  doctor_name?: string;
  patient_name?: string;
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

      const data = await request("/api/appointments");
      setAppointments(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load appointments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAppointments();
  }, []);

  async function handleAction(
    appointmentId: number,
    action: "cancel" | "confirm",
  ) {
    try {
      setError("");

      const rolePrefix = user?.role === "doctor" ? "doctor/" : "";

      await request(
        `/api/${rolePrefix}appointments/${appointmentId}/${action}`,
        {
          method: "POST",
        },
      );

      await loadAppointments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Unable to ${action} appointment.`,
      );
    }
  }

  if (loading) {
    return (
      <section>
        <h1>Appointments</h1>
        <p>Loading appointments...</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Appointments</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="table">
        <div className="tr head">
          <span>Date</span>

          <span>{user?.role === "patient" ? "Doctor" : "Patient"}</span>

          <span>Status</span>
          <span>Actions</span>
        </div>

        {appointments.length === 0 && (
          <div className="empty-state">No appointments found.</div>
        )}

        {appointments.map((appointment) => {
          const canPatientModify =
            user?.role === "patient" &&
            ["booked", "confirmed"].includes(appointment.status);

          const canDoctorConfirm =
            user?.role === "doctor" && appointment.status === "booked";

          const canDoctorConsult =
            user?.role === "doctor" &&
            ["booked", "confirmed"].includes(appointment.status);

          return (
            <div className="tr" key={appointment.id}>
              <span>{new Date(appointment.start_at).toLocaleString()}</span>

              <span>
                {user?.role === "patient"
                  ? appointment.doctor_name
                  : appointment.patient_name}
              </span>

              <span className={`status ${appointment.status}`}>
                {appointment.status}
              </span>

              <span className="actions">
                {canPatientModify && (
                  <>
                    <button
                      type="button"
                      className="small"
                      onClick={() =>
                        navigate(`/patient/reschedule/${appointment.id}`)
                      }
                    >
                      Reschedule
                    </button>

                    <button
                      type="button"
                      className="small danger"
                      onClick={() =>
                        void handleAction(appointment.id, "cancel")
                      }
                    >
                      Cancel
                    </button>
                  </>
                )}

                {canDoctorConfirm && (
                  <button
                    type="button"
                    className="small"
                    onClick={() => void handleAction(appointment.id, "confirm")}
                  >
                    Confirm
                  </button>
                )}

                {canDoctorConsult && (
                  <button
                    type="button"
                    className="small"
                    onClick={() =>
                      navigate(`/doctor/consult/${appointment.id}`)
                    }
                  >
                    Consult
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
