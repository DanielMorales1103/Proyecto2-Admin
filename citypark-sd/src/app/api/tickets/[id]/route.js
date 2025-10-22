// PATCH /api/tickets/:id  -> { estado: "Open" | "In Progress" | "Resolved" | "Closed" }
export async function PATCH(req, context) {
  const { id } = await context.params;
  const body = await req.json();

  // reusa el store en memoria creado en /api/tickets/route.js
  const store = globalThis.__CITYPARK_STORE__;
  if (!store) {
    return new Response(JSON.stringify({ error: "Store no inicializado" }), { status: 500 });
  }

  const idx = store.items.findIndex(t => t.id === String(id));
  if (idx === -1) {
    return new Response(JSON.stringify({ error: "Ticket no encontrado" }), { status: 404 });
  }

  const allowed = ["Open", "In Progress", "Resolved", "Closed"];
  if (!allowed.includes(body?.estado)) {
    return new Response(JSON.stringify({ error: "Estado inválido" }), { status: 400 });
  }

  store.items[idx].estado = body.estado;
  store.items[idx].updatedAt = Date.now();

  return Response.json({ ok: true, ticket: store.items[idx] });
}
