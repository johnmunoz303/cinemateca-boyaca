"use client";
import {useState} from 'react';
import type {Row} from '@/lib/types';
export default function EnrollmentsPanel({rows,refresh}:{rows:Row[];refresh:()=>void}){
 const [query,setQuery]=useState(''),[type,setType]=useState('Todos');
 const filtered=rows.filter(row=>(type==='Todos'||row.tipo===type)&&[row.titulo,row.nombres,row.email,row.datos_inscripcion?.nombre_completo,row.datos_inscripcion?.numero_documento].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 return <section>
 <h2>Inscripciones a programas y eventos</h2>
 <div className="actions"><label>Buscar por nombre, correo, documento o actividad<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar inscripción" /></label><label>Tipo<select value={type} onChange={e=>setType(e.target.value)}><option>Todos</option><option>Programa</option><option>Evento</option></select></label><button className="primary" onClick={refresh}>Actualizar</button></div>
 <p>{filtered.length} inscripciones · Se muestran hasta las 500 más recientes.</p>
 <div className="table-wrap"><table><thead><tr><th>Actividad</th><th>Participante</th><th>Contacto</th><th>Fecha</th><th>Datos de inscripción</th></tr></thead><tbody>
 {filtered.map(row=>{const data=row.datos_inscripcion;return <tr key={row.id}><td>{row.titulo}<small>{row.tipo}</small></td><td>{data?.nombre_completo||row.nombres}<small>Cuenta: {row.email}</small></td><td>{data?.email||row.email}<small>{data?.telefono||'Sin teléfono registrado'}</small></td><td>{new Date(row.fecha).toLocaleString('es-CO',{timeZone:'America/Bogota'})}</td><td>{data?<details><summary>Ver datos</summary><p>{data.tipo_documento}: {data.numero_documento}<br />Nacimiento: {data.fecha_nacimiento}<br />Municipio: {data.municipio}<br />Aceptación de datos: {data.consentimiento?'Sí':'No'}</p></details>:<span>Inscripción anterior al formulario ampliado.</span>}</td></tr>})}
 </tbody></table>{!filtered.length&&<p className="empty">No hay inscripciones con estos filtros.</p>}</div>
 </section>;
}
