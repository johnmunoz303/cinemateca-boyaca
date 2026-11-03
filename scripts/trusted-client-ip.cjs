// Precarga solo en el frontend Node. Nunca se usa una IP indicada por el navegador.
const http=require('node:http');
const {isIP}=require('node:net');
if(process.env.SERVICE==='frontend'){
 const emit=http.Server.prototype.emit;
 http.Server.prototype.emit=function(event,request,...rest){
  if(event==='request'&&request?.headers){
   delete request.headers['x-cinemateca-client-ip'];
   const raw=request.socket?.remoteAddress??'';
   const ip=raw.startsWith('::ffff:')?raw.slice(7):raw;
   if(isIP(ip))request.headers['x-cinemateca-client-ip']=ip;
  }
  return emit.call(this,event,request,...rest);
 };
}
