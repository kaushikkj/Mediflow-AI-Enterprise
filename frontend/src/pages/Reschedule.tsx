import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { request } from "../api";
export default function Reschedule() {
  const { id } = useParams();
  const [doctors, setDoctors] = useState<any[]>([]),
    [doctor, setDoctor] = useState(""),
    [slots, setSlots] = useState<any[]>([]),
    [slot, setSlot] = useState("");
  const go = useNavigate();
  useEffect(() => {
    request("/api/doctors").then(setDoctors);
  }, []);
  useEffect(() => {
    if (doctor) request(`/api/doctors/${doctor}/slots`).then(setSlots);
  }, [doctor]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    await request(`/api/appointments/${id}/reschedule`, {
      method: "PUT",
      body: JSON.stringify({ slot_id: Number(slot) }),
    });
    go("/patient/appointments");
  }
  return (
    <section>
      <h1>Reschedule appointment</h1>
      <form className="card form" onSubmit={submit}>
        <label>
          Doctor
          <select
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            required
          >
            <option value="">Choose</option>
            {doctors.map((d) => (
              <option value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
        <label>
          New slot
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            required
          >
            <option value="">Choose</option>
            {slots.map((s) => (
              <option value={s.id}>
                {new Date(s.start_at).toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <button>Save new appointment</button>
      </form>
    </section>
  );
}
