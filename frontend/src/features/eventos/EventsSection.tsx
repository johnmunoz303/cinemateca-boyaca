"use client";
import { date } from "@/lib/client";
import type { Row } from "@/lib/types";
type Props = {
    genre: string;
    setGenre: (value: string) => void;
    data: Row[];
    setDetail: (value: Row | null) => void;
};
export default function EventsSection({ genre, setGenre, data, setDetail }: Props) {
    const selected = ["presencial", "virtual", "convocatoria"].includes(genre) ? genre : "presencial";
    return (<>
            <div className="filters">
              {["presencial", "virtual", "convocatoria"].map((t) => (<button key={t} className={selected === t ? "selected" : ""} onClick={() => setGenre(t)}>
                  {t === "Todos"
                ? "Todos"
                : t === "convocatoria"
                    ? "Convocatorias"
                    : t === "virtual"
                        ? "Virtuales"
                        : "Presenciales"}
                </button>))}
            </div>
            <div className="event-list">
              {data
            .filter((e) => selected === "convocatoria" || selected === e.categoria)
            .map((e) => (<button className="event-row" key={e.id} onClick={() => setDetail({ ...e, kind: "evento" })}>
                    <img src={e.imagen || "/posters/default.svg"} alt={"Imagen de " + e.titulo}/>
                    <div>
                      <h2>{e.titulo}</h2>
                      <p>{e.descripcion}</p>
                      <dl className="event-facts">
                        <div><dt>Categoría:</dt><dd>{e.tipo_evento || e.categoria}</dd></div>
                        <div><dt>Fecha:</dt><dd>{date(e.inicio)}</dd></div>
                        <div><dt>Dirección:</dt><dd>{e.direccion || "Por confirmar"}</dd></div>
                      </dl>
                    </div>
                  </button>))}
            </div>
          </>);
}
