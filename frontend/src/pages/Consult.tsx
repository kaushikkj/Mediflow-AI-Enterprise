import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardPlus,
  FileText,
  Pill,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";

import { request } from "../api";

type Prescription = {
  medicine: string;
  dosage: string;
  duration: string;
};

export default function Consult() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    { medicine: "", dosage: "", duration: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const updatePrescription = (
    index: number,
    field: keyof Prescription,
    value: string,
  ) => {
    setPrescriptions((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addPrescription = () => {
    setPrescriptions((current) => [
      ...current,
      { medicine: "", dosage: "", duration: "" },
    ]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions((current) => {
      if (current.length === 1) {
        return [{ medicine: "", dosage: "", duration: "" }];
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();

    try {
      setSubmitting(true);

      await request(`/api/doctor/appointments/${id}/complete`, {
        method: "POST",
        body: JSON.stringify({
          diagnosis,
          clinical_notes: notes,
          prescriptions: prescriptions.filter(
            (item) => item.medicine.trim().length > 0,
          ),
        }),
      });

      navigate("/doctor/appointments");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-stack consultation-page">
      <div className="consultation-heading">
        <button
          className="consultation-back"
          type="button"
          onClick={() => navigate("/doctor/appointments")}
        >
          <ArrowLeft size={18} />
          Back to appointments
        </button>

        <div className="consultation-title-row">
          <div>
            <span className="eyebrow">
              <Stethoscope size={15} />
              Clinical workspace
            </span>

            <h1>Complete consultation</h1>

            <p>
              Record the diagnosis, clinical observations and prescribed
              medication for this consultation.
            </p>
          </div>

          <div className="consultation-secure">
            <CheckCircle2 size={18} />
            Secure clinical record
          </div>
        </div>
      </div>

      <form className="consultation-form" onSubmit={submit}>
        <div className="consultation-section">
          <div className="consultation-section-heading">
            <div className="consultation-section-icon">
              <ClipboardPlus size={20} />
            </div>

            <div>
              <h2>Clinical assessment</h2>
              <p>Document your findings from the consultation.</p>
            </div>
          </div>

          <div className="consultation-field">
            <div className="field-heading">
              <label htmlFor="diagnosis">
                Diagnosis <span className="required-mark">*</span>
              </label>

              <span>{diagnosis.length}/2000</span>
            </div>

            <textarea
              id="diagnosis"
              required
              maxLength={2000}
              placeholder="Enter the patient's diagnosis and relevant clinical findings..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div className="consultation-field">
            <div className="field-heading">
              <label htmlFor="clinical-notes">
                Clinical notes <span className="field-optional">Optional</span>
              </label>

              <span>{notes.length}/2000</span>
            </div>

            <textarea
              id="clinical-notes"
              maxLength={2000}
              placeholder="Add observations, symptoms, recommendations and follow-up notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="consultation-section">
          <div className="consultation-section-heading">
            <div className="consultation-section-icon">
              <Pill size={20} />
            </div>

            <div>
              <h2>Prescription</h2>
              <p>Add medication prescribed during this consultation.</p>
            </div>
          </div>

          <div className="prescription-list">
            {prescriptions.map((prescription, index) => (
              <div className="prescription-card" key={index}>
                <div className="prescription-number">
                  <Pill size={16} />
                  Medication {index + 1}
                </div>

                <div className="prescription-fields">
                  <div className="consultation-field">
                    <label htmlFor={`medicine-${index}`}>Medicine</label>

                    <input
                      id={`medicine-${index}`}
                      placeholder="e.g. Paracetamol"
                      value={prescription.medicine}
                      onChange={(e) =>
                        updatePrescription(index, "medicine", e.target.value)
                      }
                    />
                  </div>

                  <div className="consultation-field">
                    <label htmlFor={`dosage-${index}`}>Dosage</label>

                    <input
                      id={`dosage-${index}`}
                      placeholder="e.g. 500 mg twice daily"
                      value={prescription.dosage}
                      onChange={(e) =>
                        updatePrescription(index, "dosage", e.target.value)
                      }
                    />
                  </div>

                  <div className="consultation-field">
                    <label htmlFor={`duration-${index}`}>Duration</label>

                    <input
                      id={`duration-${index}`}
                      placeholder="e.g. 5 days"
                      value={prescription.duration}
                      onChange={(e) =>
                        updatePrescription(index, "duration", e.target.value)
                      }
                    />
                  </div>

                  <button
                    className="prescription-remove"
                    type="button"
                    aria-label={`Remove medication ${index + 1}`}
                    onClick={() => removePrescription(index)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="add-medication-button"
            type="button"
            onClick={addPrescription}
          >
            <Plus size={17} />
            Add another medicine
          </button>
        </div>

        <div className="consultation-actions">
          <div className="consultation-note">
            <FileText size={17} />
            Completing the consultation will add this information to the
            patient's medical record.
          </div>

          <div className="consultation-action-buttons">
            <button
              className="secondary"
              type="button"
              onClick={() => navigate("/doctor/appointments")}
            >
              Cancel
            </button>

            <button type="submit" disabled={submitting}>
              <CheckCircle2 size={17} />

              {submitting ? "Completing..." : "Complete consultation"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}