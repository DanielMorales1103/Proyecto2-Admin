// src/app/api/dashboard/route.ts
import { getStore } from "../../../lib/store";
import { gitlabFetch, projectRef } from "../../../lib/gitlab";

export const dynamic = "force-dynamic";

/* ===== Helpers ===== */

function priorityFromLabels(labels: string[]): "Low" | "Medium" | "High" {
  const set = new Set(labels.map(l => l.toLowerCase()));
  if (set.has("priority::high")) return "High";
  if (set.has("priority::low")) return "Low";
  if (set.has("priority::medium")) return "Medium";
  return "Medium";
}

function parseField(text: string, field: string): string | undefined {
  const re = new RegExp(`\\*\\*${field}\\*\\*:\\s*(.+)`, "i");
  const m = text?.match?.(re);
  return m ? m[1].trim() : undefined;
}

function stripMetaFromDescription(text: string): string {
  if (!text) return "";
  return text
    .split("\n")
    .filter(line => !/^\*\*(Servicio|Tipo|Parqueo afectado|Contacto)\*\*:/i.test(line))
    .join("\n")
    .trim();
}

function mapGitLabIssue(issue: any) {
  const labels: string[] = issue.labels || [];
  const prioridad = priorityFromLabels(labels);

  const servicio =
    (parseField(issue.description ?? "", "Servicio") || "").toLowerCase() || "reservas";
  const tipo = parseField(issue.description ?? "", "Tipo") || "Incidente";
  const parqueo = parseField(issue.description ?? "", "Parqueo afectado") || "";
  const contacto = parseField(issue.description ?? "", "Contacto") || "";
  const descripcion = stripMetaFromDescription(issue.description ?? "");

  const etiquetas = labels.filter(l => !/^priority::/i.test(l));
  const estado = issue.state === "closed" ? "Closed" : "Open"; // si usas status:: puedes refinar

  return {
    id: `g-${issue.iid}`,
    servicio,
    tipo,
    etiquetas,
    prioridad,                // Low | Medium | High
    titulo: issue.title || "(sin título)",
    descripcion,
    parqueo,
    contacto,
    estado,                   // Open | Closed (en GitLab)
    createdAt: new Date(issue.created_at).getTime(),
    gitlab: {
      synced: true,
      projectId: projectRef(),
      issueIid: issue.iid,
      issueUrl: issue.web_url,
      lastSyncError: null,
    },
  };
}

/* ===== GET: computa estadísticas con LOCAL + GITLAB ===== */

export async function GET() {
  try {
    const store = getStore();
    const localTickets = [...store.items];

    const [opened, closed] = await Promise.all([
      gitlabFetch<any[]>(`/projects/${projectRef()}/issues`, {
        searchParams: { state: "opened", per_page: 100, order_by: "created_at", sort: "desc" },
      })
        .then(r => r.data)
        .catch(() => []),
      gitlabFetch<any[]>(`/projects/${projectRef()}/issues`, {
        searchParams: { state: "closed", per_page: 100, order_by: "created_at", sort: "desc" },
      })
        .then(r => r.data)
        .catch(() => []),
    ]);

    const gitlabTickets = [...opened, ...closed].map(mapGitLabIssue);

    // Normaliza prioridades locales a Low/Medium/High si aún usabas P1..P4
    const normalizeLocalPriority = (p: any): "Low" | "Medium" | "High" => {
      const v = String(p || "Medium").toUpperCase();
      if (v === "P1" || v === "HIGH") return "High";
      if (v === "P4" || v === "LOW") return "Low";
      if (v === "P2") return "High";     // opcional: P2 ~ High
      return "Medium";                   // P3 u otros → Medium
    };

    const tickets = [
      ...localTickets.map(t => ({
        ...t,
        prioridad: normalizeLocalPriority(t.prioridad),
      })),
      ...gitlabTickets,
    ];

    // Acumuladores
    const byService: Record<string, number> = {};
    const byState: Record<"Open" | "In Progress" | "Resolved" | "Closed", number> = {
      Open: 0,
      "In Progress": 0,
      Resolved: 0,
      Closed: 0,
    };
    const byPriority: Record<"Low" | "Medium" | "High", number> = {
      Low: 0,
      Medium: 0,
      High: 0,
    };
    const byType: Record<"Incidente" | "Solicitud" | "Problema", number> = {
      Incidente: 0,
      Solicitud: 0,
      Problema: 0,
    };

    for (const t of tickets) {
      // Servicio
      byService[t.servicio] = (byService[t.servicio] || 0) + 1;

      // Estado (si en local usas "In Progress"/"Resolved", se cuentan; los de GitLab suman en Open/Closed)
      if (t.estado in byState) byState[t.estado as keyof typeof byState]++;
      else byState.Open++;

      // Prioridad
      const p = (t.prioridad ?? "Medium") as "Low" | "Medium" | "High";
      byPriority[p] = (byPriority[p] || 0) + 1;

      // Tipo
      if (t.tipo in byType) byType[t.tipo as keyof typeof byType]++;
      else byType.Incidente++;
    }

    const stats = {
      total: tickets.length,
      open: byState.Open,
      inProgress: byState["In Progress"],
      resolved: byState.Resolved,
      closed: byState.Closed,
      byService,
      byState,
      byPriority,
      byType,
    };

    return Response.json({ stats }, { status: 200 });
  } catch (e: any) {
    return Response.json({ stats: null, error: String(e?.message ?? e) }, { status: 500 });
  }
}
