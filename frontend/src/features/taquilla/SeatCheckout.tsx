"use client";
import { useEffect, useState } from "react";
import { api, date, currency } from "@/lib/client";
import type { Row } from "@/lib/types";
export default function Seats({ item, done, flash, }: {
    item: Row;
    done: () => void;
    flash: (m: string) => void;
}) {
    const [payConfig, setPayConfig] = useState<Row>({ mode: "simulation" }), [payForm, setPayForm] = useState<Row | null>(null);
    useEffect(() => {
        api("pagos/config")
            .then(setPayConfig)
            .catch(() => { });
    }, []);
    const [seats, setSeats] = useState<Row[]>([]), [chosen, setChosen] = useState<number[]>([]), [reserve, setReserve] = useState<Row | null>(null), [ticket, setTicket] = useState<Row | null>(null), [remaining, setRemaining] = useState(600), [busy, setBusy] = useState(false);
    useEffect(() => {
        const load = () => api(`funciones/${item.id}/asientos`)
            .then(setSeats)
            .catch((e) => flash(e.message));
        load();
        const timer = setInterval(load, 5000);
        return () => clearInterval(timer);
    }, [item.id]);
    useEffect(() => {
        if (!reserve)
            return;
        const t = setInterval(() => setRemaining(Math.max(0, Math.floor((new Date(reserve.expiracion).getTime() - Date.now()) / 1000))), 1000);
        return () => clearInterval(t);
    }, [reserve]);
    useEffect(() => {
        if (!reserve || payConfig.mode === "simulation")
            return;
        const t = setInterval(() => api("taquilla/ticket/" + reserve.id)
            .then((r) => {
            if (r.estado === "confirmada")
                setTicket(r);
        })
            .catch(() => { }), 3000);
        return () => clearInterval(t);
    }, [reserve, payConfig.mode]);
    if (ticket)
        return (<>
        <h1>Reserva confirmada</h1>
        <p>Pago de pruebas · sin cobro real</p>
        <img src={ticket.qr} alt="Código QR del tiquete" className="qr"/>
        <a className="primary" href={"/api/v1/taquilla/ticket/" + reserve?.id + "/pdf"}>
          Descargar tiquete PDF
        </a>
      </>);
    return (<>
      <h1>{item.titulo}</h1>
      {item.imagen && <img className="detail-image" src={item.imagen} alt={"Cartel de " + item.titulo} />}
      {item.descripcion && <p className="detail-description">{item.descripcion}</p>}
      <p>
        {date(item.inicio)} · {item.sala}
      </p>
      <div className="screen">PANTALLA</div>
      <div className="seat-map-scroll">
        {[...new Set(seats.map((s) => s.fila))].map((row) => (<div className="seat-row" key={row} style={{
                gridTemplateColumns: "repeat(" +
                    ((seats[0]?.columnas ?? 8) + (seats[0]?.pasillo ? 1 : 0)) +
                    ",36px)",
            }}>
            {seats
                .filter((s) => s.fila === row)
                .map((s) => (<button key={s.id} style={{
                    gridColumn: s.numero + (s.pasillo && s.numero > s.pasillo ? 1 : 0),
                }} aria-label={s.fila + s.numero + ": " + s.estado} disabled={!!reserve || s.estado !== "disponible"} className={"seat " +
                    s.estado +
                    (chosen.includes(s.id) ? " picked" : "")} onClick={() => setChosen(chosen.includes(s.id)
                    ? chosen.filter((x) => x !== s.id)
                    : chosen.length < 8
                        ? [...chosen, s.id]
                        : chosen)}>
                  {s.fila}
                  {s.numero}
                </button>))}
          </div>))}
      </div>
      <div className="legend">
        <span>🟢 Disponible</span>
        <span>🔵 Seleccionado</span>
        <span>🟠 Bloqueado</span>
        <span>⚪ Ocupado</span>
      </div>
      <p>
        Sillas:{" "}
        {chosen
            .map((id) => {
            const s = seats.find((s) => s.id === id);
            return s ? s.fila + s.numero : "";
        })
            .join(", ") || "Ninguna seleccionada"}
      </p>
      <p>
        Total: {currency(reserve?.total ?? chosen.length * Number(item.precio))}
      </p>
      {reserve ? (<>
          <p className="timer" role="status">
            Reserva: {Math.floor(remaining / 60)}:
            {String(remaining % 60).padStart(2, "0")}
          </p>
          <button className="primary full" disabled={busy || remaining === 0} onClick={async () => {
                setBusy(true);
                try {
                    if (payConfig.mode === "payu_sandbox")
                        setPayForm(await api("pagos/checkout", "POST", {
                            reserva_id: reserve.id,
                        }));
                    else
                        setTicket(await api("pagos/simular", "POST", {
                            reserva_id: reserve.id,
                        }));
                    await done();
                }
                catch (e) {
                    flash((e as Error).message);
                }
                finally {
                    setBusy(false);
                }
            }}>
            {payConfig.mode === "payu_sandbox"
                ? "Preparar pago PayU de pruebas"
                : "Confirmar pago simulado"}
          </button>
          {remaining === 0 && (<p role="alert">
              La reserva venció. Cierra esta ventana y selecciona las sillas
              nuevamente.
            </p>)}
          {payForm && (<form method="post" action={payForm.action} target="_blank">
              {Object.entries(payForm.fields).map(([k, v]) => (<input key={k} name={k} value={String(v)} type="hidden"/>))}
              <button className="primary">Continuar a PayU sandbox</button>
              <p>El tiquete aparece cuando PayU confirma el pago.</p>
            </form>)}
        </>) : (<button className="primary full" disabled={!chosen.length || busy} onClick={async () => {
                setBusy(true);
                try {
                    setReserve(await api("taquilla/reservar", "POST", {
                        funcion_id: item.id,
                        asientos: chosen,
                    }));
                    await done();
                }
                catch (e) {
                    flash((e as Error).message);
                    setChosen([]);
                    setSeats(await api(`funciones/${item.id}/asientos`));
                }
                finally {
                    setBusy(false);
                }
            }}>
          Reservar por 10 minutos
        </button>)}
    </>);
}
