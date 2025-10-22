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
const TYPES = ["Incidente","Solicitud","Problema"];

const PRIORITIES = ["Low", "Medium", "High"];


export default function CreateTicketPage(){
  const [form, setForm] = useState({
    servicio:"reservas", tipo:"Incidente", etiquetas:[],
     prioridad:"Medium", titulo:"", descripcion:"", parqueo:"", contacto:""
  });
  const [loading, setLoading] = useState(false);
  const [okId, setOkId] = useState(null);
  const [err, setErr] = useState("");
  const [gitlabLabels, setGitlabLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      const res = await fetch("/api/gitlab/labels", { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        console.warn("Labels fetch failed:", res.status, txt);
        setGitlabLabels([]);
      } else {
        const data = await res.json();
        // 🔽 Filtrar labels que NO sean de prioridad
        const filtered = (data.labels || []).filter(
          l => !/^priority::/i.test(l.name)
        );
        setGitlabLabels(filtered);
      }
    } catch (e) {
      console.error("Labels fetch error:", e);
      setGitlabLabels([]);
    } finally {
      setLabelsLoading(false);
    }
  })();
}, []);

  function toggleLabel(name){
    setForm(s => {
      const has = s.etiquetas.includes(name);
      return { ...s, etiquetas: has ? s.etiquetas.filter(x=>x!==name) : [...s.etiquetas, name] };
    });
  }

  async function onSubmit(e){
    e.preventDefault();
    setLoading(true); setErr(""); setOkId(null);
    try{
      const res = await fetch("/api/tickets",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data?.error || "Error");
      setOkId(data.id);
      setForm({servicio:"reservas",tipo:"Incidente",etiquetas:[],prioridad:"P3",titulo:"",descripcion:"",parqueo:"",contacto:""});
    }catch(e){ setErr(String(e.message||e)); }
    finally{ setLoading(false); }
  }

  return (
    <main>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h2 style={{fontSize:22}}>Crear ticket</h2>
        <div style={{display:'flex', gap:12}}>
          <Link href="/dashboard" style={{fontSize:14, opacity:.8}}>📊 Dashboard</Link>
          <Link href="/tickets" style={{fontSize:14, opacity:.8}}>→ Ir al backlog</Link>
        </div>
      </div>
      <p style={{opacity:.8, marginTop:0}}>Categoría principal = <b>Servicio</b>. Etiquetas técnicas vienen de tus <b>GitLab Labels</b>.</p>

      <form onSubmit={onSubmit} style={S.form}>
        <div style={S.row2}>
          <div>
            <label>Servicio</label>
            <select value={form.servicio} onChange={e=>setForm(s=>({...s,servicio:e.target.value}))} style={S.select}>
              {SERVICES.map(s=> <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label>Tipo</label>
            <select value={form.tipo} onChange={e=>setForm(s=>({...s,tipo:e.target.value}))} style={S.select}>
              {TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label>Etiquetas técnicas (GitLab)</label>
          {labelsLoading ? (
            <div style={{opacity:.7, fontSize:13}}>Cargando etiquetas…</div>
          ) : gitlabLabels.length === 0 ? (
            <div style={{opacity:.7, fontSize:13}}>
              No hay labels en el proyecto. Crea algunas en GitLab → Project → Labels.
            </div>
          ) : (
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {gitlabLabels.map(l => {
                const selected = form.etiquetas.includes(l.name);
                return (
                  <button
                    type="button"
                    key={l.id}
                    onClick={()=> toggleLabel(l.name)}
                    title={l.description || l.name}
                    style={{
                      padding:'6px 10px',
                      borderRadius:999,
                      border:'1px solid #22406d',
                      background: selected ? '#1f6feb' : 'transparent',
                      color: selected ? '#fff' : '#e6edf3',
                      cursor:'pointer',
                      display:'inline-flex',
                      alignItems:'center',
                      gap:6
                    }}
                  >
                    {/* indicador de color del label */}
                    <span style={{
                      width:10, height:10, borderRadius:'50%',
                      background: l.color || '#1f6feb', display:'inline-block'
                    }} />
                    {l.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={S.row2}>
          <div>
            <label>Prioridad</label>
            <select value={form.prioridad} onChange={e=>setForm(s=>({...s,prioridad:e.target.value}))} style={S.select}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label>Parqueo afectado (opcional)</label>
            <input value={form.parqueo} onChange={e=>setForm(s=>({...s,parqueo:e.target.value}))} placeholder="Ej. Plaza Central" style={S.input}/>
          </div>
        </div>

        <div>
          <label>Título</label>
          <input value={form.titulo} onChange={e=>setForm(s=>({...s,titulo:e.target.value}))} placeholder="No confirma la reserva" style={S.input}/>
        </div>

        <div>
          <label>Descripción</label>
          <textarea value={form.descripcion} onChange={e=>setForm(s=>({...s,descripcion:e.target.value}))} placeholder="Pasos, alcance, evidencia" rows={5} style={S.textarea}/>
        </div>

        <div>
          <label>Contacto (correo/teléfono)</label>
          <input value={form.contacto} onChange={e=>setForm(s=>({...s,contacto:e.target.value}))} placeholder="user@email.com" style={S.input}/>
        </div>

        <button type="submit" disabled={loading} style={S.primaryBtn}>
          {loading ? "Enviando…" : "Crear ticket"}
        </button>

        {okId && <div style={{marginTop:10, color:'#7ee787'}}>✓ Ticket creado: {okId}</div>}
        {err && <div style={{marginTop:10, color:'#ff7b72'}}>✗ {err}</div>}
      </form>
    </main>
  );
}

const S = {
  form: { display:'grid', gap:12, background:'#0f172a', border:'1px solid #1f2a44', padding:16, borderRadius:12 },
  row2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  select: { width:'100%', background:'#0b1220', color:'#e6edf3', border:'1px solid #1f2a44', padding:'8px 10px', borderRadius:8 },
  input: { width:'100%', background:'#0b1220', color:'#e6edf3', border:'1px solid #1f2a44', padding:'9px 10px', borderRadius:8 },
  textarea: { width:'100%', background:'#0b1220', color:'#e6edf3', border:'1px solid #1f2a44', padding:'9px 10px', borderRadius:8 },
  primaryBtn: { background:'#1f6feb', border:'1px solid #1f6feb', color:'#fff', padding:'10px 14px', borderRadius:8, cursor:'pointer', fontWeight:600 },
};
