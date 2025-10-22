"use client";
import { useEffect, useMemo, useState } from "react";
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
const TYPES = ["Incidente","Solicitud","Problema"];
const STATES = ["Open", "In Progress", "Resolved", "Closed"];

export default function BoardPage(){
  const [tickets, setTickets] = useState([]);
  const [filterService, setFilterService] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [savingId, setSavingId] = useState(null);

 async function fetchTickets(){
  try {
    const res = await fetch("/api/tickets", { cache:"no-store" });
    if (!res.ok) {
      // intenta obtener texto para loguear
      const txt = await res.text();
      console.warn("GET /api/tickets failed:", res.status, txt);
      setTickets([]); // fallback
      return;
    }
    // si el body estuviera vacío por alguna razón, protege el json()
    let data = null;
    try {
      data = await res.json();
    } catch {
      console.warn("Empty/invalid JSON from /api/tickets");
      data = { tickets: [] };
    }
    setTickets(Array.isArray(data.tickets) ? data.tickets : []);
  } catch (err) {
    console.error("fetchTickets error:", err);
    setTickets([]); // fallback
  }
}

  useEffect(()=>{ fetchTickets(); },[]);

  const filtered = useMemo(()=>(
    tickets.filter(t =>
      (filterService==='all'||t.servicio===filterService) &&
      (filterType==='all'||t.tipo===filterType)
    )
  ), [tickets, filterService, filterType]);

  const grouped = useMemo(()=> {
    const by = { Open:[], "In Progress":[], Resolved:[], Closed:[] };
    for (const t of filtered) { (by[t.estado] || by.Open).push(t); }
    return by;
  }, [filtered]);

  async function changeState(id, estado){
    setSavingId(id);
    try{
      const res = await fetch(`/api/tickets/${id}`, {
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ estado })
      });
      if(!res.ok) throw new Error("No se pudo actualizar");
      await fetchTickets();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h2 style={{fontSize:22}}>Backlog (Tablero)</h2>
        <div style={{display:'flex', gap:12}}>
          <Link href="/dashboard" style={{fontSize:14, opacity:.8}}>📊 Dashboard</Link>
          <Link href="/tickets/new" style={{fontSize:14, opacity:.8}}>→ Crear ticket</Link>
        </div>
      </div>

      {/* Filtros arriba */}
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <select value={filterService} onChange={e=>setFilterService(e.target.value)} style={S.select}>
          <option value="all">Todos los servicios</option>
          {SERVICES.map(s=> <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={S.select}>
          <option value="all">Todos los tipos</option>
          {TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={fetchTickets} style={S.refresh}>⟲ Actualizar</button>
      </div>

      {/* Columnas por estado */}
      <div style={S.board}>
        {STATES.map(state => (
          <section key={state} style={S.column}>
            <header style={S.colHeader}>
              <span>{state}</span>
              <span style={{opacity:.7, fontSize:12}}>{grouped[state]?.length || 0}</span>
            </header>

            <div style={{display:'grid', gap:10}}>
              {(grouped[state]||[]).map(t => (
                <article key={t.id} style={S.card}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
                    <h3 style={{margin:0, fontSize:15}}>
                      <Link href={`/tickets/${t.id}`} style={{color:'#58a6ff', textDecoration:'none'}}>
                        {t.titulo || "(Sin título)"}
                      </Link>
                      <span style={{opacity:.7}}> · {t.tipo}</span>
                    </h3>
                    <span style={{border:'1px solid #2b4470', padding:'2px 8px', borderRadius:6, fontSize:12}}>{t.prioridad}</span>
                  </div>

                  <div style={{opacity:.8, fontSize:13, marginTop:4}}>
                    Servicio: <b>{SERVICES.find(s=>s.value===t.servicio)?.label}</b>
                  </div>
                  {t.parqueo && <div style={{opacity:.8, fontSize:13}}>Parqueo: {t.parqueo}</div>}
                  {t.etiquetas?.length>0 && (
                    <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:6}}>
                      {t.etiquetas.map((tag, i)=>(
                        <span key={i} style={{border:'1px solid #22406d', padding:'2px 8px', borderRadius:999, fontSize:11}}>{tag}</span>
                      ))}
                    </div>
                  )}
                  {t.descripcion && <p style={{opacity:.9, fontSize:13}}>{t.descripcion}</p>}

                  <div style={{opacity:.6, fontSize:11, marginTop:6}}>
                    Creado: {new Date(t.createdAt).toLocaleString()}
                  </div>
                </article>
              ))}

              {(grouped[state]||[]).length===0 && (
                <div style={S.empty}>Sin tickets en “{state}”.</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const S = {
  select: { background:'#0b1220', color:'#e6edf3', border:'1px solid #1f2a44', padding:'8px 10px', borderRadius:8 },
  refresh: { background:'#0f172a', color:'#e6edf3', border:'1px solid #1f2a44', padding:'8px 12px', borderRadius:8, cursor:'pointer' },
  board: { display:'grid', gap:12, gridTemplateColumns:'repeat(4, 1fr)' },
  column: { background:'#0f172a', border:'1px solid #1f2a44', borderRadius:12, padding:12, minHeight:200 },
  colHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, fontWeight:600 },
  card: { background:'#0b1220', border:'1px solid #1f2a44', padding:12, borderRadius:12 },
  empty: { border:'1px dashed #233152', borderRadius:8, padding:'12px 10px', opacity:.7, fontSize:12, textAlign:'center' }
};
