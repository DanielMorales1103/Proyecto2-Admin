"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h2 style={{fontSize:22, marginBottom:8}}>CityPark Service Desk</h2>
      <p style={{opacity:.8}}>Elige una opción:</p>
      <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
        <Link href="/tickets/new" style={S.btn}>➕ Crear ticket</Link>
        <Link href="/tickets" style={S.btnAlt}>📋 Ver backlog</Link>
        <Link href="/dashboard" style={S.btnAlt}>📊 Dashboard</Link>
      </div>
    </main>
  );
}

const S = {
  btn: { background:'#1f6feb', color:'#fff', padding:'10px 14px', borderRadius:8, textDecoration:'none', border:'1px solid #1f6feb' },
  btnAlt: { background:'#0f172a', color:'#e6edf3', padding:'10px 14px', borderRadius:8, textDecoration:'none', border:'1px solid #1f2a44' },
};
