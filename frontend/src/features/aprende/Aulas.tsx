"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { Row } from "@/lib/types";
import { Check, ChevronDown, X } from "lucide-react";
import SchoolTeam from "./SchoolTeam";
import LocationMap from "@/components/LocationMap";
import "./school.css";
export default function Aulas({onPrograms}:{onPrograms:()=>void}) {
 const teamDialog=useRef<HTMLDialogElement>(null);
 const [teamRevision,setTeamRevision]=useState(0);
 const [rows,setRows]=useState<Row[]>([]),[open,setOpen]=useState<number|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;api("aulas").then(value=>{if(active){setRows(value);setOpen(value[0]?.id??null)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 return <div className="school-page"><div className="school-landing"><section className="school-intro">
  <h1>Escuela de cine,<br/> audiovisuales y medios interactivos</h1>
  <p>Nuestra escuela es un espacio de formación integral en el séptimo arte y los nuevos medios. Con una metodología que combina teoría cinematográfica con práctica creativa, proponemos aprender a contar historias que transformen realidades.</p>
  <p>Explora el lenguaje audiovisual, desarrolla tus ideas y encuentra nuevas formas de narrar las historias de Boyacá. Conoce nuestros programas y los espacios propuestos para aprender, experimentar y crear en equipo.</p>
  <ul className="school-benefits">{["Aprendizaje mediante ejercicios prácticos","Exploración del lenguaje cinematográfico","Espacios para crear y compartir ideas","Trabajo colaborativo en proyectos audiovisuales","Historias conectadas con nuestro territorio","Orientación para diferentes niveles de experiencia"].map(text=><li key={text}><Check size={17} aria-hidden="true"/>{text}</li>)}</ul>
 </section><div className="school-gallery">
  <div className="school-program-tile"><img src="/eventos/festival-cine-campesino.png" alt="Encuentro de cine y formación audiovisual"/><button className="primary full" onClick={onPrograms}>Ver programas</button></div>
  <button className="school-team-tile" onClick={()=>{setTeamRevision(n=>n+1);teamDialog.current?.showModal();}} aria-haspopup="dialog"><img src="/programas/talleres-iniciacion.png" alt=""/><span>Nuestro<br/>equipo</span></button>
  <img className="school-study-image" src="/programas/diplomados-especializados.png" alt="Práctica de realización cinematográfica"/>
 </div></div><section className="school-classrooms" aria-label="Nuestras aulas"><h2>Conoce nuestras aulas</h2>
  <p className="school-demo-note">Propuesta de espacios y horarios de ejemplo. Confirma la disponibilidad con la administración antes de asistir.</p>
  {loading&&<p role="status">Cargando aulas…</p>}{error&&<p role="alert" className="error">{error}</p>}{!loading&&!error&&!rows.length&&<p>No hay aulas registradas.</p>}
  <div className="school-accordion">{rows.map((a,index)=><div className={"school-aula school-aula-"+index%4} key={a.id}>
   <button id={"aula-heading-"+a.id} aria-expanded={open===a.id} aria-controls={"aula-panel-"+a.id} onClick={()=>setOpen(open===a.id?null:a.id)}>{a.nombre}<ChevronDown size={20} className={open===a.id?"expanded":""}/></button>
   {open===a.id&&<div className="school-aula-content" id={"aula-panel-"+a.id} role="region" aria-labelledby={"aula-heading-"+a.id}><h3>{a.nombre}</h3><p>{a.descripcion}</p><strong>Horarios</strong><p>{a.horarios||"Consulta con la administración"}</p><strong>Ubicación</strong><LocationMap item={a}/></div>}
  </div>)}</div>
 </section><dialog ref={teamDialog} className="school-team-dialog" aria-label="Nuestro equipo" onClick={e=>{if(e.target===e.currentTarget){const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)e.currentTarget.close();}}}>
  <button type="button" className="school-team-close" aria-label="Cerrar nuestro equipo" onClick={()=>teamDialog.current?.close()}><X size={23}/></button><SchoolTeam key={teamRevision}/>
 </dialog></div>;
}
