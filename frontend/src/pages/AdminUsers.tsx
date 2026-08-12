import { FormEvent, useCallback, useEffect, useState } from "react";

import { ApiError, request } from "../api";

type UserRole = "patient" | "doctor" | "admin";

type AdminUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
};

type Department = {
  id: number;
  name: string;
  description: string | null;
};

type StatusUpdateResponse = {
  message: string;
  user: {
    id: number;
    email: string;
    active: boolean;
  };
};

type CreatedDoctor = {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  department_id: number;
  department: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  active: boolean;
};

type DoctorForm = {
  full_name: string;
  email: string;
  password: string;
  department_id: string;
  qualification: string;
  experience_years: string;
  consultation_fee: string;
};

const emptyDoctorForm: DoctorForm = {
  full_name: "",
  email: "",
  password: "Doctor123!",
  department_id: "",
  qualification: "",
  experience_years: "",
  consultation_fee: "",
};

export default function AdminUsers() {
  const [rows, setRows] = useState<AdminUser[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [doctorForm, setDoctorForm] = useState<DoctorForm>(emptyDoctorForm);

  const [showDoctorForm, setShowDoctorForm] = useState(false);

  const [loading, setLoading] = useState(true);

  const [creatingDoctor, setCreatingDoctor] = useState(false);

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const users = await request<AdminUser[]>("/api/admin/users");

      setRows(users);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load users",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const result = await request<Department[]>("/api/departments");

      setDepartments(result);

      if (result.length > 0) {
        setDoctorForm((current) => ({
          ...current,
          department_id: current.department_id || String(result[0].id),
        }));
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load departments",
      );
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadDepartments();
  }, [loadDepartments, loadUsers]);

  function updateDoctorField(field: keyof DoctorForm, value: string) {
    setDoctorForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createDoctor(event: FormEvent) {
    event.preventDefault();

    setCreatingDoctor(true);
    setError("");
    setMessage("");

    try {
      const created = await request<CreatedDoctor>("/api/admin/doctors", {
        method: "POST",
        body: JSON.stringify({
          full_name: doctorForm.full_name,
          email: doctorForm.email,
          password: doctorForm.password,
          department_id: Number(doctorForm.department_id),
          qualification: doctorForm.qualification,
          experience_years: Number(doctorForm.experience_years),
          consultation_fee: Number(doctorForm.consultation_fee),
        }),
      });

      setRows((current) => [
        ...current,
        {
          id: created.user_id,
          email: created.email,
          full_name: created.full_name,
          role: "doctor",
          active: created.active,
        },
      ]);

      setDoctorForm({
        ...emptyDoctorForm,
        department_id: departments.length > 0 ? String(departments[0].id) : "",
      });

      setShowDoctorForm(false);

      setMessage(`Doctor ${created.full_name} created successfully.`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Unable to create doctor",
      );
    } finally {
      setCreatingDoctor(false);
    }
  }

  async function updateStatus(account: AdminUser) {
    const newStatus = !account.active;

    const action = newStatus ? "enable" : "disable";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${account.full_name}?`,
    );

    if (!confirmed) {
      return;
    }

    setUpdatingId(account.id);

    setError("");
    setMessage("");

    try {
      const result = await request<StatusUpdateResponse>(
        `/api/admin/users/${account.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            active: newStatus,
          }),
        },
      );

      setRows((current) =>
        current.map((user) =>
          user.id === account.id
            ? {
                ...user,
                active: result.user.active,
              }
            : user,
        ),
      );

      setMessage(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update user",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section>
      <div className="row">
        <h1>User Management</h1>

        <div className="actions">
          <button
            type="button"
            onClick={() => setShowDoctorForm((current) => !current)}
          >
            {showDoctorForm ? "Close Form" : "Create Doctor"}
          </button>

          <button
            type="button"
            className="secondary small"
            onClick={() => {
              void loadUsers();
            }}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {message && <div className="card">{message}</div>}

      {showDoctorForm && (
        <form className="card form" onSubmit={createDoctor}>
          <h2>Create Doctor</h2>

          <div className="grid">
            <label>
              Full name
              <input
                required
                value={doctorForm.full_name}
                onChange={(event) =>
                  updateDoctorField("full_name", event.target.value)
                }
              />
            </label>

            <label>
              Email
              <input
                required
                type="email"
                value={doctorForm.email}
                onChange={(event) =>
                  updateDoctorField("email", event.target.value)
                }
              />
            </label>

            <label>
              Temporary password
              <input
                required
                type="password"
                minLength={8}
                value={doctorForm.password}
                onChange={(event) =>
                  updateDoctorField("password", event.target.value)
                }
              />
            </label>

            <label>
              Department
              <select
                required
                value={doctorForm.department_id}
                onChange={(event) =>
                  updateDoctorField("department_id", event.target.value)
                }
              >
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Qualification
              <input
                required
                placeholder="MBBS, MD"
                value={doctorForm.qualification}
                onChange={(event) =>
                  updateDoctorField("qualification", event.target.value)
                }
              />
            </label>

            <label>
              Experience years
              <input
                required
                type="number"
                min="0"
                max="60"
                value={doctorForm.experience_years}
                onChange={(event) =>
                  updateDoctorField("experience_years", event.target.value)
                }
              />
            </label>

            <label>
              Consultation fee
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={doctorForm.consultation_fee}
                onChange={(event) =>
                  updateDoctorField("consultation_fee", event.target.value)
                }
              />
            </label>
          </div>

          <div className="actions">
            <button type="submit" disabled={creatingDoctor}>
              {creatingDoctor ? "Creating..." : "Create Doctor"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => setShowDoctorForm(false)}
              disabled={creatingDoctor}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card">Loading users...</div>
      ) : (
        <div className="table">
          <div className="tr head">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status / Actions</span>
          </div>

          {rows.map((user) => {
            const updating = updatingId === user.id;

            return (
              <div className="tr" key={user.id}>
                <span>{user.full_name}</span>

                <span>{user.email}</span>

                <span className="status">{user.role}</span>

                <div className="actions">
                  <span
                    className={`status ${
                      user.active ? "completed" : "cancelled"
                    }`}
                  >
                    {user.active ? "Active" : "Disabled"}
                  </span>

                  <button
                    type="button"
                    className={user.active ? "danger small" : "secondary small"}
                    disabled={updating}
                    onClick={() => {
                      void updateStatus(user);
                    }}
                  >
                    {updating
                      ? "Updating..."
                      : user.active
                        ? "Disable"
                        : "Enable"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


