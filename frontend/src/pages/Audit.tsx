import { useEffect, useState } from "react";
import { request } from "../api";
export default function Audit() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    request("/api/admin/audit-logs").then(setRows);
  }, []);
  return (
    <section>
      <h1>Audit Logs</h1>
      <div className="table">
        <div className="tr head">
          <span>Time</span>
          <span>Action</span>
          <span>Entity</span>
          <span>ID</span>
        </div>
        {rows.map((x) => (
          <div className="tr">
            <span>{new Date(x.created_at).toLocaleString()}</span>
            <span>{x.action}</span>
            <span>{x.entity_type}</span>
            <span>{x.entity_id}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
