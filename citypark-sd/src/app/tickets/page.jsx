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

export default function BacklogPage(){
    const [tickets, setTickets] = useState([]);
    const [filterService, setFilterService] = useState("all");
    const [filterType, setFilterType] = useState("all");

    async function fetchTickets(){
        const res = await fetch("/api/tickets", { cache:"no-store" });
        const data = await res.json();
        setTickets(data.tickets || []);
    }

    useEffect(()=>{ fetchTickets(); },[]);

    const filtered = useMemo(()=>(
        tickets.filter(t => (filterService==='all'||t.servicio===filterService) && (filterType==='all'||t.tipo===filterType))
    ), [tickets, filterService, filterType]);

    return (
        <main>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h2 style={{fontSize:22}}>Backlog</h2>
        <Link href="/tickets/new" style={{fontSize:14, opacity:.8}}>→ Crear ticket</Link>
      </div>

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

      <div style={{display:'grid', gap:10}}>
        {filtered.length===0 && <div style={S.card}>No hay tickets aún.</div>}
        {filtered.map(t=>(
          <article key={t.id} style={S.card}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
              <h3 style={{margin:0, fontSize:16}}>
                {t.titulo || "(Sin título)"} <span style={{opacity:.7}}>· {t.tipo}</span>
              </h3>
              <span style={{border:'1px solid #2b4470', padding:'2px 8px', borderRadius:6}}>{t.prioridad}</span>
            </div>
            <div style={{opacity:.8, fontSize:14, marginTop:4}}>
              Servicio: <b>{SERVICES.find(s=>s.value===t.servicio)?.label}</b>
            </div>
            {t.parqueo && <div style={{opacity:.8, fontSize:14}}>Parqueo: {t.parqueo}</div>}
            {t.etiquetas?.length>0 && (
              <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:6}}>
                {t.etiquetas.map((tag, i)=>(
                  <span key={i} style={{border:'1px solid #22406d', padding:'2px 8px', borderRadius:999, fontSize:12}}>{tag}</span>
                ))}
              </div>
            )}
            {t.descripcion && <p style={{opacity:.9}}>{t.descripcion}</p>}
            <div style={{opacity:.6, fontSize:12}}>
              Contacto: {t.contacto || "—"} · Creado: {new Date(t.createdAt).toLocaleString()}
            </div>
          </article>
        ))}
      </div>
    </main>
    );
}

const S = {
  select: { width:'auto', background:'#0b1220', color:'#e6edf3', border:'1px solid #1f2a44', padding:'8px 10px', borderRadius:8 },
  refresh: { background:'#0f172a', color:'#e6edf3', border:'1px solid #1f2a44', padding:'8px 12px', borderRadius:8, cursor:'pointer' },
  card: { background:'#0f172a', border:'1px solid #1f2a44', padding:12, borderRadius:12 },
};
