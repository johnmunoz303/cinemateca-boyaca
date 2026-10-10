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
    return (<>
            <div className="filters">
              {["Todos", "presencial", "virtual", "convocatoria"].map((t) => (<button key={t} className={genre === t ? "selected" : ""} onClick={() => setGenre(t)}>
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
            .filter((e) => genre === "Todos" || genre === e.categoria)
            .map((e) => (<button className="event-row" key={e.id} onClick={() => setDetail({ ...e, kind: "evento" })}>
                    <img src={e.imagen} alt=""/>
                    <div>
                      <h2>{e.titulo}</h2>
                      <p>{e.descripcion}</p>
                      <small>
                        {date(e.inicio)} · {e.direccion}
                      </small>
                      <span className="tag">{e.categoria}</span>
                    </div>
                  </button>))}
            </div>
          </>);
}
