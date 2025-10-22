import { getStore } from '../../../lib/store.js';

let store = getStore();

export async function GET() {
  const items = store.items.sort((a, b) => b.createdAt - a.createdAt);
  return Response.json({ tickets: items });
}

export async function POST(req) {
  const body = await req.json();
  const now = Date.now();

  const ticket = {
    id: String(store.seq++),
    servicio: body.servicio,
    tipo: body.tipo,
    etiquetas: Array.isArray(body.etiquetas) ? body.etiquetas : [],
    prioridad: body.prioridad || "P3",
    titulo: (body.titulo || "").slice(0, 120),
    descripcion: (body.descripcion || "").slice(0, 5000),
    parqueo: (body.parqueo || "").slice(0, 120),
    contacto: (body.contacto || "").slice(0, 120),
    estado: "Open",
    createdAt: now,
    comentarios: [],
  };

  if (!ticket.servicio || !ticket.tipo) {
    return new Response(JSON.stringify({ error: "servicio y tipo son obligatorios" }), { status: 400 });
  }
  if (!ticket.titulo && !ticket.descripcion) {
    return new Response(JSON.stringify({ error: "título o descripción requerido" }), { status: 400 });
  }

  store.items.push(ticket);
  return new Response(JSON.stringify({ ok: true, id: ticket.id }), { status: 201 });
}
