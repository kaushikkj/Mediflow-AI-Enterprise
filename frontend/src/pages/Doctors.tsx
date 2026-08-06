import { useEffect, useState } from "react";
import { request } from "../api";
import { useNavigate } from "react-router-dom";
export default function Doctors() {
  const [docs, setDocs] = useState<any[]>([]);
  const go = useNavigate();
  useEffect(() => {
    request("/api/doctors").then(setDocs);
  }, []);
  return (
    <section>
      <h1>Find a doctor</h1>
      <div className="grid">
        {docs.map((d) => (
          <div className="card" key={d.id}>
            <h3>{d.name}</h3>
            <p>{d.department}</p>
            <p>
              {d.qualification} · {d.experience_years} years
            </p>
            <p>₹{d.consultation_fee}</p>
            <button onClick={() => go(`/patient/book/${d.id}`)}>
              View slots
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
