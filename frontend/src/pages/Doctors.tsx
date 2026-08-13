import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeIndianRupee,
  CalendarPlus2,
  GraduationCap,
  Search,
  SlidersHorizontal,
  Stethoscope,
} from "lucide-react";

import { request } from "../api";

export default function Doctors() {
  const [docs, setDocs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const navigate = useNavigate();

  useEffect(() => {
    request("/api/doctors").then(setDocs);
  }, []);

  const departments = useMemo(
    () => ["All departments", ...Array.from(new Set(docs.map((doc) => doc.department)))],
    [docs],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return docs.filter((doc) => {
      const matchesDepartment =
        department === "All departments" || doc.department === department;
      const matchesQuery =
        !normalized ||
        doc.name.toLowerCase().includes(normalized) ||
        doc.department.toLowerCase().includes(normalized) ||
        doc.qualification.toLowerCase().includes(normalized);
      return matchesDepartment && matchesQuery;
    });
  }, [department, docs, query]);

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow"><Stethoscope size={15} /> Care network</span>
          <h1>Find the right doctor</h1>
          <p>Browse trusted specialists and book from their available appointment slots.</p>
        </div>
        <div className="count-pill">{docs.length} clinicians</div>
      </div>

      <div className="doctor-toolbar card flat-card">
        <div className="search-field">
          <Search size={18} />
          <input
            value={query}
            placeholder="Search doctor, speciality or qualification"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="select-wrap">
          <SlidersHorizontal size={17} />
          <select value={department} onChange={(event) => setDepartment(event.target.value)}>
            {departments.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="doctor-grid">
        {filtered.map((doctor) => {
          const initials = doctor.name
            .replace(/^Dr\.?\s*/i, "")
            .split(" ")
            .slice(0, 2)
            .map((part: string) => part[0]?.toUpperCase())
            .join("");

          return (
            <article className="doctor-card" key={doctor.id}>
              <div className="doctor-card-top">
                <div className="doctor-avatar">{initials}</div>
                <span className="availability-pill"><span /> Available</span>
              </div>
              <div className="doctor-identity">
                <h3>{doctor.name}</h3>
                <p>{doctor.department}</p>
              </div>
              <div className="doctor-details">
                <div>
                  <GraduationCap size={17} />
                  <span>{doctor.qualification}</span>
                </div>
                <div>
                  <Stethoscope size={17} />
                  <span>{doctor.experience_years} years experience</span>
                </div>
                <div>
                  <BadgeIndianRupee size={17} />
                  <span>₹{doctor.consultation_fee} consultation</span>
                </div>
              </div>
              <button
                className="button-wide"
                type="button"
                onClick={() => navigate(`/patient/book/${doctor.id}`)}
              >
                <CalendarPlus2 size={17} />
                View available slots
              </button>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state-card">
          <Search size={30} />
          <h3>No doctors found</h3>
          <p>Try a different speciality or search term.</p>
        </div>
      )}
    </section>
  );
}
