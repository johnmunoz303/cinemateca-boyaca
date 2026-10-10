"use client";
import { useState } from "react";
export default function Subtitles({ id }: {
    id: number;
}) {
    const [message, setMessage] = useState("");
    return (<form className="form route-card" onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            form.set("obra_id", String(id));
            try {
                const r = await fetch("/api/v1/admin/subtitulo", {
                    method: "POST",
                    body: form,
                }), b = await r.json();
                setMessage(r.ok
                    ? "Subtítulos guardados. Vuelve a abrir el video para verlos."
                    : b.error);
            }
            catch {
                setMessage("No se pudo cargar el archivo");
            }
        }}>
      <h3>Cargar subtítulos</h3>
      <label>
        Idioma
        <input name="idioma" placeholder="Español" required maxLength={50}/>
      </label>
      <label>
        Archivo WebVTT (máximo 1 MB)
        <input name="file" type="file" accept=".vtt,text/vtt" required/>
      </label>
      <button className="primary">Guardar subtítulos</button>
      <p role="status">{message}</p>
    </form>);
}
