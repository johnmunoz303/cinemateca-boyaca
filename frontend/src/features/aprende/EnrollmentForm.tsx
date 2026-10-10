"use client";
import {useState} from 'react';
import {api} from '@/lib/client';
import type {Row} from '@/lib/types';
export default function EnrollmentForm({item,user,requireLogin,done}:{item:Row;user:Row|null;requireLogin:()=>boolean;done:()=>Promise<void>}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false);
 return <section className="enrollment-section">
 {!open&&!success&&<button className="primary full" onClick={()=>{if(requireLogin())setOpen(true)}}>Inscripción</button>}
 {success&&<p role="status">Tu inscripción se completó correctamente.</p>}
 {open&&<form className="enrollment-form" onSubmit={async event=>{event.preventDefault();if(!requireLogin()||busy)return;setBusy(true);setError('');const f=new FormData(event.currentTarget);try{await api(`${item.kind==='curso'?'cursos':'eventos'}/${item.id}/inscribir`,'POST',{...Object.fromEntries(f),consentimiento:f.has('consentimiento')});await done();setSuccess(true);setOpen(false)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>
 <h2>Inscripción</h2>
 <label className="enrollment-wide">Nombre completo *<input name="nombre_completo" required maxLength={200} autoComplete="name" defaultValue={[user?.nombres,user?.apellidos].filter(Boolean).join(' ')} /></label>
 <label>Tipo de documento *<select name="tipo_documento" required>{['Cédula de ciudadanía','Tarjeta de identidad','Cédula de extranjería','Pasaporte'].map(type=><option key={type}>{type}</option>)}</select></label>
 <label>Número de documento *<input name="numero_documento" required maxLength={30} /></label>
 <label>Fecha de nacimiento *<input type="date" name="fecha_nacimiento" required min="1900-01-01" max={new Date().toISOString().slice(0,10)} /></label>
 <label>Municipio / ciudad *<input name="municipio" required maxLength={100} autoComplete="address-level2" /></label>
 <label className="enrollment-wide">Correo electrónico *<input type="email" name="email" required maxLength={254} autoComplete="email" defaultValue={user?.email??''} /></label>
 <label>Teléfono *<input type="tel" name="telefono" required maxLength={25} autoComplete="tel" /></label>
 <label className="enrollment-consent enrollment-wide"><input type="checkbox" name="consentimiento" required />Acepto el tratamiento de mis datos personales para gestionar esta inscripción. Consulta la política publicada en Transparencia.</label>
 {error&&<p className="error enrollment-wide" role="alert">{error}</p>}
 <button className="primary enrollment-wide" disabled={busy}>{busy?'Guardando…':'Completar inscripción'}</button>
 </form>}
 </section>;
}
