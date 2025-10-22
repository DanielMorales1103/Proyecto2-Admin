"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const SERVICES = [
  { value: "reservas", label: "Reservas" },
  { value: "sensores", label: "Disponibilidad y Telemetría de Sensores" },
  { value: "busqueda", label: "Búsqueda y Visualización de Parqueos/Tarifas" },
  { value: "reportes", label: "Reportes y Finanzas (Propietarios)" },
  { value: "cuentas", label: "Cuentas y Accesos (Conductores y Propietarios)" },
  { value: "onboarding", label: "Onboarding y Visibilidad de Parqueos (Marketplace)" },
  { value: "plataforma", label: "Plataforma/App (Disponibilidad y Rendimiento)" },
];

const priorityOrder = { High: 3, Medium: 2, Low: 1 };


export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchStats() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar estadísticas");
      const data = await res.json();
      setStats(data.stats);
    } catch (e) {
      setError(e.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <main>
        <div style={{ textAlign: "center", padding: 40, opacity: 0.7 }}>
          Cargando estadísticas...
        </div>
      </main>
    );
  }

  if (error || !stats) {
    return (
      <main>
        <div style={S.errorBox}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Error</h2>
          <p>{error || "No se pudieron cargar las estadísticas"}</p>
          <button onClick={fetchStats} style={S.primaryBtn}>
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>📊 Dashboard de Tickets</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/tickets/new" style={S.linkBtn}>➕ Crear ticket</Link>
          <Link href="/tickets" style={S.linkBtn}>📋 Ver backlog</Link>
          <button onClick={fetchStats} style={S.refreshBtn}>⟲ Actualizar</button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div style={S.summaryGrid}>
        <div style={{ ...S.summaryCard, borderLeft: "3px solid #58a6ff" }}>
          <div style={S.summaryLabel}>Total de Tickets</div>
          <div style={S.summaryValue}>{stats.total}</div>
        </div>
        <div style={{ ...S.summaryCard, borderLeft: "3px solid #56d364" }}>
          <div style={S.summaryLabel}>Abiertos</div>
          <div style={S.summaryValue}>{stats.open}</div>
        </div>
        <div style={{ ...S.summaryCard, borderLeft: "3px solid #ffc107" }}>
          <div style={S.summaryLabel}>En Progreso</div>
          <div style={S.summaryValue}>{stats.inProgress}</div>
        </div>
        <div style={{ ...S.summaryCard, borderLeft: "3px solid #238636" }}>
          <div style={S.summaryLabel}>Resueltos</div>
          <div style={S.summaryValue}>{stats.resolved}</div>
        </div>
      </div>

      {/* Gráficas */}
      <div style={S.chartsGrid}>
        {/* Gráfica por Estado */}
        <section style={S.chartSection}>
          <h3 style={S.chartTitle}>Tickets por Estado</h3>
          <BarChart
            data={Object.entries(stats.byPriority)
              .sort((a, b) => priorityOrder[b[0]] - priorityOrder[a[0]])
              .map(([key, value]) => ({
                label: key,
                value,
                color: getPriorityColor(key),
              }))}
          />
        </section>

        {/* Gráfica por Prioridad */}
        <section style={S.chartSection}>
          <h3 style={S.chartTitle}>Tickets por Prioridad</h3>
          <BarChart
            data={Object.entries(stats.byPriority).map(([key, value]) => ({
              label: key,
              value,
              color: getPriorityColor(key),
            }))}
          />
        </section>

        {/* Gráfica por Tipo */}
        <section style={S.chartSection}>
          <h3 style={S.chartTitle}>Tickets por Tipo</h3>
          <PieChart
            data={Object.entries(stats.byType).map(([key, value]) => ({
              label: key,
              value,
              color: getTypeColor(key),
            }))}
          />
        </section>

        {/* Gráfica por Servicio */}
        <section style={{ ...S.chartSection, gridColumn: "1 / -1" }}>
          <h3 style={S.chartTitle}>Tickets por Servicio</h3>
          <BarChart
            data={Object.entries(stats.byService).map(([key, value]) => ({
              label: SERVICES.find(s => s.value === key)?.label || key,
              value,
              color: "#58a6ff",
            }))}
            horizontal
          />
        </section>
      </div>
    </main>
  );
}

// Componente de gráfica de barras
function BarChart({ data, horizontal = false }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (horizontal) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 200, fontSize: 13, opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.label}
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, background: "#1f2a44", borderRadius: 4, height: 28, position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    background: item.color,
                    height: "100%",
                    width: `${(item.value / maxValue) * 100}%`,
                    borderRadius: 4,
                    transition: "width 0.5s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 8,
                  }}
                >
                  {item.value > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 16, height: 180 }}>
        {data.map((item, i) => {
          const heightPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 60 }}>
              <div style={{ height: 180, display: "flex", alignItems: "flex-end" }}>
                <div
                  style={{
                    width: 60,
                    height: `${heightPercentage}%`,
                    background: item.color,
                    borderRadius: "6px 6px 0 0",
                    transition: "height 0.5s ease",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingTop: 8,
                    minHeight: item.value > 0 ? 30 : 0,
                  }}
                >
                  {item.value > 0 && (
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", gap: 16, marginTop: 8 }}>
        {data.map((item, i) => (
          <div key={i} style={{ fontSize: 13, opacity: 0.8, textAlign: "center", minWidth: 60, maxWidth: 100 }}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente de gráfica de pastel (donut)
function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, opacity: 0.6 }}>
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 0" }}>
      {/* Donut chart */}
      <div style={{ position: "relative", width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          {data.map((item, i) => {
            const percentage = (item.value / total) * 100;
            const previousPercentages = data.slice(0, i).reduce((sum, d) => sum + (d.value / total) * 100, 0);
            const radius = 60;
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((previousPercentages / 100) * circumference);

            return (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="30"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 80 80)"
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            );
          })}
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{total}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Total</div>
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ flex: 1, display: "grid", gap: 8 }}>
        {data.map((item, i) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 16, height: 16, background: item.color, borderRadius: 4 }}></div>
              <div style={{ flex: 1, fontSize: 14 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {item.value} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getStateColor(state) {
  const colors = {
    "Open": "#56d364",
    "In Progress": "#ffc107",
    "Resolved": "#238636",
    "Closed": "#8b949e",
  };
  return colors[state] || "#58a6ff";
}

function getPriorityColor(priority) {
  const colors = {
    "High": "#f85149",
    "Medium": "#ffc107",
    "Low": "#56d364",
  };
  return colors[priority] || "#58a6ff";
}

function getTypeColor(type) {
  const colors = {
    "Incidente": "#f85149",
    "Solicitud": "#58a6ff",
    "Problema": "#ff8c42",
  };
  return colors[type] || "#58a6ff";
}

const S = {
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    background: "#0f172a",
    border: "1px solid #1f2a44",
    borderRadius: 12,
    padding: 20,
  },
  summaryLabel: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 700,
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: 16,
  },
  chartSection: {
    background: "#0f172a",
    border: "1px solid #1f2a44",
    borderRadius: 12,
    padding: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginTop: 0,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "1px solid #1f2a44",
  },
  linkBtn: {
    background: "#0f172a",
    color: "#e6edf3",
    padding: "8px 14px",
    borderRadius: 8,
    textDecoration: "none",
    border: "1px solid #1f2a44",
    fontSize: 14,
  },
  refreshBtn: {
    background: "#0f172a",
    color: "#e6edf3",
    border: "1px solid #1f2a44",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
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
  errorBox: {
    background: "#0f172a",
    border: "1px solid #f85149",
    borderRadius: 12,
    padding: 20,
    textAlign: "center",
  },
};
