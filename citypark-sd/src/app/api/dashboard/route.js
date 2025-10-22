import { getStore } from '../../../lib/store.js';

export async function GET() {
  const store = getStore();
  const tickets = store.items;

  const byService = {};
  tickets.forEach(t => {
    byService[t.servicio] = (byService[t.servicio] || 0) + 1;
  });

  const byState = {
    "Open": 0,
    "In Progress": 0,
    "Resolved": 0,
    "Closed": 0,
  };
  tickets.forEach(t => {
    if (byState[t.estado] !== undefined) {
      byState[t.estado]++;
    }
  });

  const byPriority = {
    "P1": 0,
    "P2": 0,
    "P3": 0,
    "P4": 0,
  };
  tickets.forEach(t => {
    if (byPriority[t.prioridad] !== undefined) {
      byPriority[t.prioridad]++;
    }
  });

  const byType = {
    "Incidente": 0,
    "Solicitud": 0,
    "Problema": 0,
  };
  tickets.forEach(t => {
    if (byType[t.tipo] !== undefined) {
      byType[t.tipo]++;
    }
  });
  const stats = {
    total: tickets.length,
    open: byState["Open"],
    inProgress: byState["In Progress"],
    resolved: byState["Resolved"],
    closed: byState["Closed"],
    byService,
    byState,
    byPriority,
    byType,
  };

  return Response.json({ stats });
}
