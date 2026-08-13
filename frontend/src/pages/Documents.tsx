import { FormEvent, useEffect, useRef, useState } from "react";
import { Download, File, FileText, FolderHeart, UploadCloud, X } from "lucide-react";
import { API, request, token } from "../api";

type DocumentRow = { id: number; file_name: string; content_type: string; uploaded_at: string };

export default function Documents() {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = () => request<DocumentRow[]>("/api/documents").then(setRows);
  useEffect(() => { void load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    try {
      setUploading(true);
      setError("");
      const body = new FormData();
      body.append("file", file);
      await request("/api/documents", { method: "POST", body });
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload document.");
    } finally {
      setUploading(false);
    }
  }

  async function download(row: DocumentRow) {
    const response = await fetch(`${API}/api/documents/${row.id}/download`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!response.ok) throw new Error("Unable to download document");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = row.file_name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="page-stack documents-page">
      <div className="page-heading premium-page-heading"><div><span className="eyebrow"><FolderHeart size={15} /> Secure document vault</span><h1>Documents</h1><p>Upload and manage medical files securely from your patient workspace.</p></div><div className="records-count"><FileText size={17} /><div><strong>{rows.length}</strong><span>Stored documents</span></div></div></div>

      {error && <div className="error-message">{error}</div>}

      <form className="upload-panel" onSubmit={submit}>
        <div className="upload-panel-icon"><UploadCloud size={24} /></div>
        <div className="upload-panel-copy"><strong>Upload a medical document</strong><span>PDF, PNG, JPG or text files up to 10 MB</span></div>
        <input ref={fileInput} id="document-upload" className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file ? <div className="selected-file"><File size={16} /><span>{file.name}</span><button type="button" aria-label="Remove selected file" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ""; }}><X size={14} /></button></div> : <label className="secondary upload-select" htmlFor="document-upload">Choose file</label>}
        <button type="submit" disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload document"}</button>
      </form>

      <div className="document-library">
        <div className="list-card-heading"><div><strong>Document library</strong><span>Files are protected and available only to your account.</span></div></div>
        {rows.length === 0 ? <div className="empty-state-card compact-empty"><FolderHeart size={26} /><h3>No documents uploaded</h3><p>Your medical files will appear here.</p></div> : (
          <div className="document-list">
            {rows.map((documentRow) => (
              <div className="document-row" key={documentRow.id}>
                <div className="document-file-icon"><FileText size={19} /></div>
                <div className="document-file-meta"><strong>{documentRow.file_name}</strong><span>{documentRow.content_type || "Document"}{documentRow.uploaded_at ? ` · ${new Date(documentRow.uploaded_at).toLocaleDateString()}` : ""}</span></div>
                <button className="secondary small" type="button" onClick={() => void download(documentRow)}><Download size={15} /> Download</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
