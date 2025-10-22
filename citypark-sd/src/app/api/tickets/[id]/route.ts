// app/api/tickets/[id]/route.ts
import { getStore } from "../../../../lib/store";
import { gitlabFetch, projectRef } from "../../../../lib/gitlab";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const body = await req.json();
  const { estado } = body;

  const t = store.items.find((x: any) => x.id === params.id);
  if (!t) return Response.json({ error: "ticket no encontrado" }, { status: 404 });

  // 1) Actualiza local
  if (estado) t.estado = estado;

  // 2) Intenta reflejar en GitLab (si ya está sincronizado y tiene iid)
  try {
    if (t.gitlab?.synced && t.gitlab?.issueIid) {
      const iid = t.gitlab.issueIid;

      // Mapea estado local → acción/labels en GitLab
      // - Closed → state_event=close
      // - Open → state_event=reopen
      // - In Progress / Resolved → ajusta labels status::...
      let payload: any = {};
      if (estado === "Closed") payload.state_event = "close";
      else if (estado === "Open") payload.state_event = "reopen";

      // Opcional: mantener un label de estado (status::xxx)
      // (si usas “scoped labels” para status)
      const statusLabel =
        estado === "In Progress" ? "status::in_progress" :
        estado === "Resolved" ? "status::done" :
        estado === "Open" ? "status::new" :
        estado === "Closed" ? "status::closed" : null;

      if (statusLabel) {
        // Combina labels existentes + nuevo status (mínimo: deja el status nuevo)
        // Para algo más fino, primero lee el issue, quita status::previo y agrega el nuevo.
        payload.labels = statusLabel;
      }

      await gitlabFetch(`/projects/${projectRef()}/issues/${iid}`, {
        method: "PUT",
        body: payload,
      });
    }
    t.gitlab.lastSyncError = null;
  } catch (e: any) {
    t.gitlab.lastSyncError = String(e?.message ?? e);
  }

  return Response.json({ ok: true, ticket: t }, { status: 200 });
}
