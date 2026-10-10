import {db} from '@/database/db';
import {fail,text,email} from '@/modules/auth/auth.service';
let ready:Promise<void>|undefined;
export function ensureEnrollmentDetails(){return ready??=(async()=>{
 await db.query('ALTER TABLE cursos ADD COLUMN IF NOT EXISTS requisitos text, ADD COLUMN IF NOT EXISTS involucrados text, ADD COLUMN IF NOT EXISTS inicio timestamptz, ADD COLUMN IF NOT EXISTS direccion text, ADD COLUMN IF NOT EXISTS latitud numeric(10,7), ADD COLUMN IF NOT EXISTS longitud numeric(10,7)');
 await db.query('ALTER TABLE eventos ADD COLUMN IF NOT EXISTS requisitos text, ADD COLUMN IF NOT EXISTS involucrados text');
 await db.query('ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS datos_inscripcion jsonb');
 await db.query('ALTER TABLE eventos_inscripciones ADD COLUMN IF NOT EXISTS datos_inscripcion jsonb');
})().catch(error=>{ready=undefined;throw error})}
export function enrollmentData(body:Record<string,unknown>){
 if(body.consentimiento!==true)fail(400,'Debes aceptar el tratamiento de datos personales');
 const date=text(body.fecha_nacimiento,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||date>new Date().toISOString().slice(0,10)||date<'1900-01-01')fail(400,'Fecha de nacimiento no válida');
 const phone=text(body.telefono,25);if(!/^[+\d\s()-]{7,25}$/.test(phone))fail(400,'Teléfono no válido');
 const type=text(body.tipo_documento,50);if(!['Cédula de ciudadanía','Tarjeta de identidad','Cédula de extranjería','Pasaporte'].includes(type))fail(400,'Tipo de documento no válido');
 return {nombre_completo:text(body.nombre_completo,200),tipo_documento:type,numero_documento:text(body.numero_documento,30),fecha_nacimiento:date,municipio:text(body.municipio,100),email:email(body.email),telefono:phone,consentimiento:true,fecha_consentimiento:new Date().toISOString()};
}
