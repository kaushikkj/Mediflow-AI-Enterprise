import { FormEvent, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";

export default function Login() {
  const [email, setEmail] = useState("patient@mediflow.com");

  const [password, setPassword] = useState("Patient123!");

  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      const user = await login(email, password);

      navigate(`/${user.role}`, {
        replace: true,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <form className="card login" onSubmit={submit}>
        <div className="logo">MF</div>

        <h1>Welcome to MediFlow One</h1>

        <p>Single-hospital digital care platform</p>

        {error && <div className="error">{error}</div>}

        <label>
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>

        <div className="account-links">
          <button
            type="button"
            className="chip"
            onClick={() => {
              setEmail("patient@mediflow.com");
              setPassword("Patient123!");
            }}
          >
            Patient Portal
          </button>

          <button
            type="button"
            className="chip"
            onClick={() => {
              setEmail("doctor@mediflow.com");
              setPassword("Doctor123!");
            }}
          >
            Doctor Portal
          </button>

          <button
            type="button"
            className="chip"
            onClick={() => {
              setEmail("admin@mediflow.com");
              setPassword("Admin123!");
            }}
          >
            Admin Portal
          </button>
        </div>

        <Link to="/register">Create patient account</Link>
      </form>
    </div>
  );
}
