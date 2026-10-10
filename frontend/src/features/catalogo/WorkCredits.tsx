"use client";
import {useEffect, useId, useRef} from "react";
import {ChevronDown, X} from "lucide-react";
import type {Row} from "@/lib/types";

export default function WorkCredits({work}: {work: Row}) {
  const container = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const panelId = useId();
  const labelId = useId();
  const people: Row[] = Array.isArray(work.personas) ? work.personas : [];
  const directors = people.filter(person => /director|directora|direcci[oó]n/i.test(person.rol ?? ""));
  const others = people.filter(person => !directors.includes(person));
  const genres = Array.isArray(work.generos) ? work.generos.join(", ") : "";
  function close() {
    if (container.current) container.current.open = false;
    trigger.current?.focus();
  }
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (container.current?.open && event.target instanceof Node && !container.current.contains(event.target)) {
        container.current.open = false;
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && container.current?.open) {
        event.preventDefault();
        container.current.open = false;
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <details className="work-credits" ref={container}>
      <summary id={labelId} ref={trigger} aria-controls={panelId}>
        Involucrados <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="credits-panel" id={panelId} role="region" aria-labelledby={labelId}>
        <button type="button" className="credits-close" aria-label="Cerrar ficha técnica" onClick={close}><X size={18} /></button>
        <h2>Ficha técnica</h2>
        <dl>
          <dt>Año</dt><dd>{work.anio || "No registrado"}</dd>
          <dt>Duración</dt><dd>{work.duracion ? `${work.duracion} min` : "Por confirmar"}</dd>
          <dt>Género</dt><dd>{genres || "No registrado"}</dd>
          <dt>Lugar</dt><dd>{work.lugar || work.pais || "No registrado"}</dd>
          {others.length > 0 && <><dt>Elenco y equipo</dt><dd>{others.map((person, index) => <span className="credit-person" key={index}>{person.nombre}{person.rol ? ` · ${person.rol}` : ""}</span>)}</dd></>}
        </dl>
      </div>
    </details>
  );
}
