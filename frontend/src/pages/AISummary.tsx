import { useState } from "react";
import { Bot, BrainCircuit, CheckCircle2, FileHeart, Sparkles } from "lucide-react";
import { request } from "../api";

export default function AISummary() {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    try {
      setLoading(true);
      setError("");
      const result = await request<{ answer: string }>("/api/ai/summary");
      setAnswer(result.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate summary.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-stack ai-summary-page">
      <div className="page-heading premium-page-heading"><div><span className="eyebrow"><BrainCircuit size={15} /> AI-assisted care</span><h1>AI Health Summary</h1><p>Turn your latest clinical record into a clear, patient-friendly overview.</p></div><div className="ai-trust-badge"><CheckCircle2 size={18} /><div><strong>Secure processing</strong><span>Uses your latest clinical record</span></div></div></div>

      <div className="ai-summary-layout">
        <div className="ai-summary-card">
          <div className="ai-summary-visual"><div className="ai-orb"><Bot size={30} /></div><span><Sparkles size={13} /> MediFlow AI</span></div>
          <div className="ai-summary-copy"><h2>Understand your latest consultation</h2><p>The assistant summarizes the most recent diagnosis, clinical notes and prescribed medicines into a concise overview.</p><div className="ai-capabilities"><span><FileHeart size={14} /> Clinical record context</span><span><Sparkles size={14} /> Plain-language summary</span></div><button type="button" onClick={() => void generate()} disabled={loading}><Sparkles size={16} /> {loading ? "Generating summary..." : "Generate health summary"}</button></div>
        </div>

        <div className={`ai-result-card ${answer ? "has-answer" : ""}`}>
          <div className="ai-result-heading"><div className="card-icon"><BrainCircuit size={18} /></div><div><strong>Your summary</strong><span>{answer ? "Generated from your latest record" : "Ready when you are"}</span></div></div>
          {error && <div className="error-message">{error}</div>}
          {answer ? <div className="ai-answer"><p>{answer}</p><div className="ai-disclaimer">This summary is informational and does not replace professional medical advice.</div></div> : <div className="ai-empty-result"><Sparkles size={24} /><p>Generate a summary to see a simplified overview of your latest clinical record.</p></div>}
        </div>
      </div>
    </section>
  );
}
