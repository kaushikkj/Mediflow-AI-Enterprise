import { FormEvent, useEffect, useState } from "react";
import { request } from "../api";
export default function Profile() {
  const [form, setForm] = useState<any>({
      phone: "",
      blood_group: "",
      date_of_birth: "",
    }),
    [msg, setMsg] = useState("");
  useEffect(() => {
    request("/api/me").then((x: any) =>
      setForm({
        phone: x.phone || "",
        blood_group: x.blood_group || "",
        date_of_birth: x.date_of_birth || "",
      }),
    );
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    await request("/api/patient/profile", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    setMsg("Profile saved");
  }
  return (
    <section>
      <h1>Profile</h1>
      <form className="card form" onSubmit={submit}>
        {Object.entries(form).map(([k, v]) => (
          <label>
            {k.replace("_", " ")}
            <input
              value={String(v)}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </label>
        ))}
        <button>Save</button>
        {msg && <p>{msg}</p>}
      </form>
    </section>
  );
}
