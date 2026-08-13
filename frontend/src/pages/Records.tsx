import { useEffect, useState } from "react";
import { CalendarDays, ClipboardPlus, FileHeart, Pill, Stethoscope } from "lucide-react";
import { request } from "../api";

type Prescription = { medicine: string; dosage: string; duration: string };
type MedicalRecord = { id: number; created_at: string; doctor_name: string; diagnosis: string; clinical_notes: string; prescriptions: Prescription[] };

export default function Records() {
  const [rows, setRows] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<MedicalRecord[]>("/api/medical-records").then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <section className="page-stack records-page">
      <div className="page-heading premium-page-heading">
        <div><span className="eyebrow"><FileHeart size={15} /> Clinical history</span><h1>Medical records</h1><p>A secure timeline of diagnoses, clinical notes and prescribed medication from your consultations.</p></div>
        <div className="records-count"><ClipboardPlus size={17} /><div><strong>{rows.length}</strong><span>Records available</span></div></div>
      </div>

      {loading ? <div className="page-loading"><span className="loading-ring" /> Loading medical records...</div> : rows.length === 0 ? (
        <div className="empty-state-card"><FileHeart size={30} /><h3>No medical records yet</h3><p>Completed consultations will appear here.</p></div>
      ) : (
        <div className="records-timeline">
          {rows.map((record) => (
            <article className="record-card" key={record.id}>
              <div className="record-marker"><FileHeart size={18} /></div>
              <div className="record-card-body">
                <div className="record-card-header">
                  <div><span className="record-label">Diagnosis</span><h2>{record.diagnosis}</h2></div>
                  <span className="record-date"><CalendarDays size={14} /> {new Date(record.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
                <div className="record-doctor"><Stethoscope size={15} /> <span>Consulted by</span><strong>{record.doctor_name}</strong></div>
                <div className="clinical-note-box"><span>Clinical notes</span><p>{record.clinical_notes || "No additional clinical notes were recorded."}</p></div>
                <div className="record-prescriptions">
                  <div className="record-section-title"><Pill size={16} /><strong>Prescription</strong><span>{record.prescriptions.length} item{record.prescriptions.length === 1 ? "" : "s"}</span></div>
                  {record.prescriptions.length === 0 ? <p className="muted-copy">No medicines prescribed.</p> : (
                    <div className="medicine-grid">
                      {record.prescriptions.map((medicine, index) => (
                        <div className="medicine-card" key={`${medicine.medicine}-${index}`}><div className="medicine-icon"><Pill size={15} /></div><div><strong>{medicine.medicine}</strong><span>{medicine.dosage || "Dosage not specified"}</span><small>{medicine.duration || "Duration not specified"}</small></div></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
