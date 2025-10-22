import { getStore } from '../../../../lib/store.js';

export async function GET(req, context) {
  const { id } = await context.params;
  const store = getStore();

  const ticket = store.items.find(t => t.id === String(id));
  if (!ticket) {
    return new Response(JSON.stringify({ error: "Ticket no encontrado" }), { status: 404 });
  }

  return Response.json({ ticket });
}

export async function PATCH(req, context) {
  const { id } = await context.params;
  const body = await req.json();

  const store = globalThis.__CITYPARK_STORE__;
  if (!store) {
    return new Response(JSON.stringify({ error: "Store no inicializado" }), { status: 500 });
  }

  const idx = store.items.findIndex(t => t.id === String(id));
  if (idx === -1) {
    return new Response(JSON.stringify({ error: "Ticket no encontrado" }), { status: 404 });
  }

  const ticket = store.items[idx];

  if (body.estado !== undefined) {
    const allowedStates = ["Open", "In Progress", "Resolved", "Closed"];
    if (!allowedStates.includes(body.estado)) {
      return new Response(JSON.stringify({ error: "Estado inválido" }), { status: 400 });
    }
    ticket.estado = body.estado;
  }

  if (body.prioridad !== undefined) {
    const allowedPriorities = ["P1", "P2", "P3", "P4"];
    if (!allowedPriorities.includes(body.prioridad)) {
      return new Response(JSON.stringify({ error: "Prioridad inválida" }), { status: 400 });
    }
    ticket.prioridad = body.prioridad;
  }

  if (body.titulo !== undefined) {
    ticket.titulo = String(body.titulo).slice(0, 120);
  }

  if (body.descripcion !== undefined) {
    ticket.descripcion = String(body.descripcion).slice(0, 5000);
  }

  if (body.servicio !== undefined) {
    ticket.servicio = body.servicio;
  }

  if (body.tipo !== undefined) {
    const allowedTypes = ["Incidente", "Solicitud", "Problema"];
    if (!allowedTypes.includes(body.tipo)) {
      return new Response(JSON.stringify({ error: "Tipo inválido" }), { status: 400 });
    }
    ticket.tipo = body.tipo;
  }

  if (body.parqueo !== undefined) {
    ticket.parqueo = String(body.parqueo).slice(0, 120);
  }

  if (body.contacto !== undefined) {
    ticket.contacto = String(body.contacto).slice(0, 120);
  }

  if (body.etiquetas !== undefined && Array.isArray(body.etiquetas)) {
    ticket.etiquetas = body.etiquetas;
  }

  if (!ticket.titulo && !ticket.descripcion) {
    return new Response(JSON.stringify({ error: "El ticket debe tener al menos título o descripción" }), { status: 400 });
  }

  ticket.updatedAt = Date.now();

  return Response.json({ ok: true, ticket });
}
