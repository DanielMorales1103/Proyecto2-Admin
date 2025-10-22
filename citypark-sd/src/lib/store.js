import seedTicketsData from '../data/seed-tickets.json';

export function initializeStore() {
  if (!globalThis.__CITYPARK_STORE__) {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const items = seedTicketsData.map((ticketData, index) => {
      const createdAt = now - (Math.random() * 14 * oneDay);

      return {
        id: String(index + 1),
        ...ticketData,
        comentarios: ticketData.comentarios.map((comment, cIndex) => ({
          id: String(createdAt + cIndex * 1000),
          autor: comment.autor,
          texto: comment.texto,
          createdAt: createdAt + (cIndex + 1) * (12 * 60 * 60 * 1000),
        })),
        createdAt,
        updatedAt: ticketData.estado !== "Open" ? createdAt + (Math.random() * 3 * oneDay) : undefined,
      };
    });

    globalThis.__CITYPARK_STORE__ = {
      seq: items.length + 1,
      items,
    };
  }

  return globalThis.__CITYPARK_STORE__;
}

export function getStore() {
  return initializeStore();
}
