import { useMemo, useState } from "react";

type DashboardKey =
  "hospital" | "backend" | "database" | "infrastructure" | "ai";

type DashboardDefinition = {
  label: string;
  description: string;
  path: string;
  range: string;
};

const dashboards: Record<DashboardKey, DashboardDefinition> = {
  hospital: {
    label: "Hospital Operations",
    description:
      "Business and hospital workflow metrics including users, appointments, records, prescriptions, and login activity.",
    path: "/d/mediflow-hospital-operations/" + "mediflow-hospital-operations",
    range: "now-6h",
  },

  backend: {
    label: "Backend & API",
    description:
      "API request volume, response latency, error rates, endpoint activity, and backend performance.",
    path: "/d/mediflow-backend-api/" + "mediflow-backend-and-api-performance",
    range: "now-1h",
  },

  database: {
    label: "Database & Cache",
    description:
      "PostgreSQL connections, query activity, Redis health, memory usage, and cache performance.",
    path: "/d/mediflow-database-cache/" + "mediflow-database-and-cache",
    range: "now-1h",
  },

  infrastructure: {
    label: "Infrastructure",
    description:
      "Platform availability, service health, exporters, resource usage, and infrastructure-level monitoring.",
    path: "/d/mediflow-infrastructure/" + "mediflow-infrastructure-overview",
    range: "now-1h",
  },

  ai: {
    label: "AI & Documents",
    description:
      "AI summary requests, successful responses, document uploads, records, and prescription analytics.",
    path: "/d/mediflow-ai-documents/" + "mediflow-ai-and-document-analytics",
    range: "now-6h",
  },
};

export default function Operations() {
  const [selected, setSelected] = useState<DashboardKey>("hospital");

  const dashboard = dashboards[selected];

  const dashboardUrl = useMemo(() => {
    const params = new URLSearchParams({
      orgId: "1",
      from: dashboard.range,
      to: "now",
      timezone: "browser",
      refresh: "10s",
      kiosk: "",
    });

    return `http://localhost:3001` + dashboard.path + `?${params.toString()}`;
  }, [dashboard]);

  return (
    <section>
      <h1>Operations Dashboard</h1>

      <div className="card">
        <p>Live operational monitoring powered by Grafana.</p>

        <p>{dashboard.description}</p>

        <div className="operations-tabs">
          {(
            Object.entries(dashboards) as [DashboardKey, DashboardDefinition][]
          ).map(([key, definition]) => (
            <button
              key={key}
              type="button"
              className={
                selected === key ? "operations-tab active" : "operations-tab"
              }
              onClick={() => setSelected(key)}
            >
              {definition.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grafana-frame">
        <iframe
          key={selected}
          title={dashboard.label}
          src={dashboardUrl}
          width="100%"
          height="900"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </section>
  );
}
