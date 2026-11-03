import type {NextRequest} from 'next/server';
import {fail} from '@/modules/auth/auth.service';

export async function limitedForm(req:NextRequest,maxBytes:number){
 const total=maxBytes+64*1024;
 const length=req.headers.get('content-length');
 if(length&&Number(length)>total)fail(413,'El archivo supera el tamaño permitido');
 if(!req.body)fail(400,'Archivo requerido');
 const type=req.headers.get('content-type')??'';
 if(!type.startsWith('multipart/form-data;'))fail(400,'Formulario de archivo no válido');
 let bytes=0;
 const stream=req.body.pipeThrough(new TransformStream({transform(chunk,controller){bytes+=chunk.byteLength;if(bytes>total)fail(413,'El archivo supera el tamaño permitido');controller.enqueue(chunk)}}));
 try{return await new Response(stream,{headers:{'Content-Type':type}}).formData()}
 catch(error){if(bytes>total)fail(413,'El archivo supera el tamaño permitido');throw error}
}
