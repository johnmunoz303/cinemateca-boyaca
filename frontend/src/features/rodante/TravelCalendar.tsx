"use client";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { date } from "@/lib/client";
import type { Row } from "@/lib/types";
type Props = {
    setMonth: (value: Date) => void;
    month: Date;
    data: Row[];
    setDetail: (value: Row | null) => void;
};
export default function TravelCalendar({ setMonth, month, data, setDetail }: Props) {
    return (<>
            <p className="eyebrow">EL CINE RECORRE BOYACÁ</p>
            <h1>Cinemateca Rodante</h1>
            <div className="calendar-heading">
              <button aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                <ChevronLeft />
              </button>
              <h2>
                {month.toLocaleDateString("es-CO", {
            month: "long",
            year: "numeric",
        })}
              </h2>
              <button aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                <ChevronRight />
              </button>
            </div>
            <div className="calendar">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (<b key={i}>{d}</b>))}
              {Array.from({
            length: (new Date(month.getFullYear(), month.getMonth(), 1).getDay() +
                6) %
                7,
        }, (_, i) => (<span key={"gap" + i}/>))}
              {Array.from({
            length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
        }, (_, i) => {
            const routes = data.filter((r) => {
                const d = new Date(r.fecha_evento);
                return (d.getDate() === i + 1 &&
                    d.getMonth() === month.getMonth() &&
                    d.getFullYear() === month.getFullYear());
            });
            return (<div key={i} className={routes.length ? "has-event" : ""}>
                      <strong>{i + 1}</strong>
                      {routes.map((r) => (<button key={r.id} onClick={() => setDetail({ ...r, kind: "ruta" })}>
                          {r.municipio}
                        </button>))}
                    </div>);
        })}
            </div>
            <h2 className="strip-title">Próximas paradas</h2>
            <div className="content-grid">
              {data.map((r) => (<button className="route-card" key={r.id} onClick={() => setDetail({ ...r, kind: "ruta" })}>
                  <MapPin />
                  <h2>{r.municipio}</h2>
                  <p>{date(r.fecha_evento)}</p>
                  <p>{r.obra_titulo}</p>
                  <small>{r.descripcion}</small>
                </button>))}
            </div>
          </>);
}
