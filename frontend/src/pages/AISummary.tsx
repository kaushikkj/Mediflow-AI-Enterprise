import { useState } from "react";
import { request } from "../api";
export default function AISummary() {
  const [answer, setAnswer] = useState("");
  return (
    <section>
      <h1>AI Health Summary</h1>
      <div className="card">
        <p>This offline assistant summarizes your latest clinical record.</p>
        <button
          onClick={async () =>
            setAnswer((await request("/api/ai/summary")).answer)
          }
        >
          Generate summary
        </button>
        {answer && <div className="answer">{answer}</div>}
      </div>
    </section>
  );
}
