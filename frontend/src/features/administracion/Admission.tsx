"use client";
import { useState } from "react";
export default function Admission() {
    const [message, setMessage] = useState("");
    return (<form className="form route-card" onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
                const r = await fetch("/api/v1/admin/ticket", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ticket: f.get("ticket"), registrar: true }),
                });
                const b = await r.json();
                setMessage(r.ok ? "Entrada registrada. Reserva: " + b.reserva : b.error);
            }
            catch {
                setMessage("No se pudo conectar");
            }
        }}>
      <h2>Control de entrada</h2>
      <p>
        Pega el código leído con el lector QR. Cada tiquete admite un ingreso.
      </p>
      <label>
        Código del tiquete
        <textarea name="ticket" required maxLength={4000}/>
      </label>
      <button className="primary">Validar y registrar ingreso</button>
      <p role="status">{message}</p>
    </form>);
}
