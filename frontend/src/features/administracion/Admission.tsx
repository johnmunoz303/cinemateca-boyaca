"use client";
import { useState } from "react";
import { api } from "@/lib/client";
export default function Admission() {
    const [message, setMessage] = useState("");
    const [busy,setBusy]=useState(false),[valid,setValid]=useState(false);
    return (<form className="form route-card" onSubmit={async (e) => {
            e.preventDefault();
            if(busy)return;
            setBusy(true);setMessage("");setValid(false);
            const f = new FormData(e.currentTarget);
            try {
                await api("admin/ticket","POST",{ticket:String(f.get("ticket")||"").trim(),registrar:true});
                setValid(true);setMessage("Ingreso registrado correctamente. Este tiquete ya no puede volver a utilizarse.");
            }
            catch (error) {
                setMessage((error as Error).message);
            }
            finally {setBusy(false);}
        }}>
      <h2>Control de entrada</h2>
      <p>
        Pega el contenido del QR o el código de control mostrado en el tiquete. Cada reserva admite una sola validación, aunque incluya varias sillas.
      </p>
      <label>
        Código del tiquete
        <textarea name="ticket" required maxLength={4000}/>
      </label>
      <button className="primary" disabled={busy}>{busy ? "Validando…" : "Validar y registrar ingreso"}</button>
      {message&&<p role="status" className={valid?"admission-success":"error"}>{message}</p>}
    </form>);
}
