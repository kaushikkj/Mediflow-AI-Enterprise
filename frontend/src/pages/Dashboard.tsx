import { useEffect, useState } from "react";
import { request } from "../api";
import { useAuth } from "../auth";
export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>({});
  useEffect(() => {
    if (user?.role === "admin") request("/api/admin/dashboard").then(setData);
    else
      request("/api/appointments").then((a: any[]) =>
        setData({
          appointments: a.length,
          upcoming: a.filter((x) => ["booked", "confirmed"].includes(x.status))
            .length,
          completed: a.filter((x) => x.status === "completed").length,
        }),
      );
  }, []);
  return (
    <section>
      <h1>{user?.role === "admin" ? "Hospital Overview" : "Dashboard"}</h1>
      <div className="stats">
        {Object.entries(data).map(([k, v]) => (
          <div className="stat" key={k}>
            <span>{k.replace("_", " ")}</span>
            <strong>{String(v)}</strong>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Central Hospital</h3>
        <p>All visible workflows are connected to PostgreSQL-backed APIs.</p>
      </div>
    </section>
  );
}
