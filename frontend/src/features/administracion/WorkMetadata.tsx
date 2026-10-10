"use client";
import { useState } from "react";
export default function WorkMetadata({ editing, relations, }: {
    editing: Record<string, any>;
    relations: Record<string, any[]>;
}) {
    const [people, setPeople] = useState<{
        nombre: string;
        rol: string;
    }[]>((editing.participantes ?? []).map((p: any) => ({
        nombre: p.nombre ??
            relations.personas?.find((x) => x.id === p.persona_id)?.nombre ??
            "",
        rol: p.rol,
    })));
    return (<fieldset className="work-metadata">
      <legend>Géneros y ficha artística</legend>
      <label className="genre-check"><input type="checkbox" name="destacada_inicio" defaultChecked={editing.destacada_inicio ?? false} /> Destacar en el inicio</label>
      <label>Orden en el slider (1 aparece primero)<input type="number" name="orden_destacada" min={1} max={999} step={1} required defaultValue={editing.orden_destacada ?? 1} /></label>
      <small>Solo las películas publicadas con video listo aparecen en el slider. Se muestran hasta cinco, según este orden.</small>
      <p>
        País: <strong>Colombia</strong>
      </p>
      <p>
        Escribe los nombres reales del director y del elenco. Puedes registrar
        géneros desde su pestaña administrativa.
      </p>
      <div>
        {(relations.generos ?? []).map((g) => (<label className="genre-check" key={g.id}>
            <input type="checkbox" name="genero_ids" value={g.id} defaultChecked={(editing.genero_ids ?? []).includes(g.id)}/>
            {g.nombre.replace("Animaci?n", "Animación")}
          </label>))}
      </div>
      <h3>Director y elenco</h3>
      {people.map((p, i) => (<div key={i} className="form">
          <label>
            Nombre del participante
            <input name="participante_nombre" required maxLength={150} placeholder="Nombre del director, actriz o actor" value={p.nombre} onChange={(e) => setPeople(people.map((v, j) => j === i ? { ...v, nombre: e.target.value } : v))}/>
          </label>
          <label>
            Función en la obra
            <input name="participacion_rol" required maxLength={50} placeholder="Director, actriz, actor…" value={p.rol} onChange={(e) => setPeople(people.map((v, j) => j === i ? { ...v, rol: e.target.value } : v))}/>
          </label>
          <button type="button" onClick={() => setPeople(people.filter((_, j) => j !== i))}>
            Quitar participante
          </button>
        </div>))}
      <button type="button" onClick={() => setPeople([...people, { nombre: "", rol: "" }])}>
        Añadir participante
      </button>
    </fieldset>);
}
