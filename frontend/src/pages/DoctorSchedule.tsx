import { FormEvent, useCallback, useEffect, useState } from "react";

import { ApiError, request } from "../api";

type Slot = {
  id: number;
  start_at: string;
  end_at: string;
  is_booked: boolean;
};

type SlotForm = {
  date: string;
  start_time: string;
  end_time: string;
};

const initialForm: SlotForm = {
  date: "",
  start_time: "",
  end_time: "",
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export default function DoctorSchedule() {
  const [slots, setSlots] = useState<Slot[]>([]);

  const [form, setForm] = useState<SlotForm>(initialForm);

  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await request<Slot[]>("/api/doctor/slots");

      setSlots(result);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load slots",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  function updateField(field: keyof SlotForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createSlot(event: FormEvent) {
    event.preventDefault();

    setCreating(true);
    setError("");
    setMessage("");

    try {
      const startAt = `${form.date}T${form.start_time}:00`;

      const endAt = `${form.date}T${form.end_time}:00`;

      const created = await request<Slot>("/api/doctor/slots", {
        method: "POST",
        body: JSON.stringify({
          start_at: startAt,
          end_at: endAt,
        }),
      });

      setSlots((current) =>
        [...current, created].sort(
          (left, right) =>
            new Date(left.start_at).getTime() -
            new Date(right.start_at).getTime(),
        ),
      );

      setForm(initialForm);

      setMessage("Slot created successfully.");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Unable to create slot",
      );
    } finally {
      setCreating(false);
    }
  }

  async function deleteSlot(slot: Slot) {
    const confirmed = window.confirm("Delete this appointment slot?");

    if (!confirmed) {
      return;
    }

    setDeletingId(slot.id);
    setError("");
    setMessage("");

    try {
      await request(`/api/doctor/slots/${slot.id}`, {
        method: "DELETE",
      });

      setSlots((current) => current.filter((item) => item.id !== slot.id));

      setMessage("Slot deleted successfully.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to delete slot",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <div className="row">
        <h1>Schedule Management</h1>

        <button
          type="button"
          className="secondary small"
          onClick={() => {
            void loadSlots();
          }}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {message && <div className="card">{message}</div>}

      <form className="card form" onSubmit={createSlot}>
        <h2>Create Appointment Slot</h2>

        <div className="grid">
          <label>
            Date
            <input
              required
              type="date"
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
            />
          </label>

          <label>
            Start time
            <input
              required
              type="time"
              value={form.start_time}
              onChange={(event) =>
                updateField("start_time", event.target.value)
              }
            />
          </label>

          <label>
            End time
            <input
              required
              type="time"
              value={form.end_time}
              onChange={(event) => updateField("end_time", event.target.value)}
            />
          </label>
        </div>

        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create Slot"}
        </button>
      </form>

      {loading ? (
        <div className="card">Loading schedule...</div>
      ) : (
        <div className="table">
          <div className="tr head">
            <span>Start</span>
            <span>End</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {slots.length === 0 ? (
            <div className="card">No appointment slots created.</div>
          ) : (
            slots.map((slot) => (
              <div className="tr" key={slot.id}>
                <span>{formatDateTime(slot.start_at)}</span>

                <span>{formatDateTime(slot.end_at)}</span>

                <span
                  className={`status ${
                    slot.is_booked ? "confirmed" : "completed"
                  }`}
                >
                  {slot.is_booked ? "Booked" : "Available"}
                </span>

                <div className="actions">
                  <button
                    type="button"
                    className="danger small"
                    disabled={slot.is_booked || deletingId === slot.id}
                    onClick={() => {
                      void deleteSlot(slot);
                    }}
                  >
                    {deletingId === slot.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
