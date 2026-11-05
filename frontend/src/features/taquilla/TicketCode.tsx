"use client";
import {useId,useRef,useState} from "react";
export default function TicketCode({value}:{value:string}){
 const id=useId(),field=useRef<HTMLTextAreaElement>(null),[message,setMessage]=useState("");
 return <details className="ticket-code"><summary>Código para control de entrada</summary><p>El personal autorizado puede pegar este código en Control de entrada. Corresponde a todas las sillas de esta reserva.</p><label htmlFor={id}>Código del tiquete</label><textarea id={id} ref={field} readOnly value={value} rows={3}/><button type="button" onClick={async()=>{try{if(!navigator.clipboard)throw Error();await navigator.clipboard.writeText(value);setMessage("Código copiado")}catch{field.current?.focus();field.current?.select();setMessage("Código seleccionado: cópialo con Ctrl+C o con la opción Copiar del celular.")}}}>Copiar código</button><span role="status">{message}</span></details>;
}
