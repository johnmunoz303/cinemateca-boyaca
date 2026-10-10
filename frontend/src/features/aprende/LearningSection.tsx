"use client";
import { api } from "@/lib/client";
import type { Row } from "@/lib/types";
import Aulas from "@/features/aprende/Aulas";
type Props = {
    subtab: string;
    setSubtab: (value: string) => void;
    data: Row[];
    setDetail: (value: Row | null) => void;
};
export default function LearningSection({ subtab, setSubtab, data, setDetail }: Props) {
    return (<>
            <div className="filters">
              <button className={subtab === "Aulas" ? "selected" : ""} onClick={() => setSubtab("Aulas")}>
                Aulas
              </button>
              <button className={subtab === "Programas" ? "selected" : ""} onClick={() => setSubtab("Programas")}>
                Programas
              </button>
            </div>
            {subtab === "Programas" ? (<>
                <div className="intro">
                  <p className="eyebrow">APRENDE Y CREA</p>
                  <h1>Programas de formación</h1>
                  <p>Encuentra tu espacio en el mundo audiovisual.</p>
                </div>
                <div className="content-grid">
                  {data.map((c) => (<article className="content-card" key={c.id}>
                      <img src={c.poster} alt=""/>
                      <div>
                        <h2>{c.titulo}</h2>
                        <p>{c.descripcion}</p>
                        <small>
                          Categoría: {c.categoria}
                          <br />
                          Duración: {c.duracion}
                        </small>
                        <button className="primary full" onClick={async () => {
                    setDetail({
                        ...c,
                        kind: "curso",
                        modulos: await api("cursos/" + c.id),
                    });
                }}>
                          Información e inscripción
                        </button>
                      </div>
                    </article>))}
                </div>
              </>) : (<Aulas onSelect={setDetail}/>)}
          </>);
}
