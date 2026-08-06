import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { request } from "../api";
export default function Consult() {
  const { id } = useParams();
  const [diagnosis, setDiagnosis] = useState(""),
    [notes, setNotes] = useState(""),
    [medicine, setMedicine] = useState(""),
    [dosage, setDosage] = useState(""),
    [duration, setDuration] = useState("");
  const go = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault();
    await request(`/api/doctor/appointments/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({
        diagnosis,
        clinical_notes: notes,
        prescriptions: medicine ? [{ medicine, dosage, duration }] : [],
      }),
    });
    go("/doctor/appointments");
  }
  return (
    <section>
      <h1>Complete consultation</h1>
      <form className="card form" onSubmit={submit}>
        <label>
          Diagnosis
          <textarea
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </label>
        <label>
          Clinical notes
          <textarea
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <h3>Prescription</h3>
        <label>
          Medicine
          <input
            value={medicine}
            onChange={(e) => setMedicine(e.target.value)}
          />
        </label>
        <label>
          Dosage
          <input value={dosage} onChange={(e) => setDosage(e.target.value)} />
        </label>
        <label>
          Duration
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>
        <button>Complete appointment</button>
      </form>
    </section>
  );
}
