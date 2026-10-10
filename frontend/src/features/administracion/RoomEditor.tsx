"use client";
import { useEffect, useState } from "react";
type Row = Record<string, any>;
export default function RoomEditor({ room, done, cancel, }: {
    room: Row;
    done: () => void;
    cancel: () => void;
}) {
    const [rows, setRows] = useState(room.filas ?? 6), [cols, setCols] = useState(room.columnas ?? 8), [aisle, setAisle] = useState(room.pasillo ?? 0), [blocked, setBlocked] = useState<string[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    useEffect(() => {
        if (!room.id)
            return;
        fetch("/api/v1/admin/salas/" + room.id + "/asientos")
            .then((r) => r.json())
            .then((seats) => {
            if (Array.isArray(seats))
                setBlocked(seats.filter((s) => !s.habilitado).map((s) => s.fila + s.numero));
        })
            .catch(() => setError("No se pudo cargar la distribución"));
    }, [room.id]);
    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        setError("");
        const form = new FormData(e.currentTarget);
        try {
            const r = await fetch("/api/v1/admin/salas" + (room.id ? "/" + room.id : ""), {
                method: room.id ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...Object.fromEntries(form),
                    filas: rows,
                    columnas: cols,
                    pasillo: aisle,
                    inhabilitados: blocked,
                }),
            });
            const data = await r.json();
            if (!r.ok)
                throw Error(data.error);
            done();
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return (<form className="form route-card" onSubmit={submit}>
      <h2>{room.id ? "Editar sala" : "Crear sala y sillas"}</h2>
      {error && (<p className="error" role="alert">
          {error}
        </p>)}
      <label>
        Nombre
        <input name="nombre" defaultValue={room.nombre ?? ""} maxLength={100} required/>
      </label>
      <label>
        Dirección
        <input name="direccion" defaultValue={room.direccion ?? ""} required/>
      </label>
      <div className="form-columns">
        <label>
          Filas (1 a 26)
          <input type="number" min={1} max={26} value={rows} onChange={(e) => setRows(Math.min(26, Math.max(1, Number(e.target.value))))} required/>
        </label>
        <label>
          Sillas por fila (1 a 20)
          <input type="number" min={1} max={20} value={cols} onChange={(e) => {
            const n = Math.min(20, Math.max(1, Number(e.target.value)));
            setCols(n);
            if (aisle >= n)
                setAisle(0);
        }} required/>
        </label>
      </div>
      <label>
        Pasillo después de la silla
        <select value={aisle} onChange={(e) => setAisle(Number(e.target.value))}>
          <option value={0}>Sin pasillo</option>
          {Array.from({ length: cols - 1 }, (_, i) => (<option key={i} value={i + 1}>
              {i + 1}
            </option>))}
        </select>
      </label>
      <p>
        Haz clic en una posición para habilitar o inhabilitar una silla. Verde
        significa disponible; gris significa inhabilitada.
      </p>
      <div className="seat-map-scroll">
        <div className="screen">PANTALLA</div>
        {Array.from({ length: rows }, (_, r) => (<div className="seat-row" key={r} style={{
                gridTemplateColumns: `repeat(${cols + (aisle ? 1 : 0)},36px)`,
            }}>
            {Array.from({ length: cols }, (_, c) => {
                const name = String.fromCharCode(65 + r) + (c + 1);
                return (<button type="button" className={"seat " +
                        (blocked.includes(name) ? "inhabilitado" : "disponible")} style={{ gridColumn: c + 1 + (aisle && c >= aisle ? 1 : 0) }} aria-label={name +
                        ": " +
                        (blocked.includes(name) ? "inhabilitada" : "habilitada")} aria-pressed={blocked.includes(name)} key={name} onClick={() => setBlocked(blocked.includes(name)
                        ? blocked.filter((b) => b !== name)
                        : [...blocked, name])}>
                  {name}
                </button>);
            })}
          </div>))}
      </div>
      <p>
        {rows * cols -
            blocked.filter((b) => b.charCodeAt(0) - 65 < rows && Number(b.slice(1)) <= cols).length}{" "}
        sillas habilitadas
      </p>
      <div className="form-columns">
        <label>
          Latitud (opcional)
          <input name="latitud" type="number" min={-90} max={90} step="any" defaultValue={room.latitud ?? ""}/>
        </label>
        <label>
          Longitud (opcional)
          <input name="longitud" type="number" min={-180} max={180} step="any" defaultValue={room.longitud ?? ""}/>
        </label>
      </div>
      <div className="actions">
        <button disabled={busy} className="primary">
          {busy ? "Guardando..." : "Guardar sala y distribución"}
        </button>
        <button type="button" onClick={cancel}>
          Cancelar
        </button>
      </div>
    </form>);
}
