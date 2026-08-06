import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { request } from "../api";
export default function Register() {
  const [form, setForm] = useState({
      full_name: "",
      email: "",
      password: "",
      phone: "",
    }),
    [error, setError] = useState("");
  const go = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      go("/login");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Registration failed");
    }
  }
  return (
    <div className="auth">
      <form className="card login" onSubmit={submit}>
        <h1>Patient registration</h1>
        {error && <div className="error">{error}</div>}
        {Object.entries(form).map(([k, v]) => (
          <label key={k}>
            {k.replace("_", " ")}
            <input
              type={k === "password" ? "password" : "text"}
              value={v}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </label>
        ))}
        <button>Create account</button>
        <Link to="/login">Back to sign in</Link>
      </form>
    </div>
  );
}
