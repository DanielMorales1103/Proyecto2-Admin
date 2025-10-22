import { getStore } from "../../..//lib/store";
import { gitlabFetch, projectRef } from "../../..//lib/gitlab";

export const dynamic = "force-dynamic";

function priorityToGitLabLabel(p?: string) {
  const v = (p ?? "Medium").toLowerCase();
  if (v === "low") return "priority::low";
  if (v === "high") return "priority::high";
  return "priority::medium"; // default
}


function priorityFromLabels(labels: string[]): "Low" | "Medium" | "High" {
  const set = new Set(labels.map(l => l.toLowerCase()));
  if (set.has("priority::high")) return "High";
  if (set.has("priority::low")) return "Low";
  if (set.has("priority::medium")) return "Medium";
  return "Medium";
}

function parseField(text: string, field: string): string | undefined {
  // Busca líneas del tipo **Servicio:** valor
  const re = new RegExp(`\\*\\*${field}\\*\\*:\\s*(.+)`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : undefined;
}

function stripMetaFromDescription(text: string): string {
  // remueve las primeras líneas de metadatos (**Servicio:** etc.)
  return text
    .split("\n")
    .filter(line => !/^\*\*(Servicio|Tipo|Parqueo afectado|Contacto)\*\*:/i.test(line))
    .join("\n")
    .trim();
}

function mapGitLabIssue(issue: any) {
  const labels: string[] = issue.labels || [];
  const prioridad = priorityFromLabels(labels);

  const servicio = (parseField(issue.description ?? "", "Servicio") || "").toLowerCase() || "reservas";
  const tipo = parseField(issue.description ?? "", "Tipo") || "Incidente";
  const parqueo = parseField(issue.description ?? "", "Parqueo afectado") || "";
  const contacto = parseField(issue.description ?? "", "Contacto") || "";
  const descripcion = stripMetaFromDescription(issue.description ?? "");

  // etiquetas técnicas = todas las labels excepto las de prioridad
  const etiquetas = labels.filter((l: string) => !/^priority::/i.test(l));

  // estado: opened/closed -> Open/Closed
  const estado = issue.state === "closed" ? "Closed" : "Open";

  return {
    id: `g-${issue.iid}`,                 // id único para el tablero
    servicio,                             // ej. "reservas"
    tipo,                                 // "Incidente" | "Solicitud" | "Problema"
    etiquetas,                            // labels técnicas
    prioridad,                            // Low/Medium/High
    titulo: issue.title || "(sin título)",
    descripcion,
    parqueo,
    contacto,
    estado,
    createdAt: new Date(issue.created_at).getTime(),
    comentarios: [],                      // puedes llenarlo si luego haces GET /notes
    gitlab: {
      synced: true,
      projectId: projectRef(),
      issueIid: issue.iid,
      issueUrl: issue.web_url,
      lastSyncError: null,
    },
  };
}

export async function GET() {
  try {
    const store = getStore();
    const localItems = [...store.items];

    // Trae issues abiertos y cerrados (dos llamadas simples)
    const [opened, closed] = await Promise.all([
      gitlabFetch<any[]>(`/projects/${projectRef()}/issues`, {
        searchParams: { state: "opened", per_page: 50, order_by: "created_at", sort: "desc" },
      }).then(r => r.data).catch(() => []),
      gitlabFetch<any[]>(`/projects/${projectRef()}/issues`, {
        searchParams: { state: "closed", per_page: 50, order_by: "created_at", sort: "desc" },
      }).then(r => r.data).catch(() => []),
    ]);

    const gitlabItems = [...opened, ...closed].map(mapGitLabIssue);

    // Combina: primero locales no-sincronizados, luego GitLab
    // (si quieres deduplicar por título/otra lógica, puedes hacerlo aquí)
    const items = [...localItems, ...gitlabItems].sort((a: any, b: any) => b.createdAt - a.createdAt);

    return Response.json({ tickets: items }, { status: 200 });
  } catch (e: any) {
    return Response.json({ tickets: [], error: String(e?.message ?? e) }, { status: 500 });
  }
}
// CREAR (local + write-through a GitLab)
export async function POST(req: Request) {
  const store = getStore();
  const body = await req.json();
  const now = Date.now();

  const ticket: any = {
    id: String(store.seq++),
    servicio: body.servicio,
    tipo: body.tipo,
    etiquetas: Array.isArray(body.etiquetas) ? body.etiquetas : [],
    prioridad: body.prioridad || "Medium",
    titulo: (body.titulo || "").slice(0, 120),
    descripcion: (body.descripcion || "").slice(0, 5000),
    parqueo: (body.parqueo || "").slice(0, 120),
    contacto: (body.contacto || "").slice(0, 120),
    estado: "Open",
    createdAt: now,
    comentarios: [],
    gitlab: {
      synced: false,
      projectId: process.env.GITLAB_PROJECT_ID ?? null,
      issueIid: null as number | null,
      issueUrl: null as string | null,
      lastSyncError: null as string | null,
    },
  };

  if (!ticket.servicio || !ticket.tipo) {
    return Response.json({ error: "servicio y tipo son obligatorios" }, { status: 400 });
  }
  if (!ticket.titulo && !ticket.descripcion) {
    return Response.json({ error: "título o descripción requerido" }, { status: 400 });
  }

  // 1) Guarda local
  store.items.push(ticket);

  // 2) Intenta crear en GitLab (no detiene la respuesta local si falla)
  try {
    // etiqueta de prioridad según selección
    const priorityLabel = priorityToGitLabLabel(ticket.prioridad);

    // combina etiquetas técnicas + prioridad y dedup
    const labelsSet = new Set<string>([
      ...ticket.etiquetas,   // vienen del front (nombres de label)
      priorityLabel,         // priority::low|medium|high
    ]);
    const labels = Array.from(labelsSet).join(",");

    const description =
      `**Servicio:** ${ticket.servicio}\n` +
      `**Tipo:** ${ticket.tipo}\n` +
      `**Parqueo afectado:** ${ticket.parqueo || "-"}\n` +
      `**Contacto:** ${ticket.contacto || "-"}\n\n` +
      (ticket.descripcion || "");

    const { data } = await gitlabFetch<any>(
      `/projects/${projectRef()}/issues`,
      {
        method: "POST",
        body: {
          title: ticket.titulo || `(sin título)`,
          description,
          labels,
          confidential: false,
        },
      }
    );

    ticket.gitlab.synced = true;
    ticket.gitlab.issueIid = data.iid ?? null;
    ticket.gitlab.issueUrl = data.web_url ?? null;
    ticket.gitlab.lastSyncError = null;
  } catch (e: any) {
    ticket.gitlab.synced = false;
    ticket.gitlab.lastSyncError = String(e?.message ?? e);
  }

  return Response.json({ ok: true, id: ticket.id, ticket }, { status: 201 });
}
