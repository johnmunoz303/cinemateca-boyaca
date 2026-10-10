import nodemailer from 'nodemailer';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export async function sendPasswordReset(email:string,raw:string){
 const origin=process.env.PUBLIC_APP_URL??process.env.APP_ORIGIN??'http://localhost:3000';const link=new URL('/',origin);link.searchParams.set('reset',raw);
 const message={from:process.env.SMTP_FROM,to:email,subject:'Cinemateca de Boyacá: recuperar contraseña',text:`Solicitaste recuperar tu contraseña. Abre este enlace: ${link.toString()}\nVence en 20 minutos y puede usarse una sola vez. Si no solicitaste el cambio, ignora este correo.`};
 if(process.env.MAIL_MODE==='smtp'){
  if(!process.env.SMTP_HOST||!process.env.SMTP_FROM||!process.env.SMTP_USER||!process.env.SMTP_PASSWORD)throw Error('Configuración SMTP incompleta');
  const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT??587),secure:process.env.SMTP_SECURE==='true',requireTLS:process.env.SMTP_SECURE!=='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD},connectionTimeout:10000,socketTimeout:15000});
  await transport.sendMail(message);return;
 }
 if(process.env.NODE_ENV==='production')throw Error('Configura MAIL_MODE=smtp para enviar recuperación en producción');
 const dir=path.resolve(process.env.STORAGE_DIR??'storage','mailbox');await mkdir(dir,{recursive:true});await writeFile(path.join(dir,randomUUID()+'.txt'),`Destinatario: ${email}\n${message.text}\n`,{mode:0o600});
}
