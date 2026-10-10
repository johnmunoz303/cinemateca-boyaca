"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Row } from "@/lib/types";
export default function Aulas({ onSelect }: {
    onSelect: (r: Row) => void;
}) {
    const [rows, setRows] = useState<Row[]>([]);
    useEffect(() => {
        api("aulas").then(setRows);
    }, []);
    return (<>
      <div className="intro">
        <p className="eyebrow">ESCUELA DE CINE</p>
        <h1>Cine, audiovisuales y medios interactivos</h1>
        <p>
          Un espacio para aprender a contar historias y explorar la memoria de
          nuestro territorio.
        </p>
      </div>
      <div className="content-grid">
        {rows.map((a) => (<button className="content-card" key={a.id} onClick={() => onSelect({ ...a, kind: "aula" })}>
            <img src={a.imagen} alt=""/>
            <div>
              <h2>{a.nombre}</h2>
              <p>{a.descripcion}</p>
              <small>{a.horarios}</small>
            </div>
          </button>))}
      </div>
    </>);
}
