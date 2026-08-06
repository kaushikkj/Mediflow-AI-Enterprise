import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { request } from "../api";
export default function Book() {
  const { doctorId } = useParams();
  const [slots, setSlots] = useState<any[]>([]),
    [slot, setSlot] = useState(""),
    [reason, setReason] = useState("Routine consultation"),
    [error, setError] = useState("");
  const go = useNavigate();
  useEffect(() => {
    request(`/api/doctors/${doctorId}/slots`).then(setSlots);
  }, [doctorId]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await request("/api/appointments", {
        method: "POST",
        body: JSON.stringify({ slot_id: Number(slot), reason }),
      });
      go("/patient/appointments");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Booking failed");
    }
  }
  return (
    <section>
      <h1>Book appointment</h1>
      <form className="card form" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <label>
          Available slot
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            required
          >
            <option value="">Choose a slot</option>
            {slots.map((s) => (
              <option value={s.id} key={s.id}>
                {new Date(s.start_at).toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reason
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button>Confirm booking</button>
      </form>
    </section>
  );
}
