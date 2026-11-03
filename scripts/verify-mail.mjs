import nodemailer from 'nodemailer';
try{process.loadEnvFile('.env')}catch{console.error('Falta la configuración local .env.');process.exit(1)}
const required=['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'];
const missing=required.filter(name=>!process.env[name]);
if(process.env.MAIL_MODE!=='smtp'||missing.length){console.error('Configura MAIL_MODE=smtp y los campos SMTP de .env. No publiques ese archivo.');process.exit(1)}
const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT??587),secure:process.env.SMTP_SECURE==='true',requireTLS:process.env.SMTP_SECURE!=='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD},connectionTimeout:10000,socketTimeout:15000});
try{await transport.verify();console.log('Conexión y autenticación SMTP correctas. No se envió ningún correo. Prueba después Olvidé mi contraseña para comprobar la entrega.')}catch{console.error('No se pudo validar SMTP. Revisa proveedor, puerto y credenciales en .env. No pegues claves en el chat.');process.exitCode=1}finally{transport.close()}
