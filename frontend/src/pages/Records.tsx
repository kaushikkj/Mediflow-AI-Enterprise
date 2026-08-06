import { useEffect, useState } from "react";
import { request } from "../api";
export default function Records() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    request("/api/medical-records").then(setRows);
  }, []);
  return (
    <section>
      <h1>Medical Records</h1>
      {rows.map((r) => (
        <div className="card" key={r.id}>
          <h3>{r.diagnosis}</h3>
          <p>
            {new Date(r.created_at).toLocaleDateString()} · {r.doctor_name}
          </p>
          <p>{r.clinical_notes}</p>
          <h4>Prescription</h4>
          {r.prescriptions.map((m: any) => (
            <p key={m.medicine}>
              {m.medicine} — {m.dosage}, {m.duration}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}
