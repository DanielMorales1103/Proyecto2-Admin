"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const SERVICES = [
  { value: "reservas", label: "Reservas" },
  { value: "sensores", label: "Disponibilidad y Telemetría de Sensores" },
  { value: "busqueda", label: "Búsqueda y Visualización de Parqueos/Tarifas" },
  { value: "reportes", label: "Reportes y Finanzas (Propietarios)" },
  { value: "cuentas", label: "Cuentas y Accesos (Conductores y Propietarios)" },
  { value: "onboarding", label: "Onboarding y Visibilidad de Parqueos (Marketplace)" },
  { value: "plataforma", label: "Plataforma/App (Disponibilidad y Rendimiento)" },
];
const STATES = ["Open", "In Progress", "Resolved", "Closed"];
const TYPES = ["Incidente", "Solicitud", "Problema"];
const TAGS = ["frontend/app","backend/api","infra/cloud","sensores/iot","datos/bi","auth/identidad","pagos"];

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingState, setSavingState] = useState(false);

  // Estado para modo edición
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Estado para comentarios
  const [comentarioTexto, setComentarioTexto] = useState("");
  const [comentarioAutor, setComentarioAutor] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  async function fetchTicket() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/tickets/${params.id}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Ticket no encontrado");
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (e) {
      setError(e.message || "Error al cargar el ticket");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchTicket();
    }
  }, [params.id]);

  function startEdit() {
    setEditForm({
      titulo: ticket.titulo || "",
      descripcion: ticket.descripcion || "",
      servicio: ticket.servicio,
      tipo: ticket.tipo,
      prioridad: ticket.prioridad,
      parqueo: ticket.parqueo || "",
      contacto: ticket.contacto || "",
      etiquetas: ticket.etiquetas || [],
      estado: ticket.estado,
    });
    setIsEditing(true);
    setSaveError("");
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditForm({});
    setSaveError("");
  }

  async function saveEdit() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo guardar");
      }
      await fetchTicket();
      setIsEditing(false);
      setEditForm({});
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeState(newState) {
    setSavingState(true);
    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newState }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el estado");
      await fetchTicket();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSavingState(false);
    }
  }

  function toggleTag(tag) {
    setEditForm(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(tag)
        ? prev.etiquetas.filter(t => t !== tag)
        : [...prev.etiquetas, tag]
    }));
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!comentarioTexto.trim()) return;

    setSendingComment(true);
    setCommentError("");
    try {
      const res = await fetch(`/api/tickets/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: comentarioTexto,
          autor: comentarioAutor || "Anónimo",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al agregar comentario");
      }
      setComentarioTexto("");
      setComentarioAutor("");
      await fetchTicket();
    } catch (e) {
      setCommentError(e.message);
    } finally {
      setSendingComment(false);
    }
  }

  if (loading) {
    return (
      <main>
        <div style={{ textAlign: "center", padding: 40, opacity: 0.7 }}>
          Cargando ticket...
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main>
        <div style={S.errorBox}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Error</h2>
          <p>{error || "Ticket no encontrado"}</p>
          <Link href="/tickets" style={S.btn}>
            ← Volver al backlog
          </Link>
        </div>
      </main>
    );
  }

  const serviceLabel = SERVICES.find(s => s.value === ticket.servicio)?.label || ticket.servicio;

  return (
    <main>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/tickets" style={{ fontSize: 24, opacity: 0.7, textDecoration: "none" }}>
            ←
          </Link>
          <h2 style={{ fontSize: 22, margin: 0 }}>Ticket #{ticket.id}</h2>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isEditing ? (
            <>
              <span style={S.badge}>{ticket.tipo}</span>
              <span style={{ ...S.badge, background: getPriorityColor(ticket.prioridad) }}>
                {ticket.prioridad}
              </span>
              <button onClick={startEdit} style={S.editBtn}>✏️ Editar</button>
            </>
          ) : (
            <>
              <button onClick={cancelEdit} disabled={saving} style={S.cancelBtn}>
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving} style={S.saveBtn}>
                {saving ? "Guardando..." : "💾 Guardar"}
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div style={{ ...S.errorBox, marginBottom: 16 }}>
          ✗ {saveError}
        </div>
      )}

      {/* Contenido principal */}
      <div style={S.container}>
        {/* Información del ticket */}
        <section style={S.section}>
          <h3 style={S.sectionTitle}>Información General</h3>

          {!isEditing ? (
            // Vista modo lectura
            <>
              <div style={S.field}>
                <label style={S.label}>Título</label>
                <div style={S.value}>{ticket.titulo || "(Sin título)"}</div>
              </div>

              <div style={S.field}>
                <label style={S.label}>Descripción</label>
                <div style={{ ...S.value, whiteSpace: "pre-wrap" }}>
                  {ticket.descripcion || "(Sin descripción)"}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={S.field}>
                  <label style={S.label}>Servicio</label>
                  <div style={S.value}>{serviceLabel}</div>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Tipo</label>
                  <div style={S.value}>{ticket.tipo}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={S.field}>
                  <label style={S.label}>Estado</label>
                  <select
                    value={ticket.estado}
                    onChange={(e) => changeState(e.target.value)}
                    disabled={savingState}
                    style={S.select}
                  >
                    {STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {savingState && <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>Guardando...</span>}
                </div>

                <div style={S.field}>
                  <label style={S.label}>Prioridad</label>
                  <div style={S.value}>{ticket.prioridad}</div>
                </div>
              </div>

              {(ticket.parqueo || ticket.contacto) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {ticket.parqueo && (
                    <div style={S.field}>
                      <label style={S.label}>Parqueo Afectado</label>
                      <div style={S.value}>{ticket.parqueo}</div>
                    </div>
                  )}

                  {ticket.contacto && (
                    <div style={S.field}>
                      <label style={S.label}>Contacto</label>
                      <div style={S.value}>{ticket.contacto}</div>
                    </div>
                  )}
                </div>
              )}

              {ticket.etiquetas && ticket.etiquetas.length > 0 && (
                <div style={S.field}>
                  <label style={S.label}>Etiquetas Técnicas</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {ticket.etiquetas.map((tag, i) => (
                      <span key={i} style={S.tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Modo edición
            <>
              <div style={S.field}>
                <label style={S.label}>Título</label>
                <input
                  type="text"
                  value={editForm.titulo}
                  onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                  placeholder="Título del ticket"
                  style={S.input}
                  maxLength={120}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Descripción</label>
                <textarea
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                  placeholder="Descripción detallada"
                  rows={6}
                  style={S.textarea}
                  maxLength={5000}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={S.field}>
                  <label style={S.label}>Servicio</label>
                  <select
                    value={editForm.servicio}
                    onChange={(e) => setEditForm({ ...editForm, servicio: e.target.value })}
                    style={S.select}
                  >
                    {SERVICES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Tipo</label>
                  <select
                    value={editForm.tipo}
                    onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                    style={S.select}
                  >
                    {TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={S.field}>
                  <label style={S.label}>Estado</label>
                  <select
                    value={editForm.estado}
                    onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                    style={S.select}
                  >
                    {STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Prioridad</label>
                  <select
                    value={editForm.prioridad}
                    onChange={(e) => setEditForm({ ...editForm, prioridad: e.target.value })}
                    style={S.select}
                  >
                    {["P1", "P2", "P3", "P4"].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={S.field}>
                  <label style={S.label}>Parqueo Afectado (opcional)</label>
                  <input
                    type="text"
                    value={editForm.parqueo}
                    onChange={(e) => setEditForm({ ...editForm, parqueo: e.target.value })}
                    placeholder="Ej. Plaza Central"
                    style={S.input}
                    maxLength={120}
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Contacto</label>
                  <input
                    type="text"
                    value={editForm.contacto}
                    onChange={(e) => setEditForm({ ...editForm, contacto: e.target.value })}
                    placeholder="Email o teléfono"
                    style={S.input}
                    maxLength={120}
                  />
                </div>
              </div>

              <div style={S.field}>
                <label style={S.label}>Etiquetas Técnicas</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid #22406d",
                        background: editForm.etiquetas.includes(tag) ? "#1f6feb" : "transparent",
                        color: editForm.etiquetas.includes(tag) ? "#fff" : "#e6edf3",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={S.field}>
              <label style={S.label}>Creado</label>
              <div style={S.valueSmall}>
                {new Date(ticket.createdAt).toLocaleString("es-ES")}
              </div>
            </div>

            {ticket.updatedAt && (
              <div style={S.field}>
                <label style={S.label}>Última Actualización</label>
                <div style={S.valueSmall}>
                  {new Date(ticket.updatedAt).toLocaleString("es-ES")}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sección de comentarios */}
        <section style={S.section}>
          <h3 style={S.sectionTitle}>
            Comentarios de Seguimiento ({ticket.comentarios?.length || 0})
          </h3>

          {/* Lista de comentarios */}
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            {ticket.comentarios && ticket.comentarios.length > 0 ? (
              ticket.comentarios.map((comentario) => (
                <div key={comentario.id} style={S.comment}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <strong style={{ fontSize: 14 }}>{comentario.autor}</strong>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>
                      {new Date(comentario.createdAt).toLocaleString("es-ES")}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9, whiteSpace: "pre-wrap" }}>
                    {comentario.texto}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: 20, opacity: 0.6, fontSize: 14 }}>
                No hay comentarios aún. Sé el primero en agregar uno.
              </div>
            )}
          </div>

          {/* Formulario para agregar comentario */}
          <form onSubmit={handleAddComment} style={S.commentForm}>
            <h4 style={{ fontSize: 15, marginTop: 0, marginBottom: 12 }}>Agregar Comentario</h4>

            <div style={{ marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Tu nombre (opcional)"
                value={comentarioAutor}
                onChange={(e) => setComentarioAutor(e.target.value)}
                style={S.input}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <textarea
                placeholder="Escribe tu comentario..."
                value={comentarioTexto}
                onChange={(e) => setComentarioTexto(e.target.value)}
                rows={4}
                style={S.textarea}
                required
              />
            </div>

            <button type="submit" disabled={sendingComment || !comentarioTexto.trim()} style={S.primaryBtn}>
              {sendingComment ? "Enviando..." : "Agregar Comentario"}
            </button>

            {commentError && (
              <div style={{ marginTop: 10, color: "#ff7b72", fontSize: 13 }}>
                ✗ {commentError}
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

function getPriorityColor(priority) {
  const colors = {
    P1: "#f85149",
    P2: "#ff8c42",
    P3: "#ffc107",
    P4: "#56d364",
  };
  return colors[priority] || "#1f2a44";
}

const S = {
  container: {
    display: "grid",
    gap: 16,
  },
  section: {
    background: "#0f172a",
    border: "1px solid #1f2a44",
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginTop: 0,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "1px solid #1f2a44",
  },
  field: {
    marginBottom: 12,
  },
  label: {
    display: "block",
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  value: {
    fontSize: 15,
    color: "#e6edf3",
  },
  valueSmall: {
    fontSize: 13,
    color: "#e6edf3",
    opacity: 0.9,
  },
  badge: {
    background: "#1f2a44",
    border: "1px solid #2b4470",
    padding: "4px 12px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
  },
  tag: {
    border: "1px solid #22406d",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
  },
  select: {
    background: "#0b1220",
    color: "#e6edf3",
    border: "1px solid #1f2a44",
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 14,
    width: "100%",
  },
  comment: {
    background: "#0b1220",
    border: "1px solid #1f2a44",
    borderRadius: 8,
    padding: 12,
  },
  commentForm: {
    background: "#0b1220",
    border: "1px solid #1f2a44",
    borderRadius: 8,
    padding: 16,
  },
  input: {
    width: "100%",
    background: "#0f172a",
    color: "#e6edf3",
    border: "1px solid #1f2a44",
    padding: "9px 12px",
    borderRadius: 8,
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    background: "#0f172a",
    color: "#e6edf3",
    border: "1px solid #1f2a44",
    padding: "9px 12px",
    borderRadius: 8,
    fontSize: 14,
    resize: "vertical",
  },
  primaryBtn: {
    background: "#1f6feb",
    border: "1px solid #1f6feb",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  btn: {
    background: "#0f172a",
    color: "#e6edf3",
    padding: "10px 14px",
    borderRadius: 8,
    textDecoration: "none",
    border: "1px solid #1f2a44",
    display: "inline-block",
  },
  editBtn: {
    background: "#1f6feb",
    border: "1px solid #1f6feb",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
  },
  saveBtn: {
    background: "#238636",
    border: "1px solid #238636",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  cancelBtn: {
    background: "#0f172a",
    color: "#e6edf3",
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #1f2a44",
    cursor: "pointer",
    fontSize: 14,
  },
  errorBox: {
    background: "#0f172a",
    border: "1px solid #f85149",
    borderRadius: 12,
    padding: 20,
    textAlign: "center",
  },
};
