"use client";
import {useEffect,useState} from "react";
import {api} from "@/lib/client";
import type {Row} from "@/lib/types";
import "./school.css";
export default function SchoolTeam(){
 const [members,setMembers]=useState<Row[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError("");api("equipo").then(value=>{if(active)setMembers(value)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[retry]);
 return <section className="school-team-page"><h1>Nuestro equipo</h1>
  {loading&&<p role="status">Cargando equipo…</p>}
  {error&&<div role="alert"><p>No se pudo cargar el equipo. {error}</p><button onClick={()=>setRetry(n=>n+1)}>Volver a intentar</button></div>}
  {!loading&&!error&&!members.length&&<p>Pronto conocerás a nuestro equipo.</p>}
  <div className="school-team-members">{members.map(person=>{
   const panel=typeof person.foto === "string" ? person.foto.match(/\/escuela\/equipo-demostracion\.png\?panel=([012])$/) : null;
   const style=person.foto ? {backgroundImage:`url(${JSON.stringify(person.foto)})`,backgroundSize:panel?"300% auto":"cover",backgroundPosition:panel?Number(panel[1])*50+"% center":"center 30%"} : {backgroundImage:"none"};
   return <article className="school-team-member" key={person.id}><div className="school-team-portrait" role="img" aria-label={(person.demostracion?"Retrato ilustrativo de ":"Fotografía de ")+person.nombre} style={style}>{!person.foto&&<span aria-hidden="true">{person.nombre.split(/\s+/).slice(0,2).map((word:string)=>word[0]).join("")}</span>}</div><div><h2>{person.nombre}</h2><strong>{person.cargo}</strong><p>{person.biografia}</p></div></article>
  })}</div>
  {members.some(person=>person.demostracion)&&<p className="school-demo-note">Los perfiles marcados como demostración son ilustrativos y no representan personal confirmado de la Cinemateca.</p>}
 </section>;
}
