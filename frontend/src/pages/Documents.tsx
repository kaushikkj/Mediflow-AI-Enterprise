import { FormEvent, useEffect, useState } from "react";
import { API, request, token } from "../api";
export default function Documents() {
  const [rows, setRows] = useState<any[]>([]),
    [file, setFile] = useState<File | null>(null);
  const load = () => request("/api/documents").then(setRows);
  useEffect(() => {
    void load();
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    await request("/api/documents", { method: "POST", body });
    setFile(null);
    load();
  }
  async function download(d: any) {
    const r = await fetch(`${API}/api/documents/${d.id}/download`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    const b = await r.blob();
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url;
    a.download = d.file_name;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section>
      <h1>Documents</h1>
      <form className="card inline" onSubmit={submit}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        <button>Upload</button>
      </form>
      {rows.map((d) => (
        <div className="card row" key={d.id}>
          <span>{d.file_name}</span>
          <button className="small" onClick={() => download(d)}>
            Download
          </button>
        </div>
      ))}
    </section>
  );
}
