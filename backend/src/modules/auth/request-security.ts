import {isIP} from 'node:net';
import type {NextRequest} from 'next/server';
import {digest} from './security.mjs';
import {limit,user} from './auth.service';

export function clientIp(req:NextRequest){
  // El servidor HTTP del frontend sobrescribe esta cabecera usando su socket.
  // Solo se confía en ella cuando el backend es privado y se configura explícitamente.
  if(process.env.TRUST_FRONTEND_IP==='true'){
    const raw=(req.headers.get('x-cinemateca-client-ip')??'').trim();
    const ip=raw.startsWith('::ffff:')?raw.slice(7):raw;
    if(isIP(ip))return ip;
  }
  return '127.0.0.1';
}
export async function limitWrites(req:NextRequest){
  const ip=digest(clientIp(req));
  let actor=null;
  try{actor=await user(req,false)}catch{}
  // Un fallo de otro usuario no consume la cuota de la sesión autenticada.
  await limit(actor?'write:user:'+actor.id:'write:anonymous:'+ip,actor?300:120);
  if(req.nextUrl.pathname.startsWith('/api/v1/auth/'))await limit('auth:ip:'+ip,60);
}
