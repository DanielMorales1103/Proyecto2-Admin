import { getStore } from '../../../../../lib/store.js';

export async function POST(req, context) {
  const { id } = await context.params;
  const body = await req.json();

  const store = getStore();

  const idx = store.items.findIndex(t => t.id === String(id));
  if (idx === -1) {
    return new Response(JSON.stringify({ error: "Ticket no encontrado" }), { status: 404 });
  }

  const texto = (body.texto || "").trim();
  const autor = (body.autor || "Anónimo").slice(0, 100);

  if (!texto) {
    return new Response(JSON.stringify({ error: "El comentario no puede estar vacío" }), { status: 400 });
  }

  const comentario = {
    id: Date.now().toString(),
    autor,
    texto: texto.slice(0, 2000),
    createdAt: Date.now(),
  };

  if (!store.items[idx].comentarios) {
    store.items[idx].comentarios = [];
  }

  store.items[idx].comentarios.push(comentario);
  store.items[idx].updatedAt = Date.now();

  return Response.json({ ok: true, comentario });
}
