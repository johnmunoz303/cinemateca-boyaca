"use client";
import {api,date} from '@/lib/client';
import type {Row} from '@/lib/types';
import EnrollmentForm from './EnrollmentForm';
import LocationMap from '@/components/LocationMap';

type Props={item:Row;user:Row|null;requireLogin:()=>boolean;refreshMe:()=>Promise<void>;watch:(id:number)=>void;flash:(message:string)=>void};
export default function ActivityDetail({item,user,requireLogin,refreshMe,watch,flash}:Props){
 const course=item.kind==='curso';
 const modality=course?(item.modalidad||(['presencial','virtual','hibrida'].includes(String(item.categoria).toLowerCase())?item.categoria:'')):item.categoria;
 const lines=(value:unknown)=>String(value??'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 const requirements=lines(item.requisitos),phases=lines(item.fases);
 const modules:Array<Row>=Array.isArray(item.modulos)?item.modulos:[];
 return <article className="activity-detail">
   <h1>{item.titulo}</h1>
   <img className="activity-image" src={item.poster||item.imagen||'/posters/default.svg'} alt={'Imagen de '+item.titulo}/>
   <div className="activity-meta">
     <div><strong>Categoría</strong><span className="activity-modality">{modality||'Por confirmar'}</span>{!course&&item.tipo_evento&&<small>{item.tipo_evento}</small>}</div>
     {item.involucrados?<details className="activity-people"><summary>Involucrados</summary><p>{item.involucrados}</p></details>:<span/>}
     {item.inicio?<time dateTime={item.inicio}>{date(item.inicio)}</time>:<span/>}
   </div>
   <section className="activity-summary"><h2>{course?'Resumen del programa':'Resumen del evento'}</h2><p>{item.descripcion}</p></section>
   {requirements.length>0&&<section className="activity-points"><h2>Requerimientos</h2><ul>{requirements.map((line,index)=><li key={index}>{line}</li>)}</ul></section>}
   {!course&&phases.length>0&&<section className="activity-points"><h2>Fases de la competencia</h2><ul>{phases.map((line,index)=><li key={index}>{line}</li>)}</ul></section>}
   {course&&(item.categoria||item.duracion)&&<dl className="activity-course-facts">{item.categoria&&<><dt>Nivel</dt><dd>{item.categoria}</dd></>}{item.duracion&&<><dt>Duración</dt><dd>{item.duracion}</dd></>}</dl>}
   <EnrollmentForm key={item.kind+'-'+item.id} item={item} user={user} requireLogin={requireLogin} done={refreshMe}/>
   {(item.direccion||item.latitud!=null)&&<section className="activity-location"><h2>¿Cómo llego?</h2><LocationMap item={item}/></section>}
   {course&&modules.length>0&&<section className="activity-classroom"><h2>Aula virtual</h2>{modules.map(module=><div className="module" key={module.id}><p>{module.orden}. {module.titulo}</p>{module.obra_id?<button onClick={()=>watch(module.obra_id)}>Ver lección</button>:<small>Material de la lección pendiente de carga.</small>}<button onClick={async()=>{if(!requireLogin())return;try{await api(`modulos/${module.id}/completar`,'POST',{});await refreshMe();flash('Avance actualizado')}catch(error){flash((error as Error).message)}}}>Marcar como completado</button></div>)}</section>}
 </article>;
}
