"use client";
import { Film } from "lucide-react";
import { date, currency } from "@/lib/client";
import type { Row } from "@/lib/types";
type Props = {
    data: Row[];
    requireLogin: () => boolean;
    setDetail: (value: Row | null) => void;
    error: string;
};
export default function ShowtimesSection({ data, requireLogin, setDetail, error }: Props) {
    return (<>
            <p className="eyebrow">LA EXPERIENCIA DE LA SALA</p>
            <h1>Cartelera y reservas</h1>
            <p>
              Selecciona una función y elige tus asientos. Los pagos de este
              proyecto son simulados.
            </p>
            <div className="content-grid">
              {data.map((f) => (<article className="route-card" key={f.id}>
                  <img className="function-poster" src={f.imagen || "/posters/default.svg"} alt={"Cartel de " + f.titulo} loading="lazy" />
                  <h2>{f.titulo}</h2>
                  {f.descripcion && <p className="function-description">{f.descripcion}</p>}
                  <p>
                    {date(f.inicio)} ·{" "}
                    {new Date(f.inicio).toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
            })}
                  </p>
                  <p>
                    {f.sala} · {currency(Number(f.precio))}
                  </p>
                  <button className="primary" onClick={() => {
                if (requireLogin())
                    setDetail({ ...f, kind: "funcion" });
            }}>
                    Elegir asientos
                  </button>
                </article>))}
            </div>
            {!data.length && !error && (<p className="empty">No hay funciones programadas.</p>)}
          </>);
}
