import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";

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
      navigate(`/${user.role}`, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const useDemo = (role: "patient" | "doctor" | "admin") => {
    const accounts = {
      patient: ["patient@mediflow.com", "Patient123!"],
      doctor: ["doctor@mediflow.com", "Doctor123!"],
      admin: ["admin@mediflow.com", "Admin123!"],
    } as const;
    setEmail(accounts[role][0]);
    setPassword(accounts[role][1]);
  };

  return (
    <div className="auth auth-premium">
      <section className="auth-showcase">
        <div className="auth-brand">
          <div className="brand-mark brand-mark-light"><HeartPulse size={25} /></div>
          <div>
            <strong>MediFlow</strong>
            <span>One Health Platform</span>
          </div>
        </div>

        <div className="showcase-copy">
          <span className="showcase-badge"><Sparkles size={15} /> Connected care, intelligently delivered</span>
          <h1>A calmer way to run modern healthcare.</h1>
          <p>
            Patients, clinicians and operations teams work from one secure platform —
            with live care workflows and enterprise observability built in.
          </p>
          <div className="showcase-features">
            <div><ShieldCheck size={19} /><span><strong>Secure by design</strong><small>Role-based access and protected health workflows</small></span></div>
            <div><Stethoscope size={19} /><span><strong>Connected clinical care</strong><small>Appointments, records and prescriptions in one flow</small></span></div>
            <div><UsersRound size={19} /><span><strong>One hospital workspace</strong><small>Patient, doctor and administration experiences</small></span></div>
          </div>
        </div>

        <div className="showcase-footer">Central Hospital · Hyderabad · Platform operational</div>
      </section>

      <section className="auth-panel">
        <form className="login login-premium" onSubmit={submit}>
          <div className="login-heading">
            <span className="eyebrow compact">Welcome back</span>
            <h2>Sign in to MediFlow</h2>
            <p>Use your hospital account to continue to your workspace.</p>
          </div>

          {error && <div className="error">{error}</div>}

          <label>
            Email address
            <div className="input-with-icon">
              <UsersRound size={17} />
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-with-icon">
              <LockKeyhole size={17} />
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in securely"}
            {!busy && <ArrowRight size={17} />}
          </button>

          <div className="demo-section">
            <div className="demo-divider"><span>Portfolio demo accounts</span></div>
            <div className="demo-accounts">
              <button type="button" className="demo-account" onClick={() => useDemo("patient")}>
                Patient
              </button>
              <button type="button" className="demo-account" onClick={() => useDemo("doctor")}>
                Doctor
              </button>
              <button type="button" className="demo-account" onClick={() => useDemo("admin")}>
                Admin
              </button>
            </div>
          </div>

          <p className="auth-footnote">
            New patient? <Link to="/register">Create your account</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
