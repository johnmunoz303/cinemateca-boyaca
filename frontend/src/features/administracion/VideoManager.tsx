"use client";
import { useEffect, useRef, useState } from "react";
type Row = Record<string, any>;
export default function VideoManager({ works, refresh, }: {
    works: Row[];
    refresh: () => void;
}) {
    const [videos, setVideos] = useState<Row[]>([]), [progress, setProgress] = useState<number | null>(null), [message, setMessage] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    const request = useRef<XMLHttpRequest | null>(null);
    async function load() {
        const r = await fetch("/api/v1/admin/videos");
        const data = await r.json();
        if (r.ok)
            setVideos(data);
    }
    useEffect(() => {
        load().catch(() => { });
        const timer = setInterval(() => load().catch(() => { }), 5000);
        return () => {
            clearInterval(timer);
            request.current?.abort();
        };
    }, []);
    function upload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setMessage("");
        const f = new FormData(e.currentTarget), file = f.get("file");
        if (!(file instanceof File) ||
            !file.size ||
            file.size > 250 * 1024 * 1024) {
            setError("Selecciona un video MP4 o WebM de hasta 250 MB");
            return;
        }
        setBusy(true);
        setProgress(0);
        const xhr = new XMLHttpRequest();
        request.current = xhr;
        xhr.open("POST", "/api/v1/admin/upload");
        xhr.upload.onprogress = (p) => {
            if (p.lengthComputable)
                setProgress(Math.round((p.loaded / p.total) * 100));
        };
        xhr.onload = () => {
            setBusy(false);
            setProgress(null);
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 400)
                    throw Error(data.error);
                setMessage("Archivo recibido. El procesamiento continúa en segundo plano. Puedes seguir su estado abajo.");
                load();
                refresh();
            }
            catch (e) {
                setError((e as Error).message);
            }
        };
        xhr.onerror = () => {
            setBusy(false);
            setProgress(null);
            setError("La conexión se interrumpió. Revisa tu red y vuelve a subir el video");
        };
        xhr.onabort = () => {
            setBusy(false);
            setProgress(null);
        };
        xhr.send(f);
    }
    return (<section className="route-card upload">
      <h2>Videos: carga y procesamiento</h2>
      <p>
        Para reemplazar un video, carga otro archivo para la misma obra. El
        anterior seguirá disponible hasta que el nuevo esté listo.
      </p>
      {error && (<p className="error" role="alert">
          {error}
        </p>)}
      {message && <p role="status">{message}</p>}
      <form className="form" onSubmit={upload}>
        <label>
          Película o corto
          <select name="obra_id" required>
            {works.map((w) => (<option key={w.id} value={w.id}>
                {w.titulo}
              </option>))}
          </select>
        </label>
        <label>
          Video MP4 / WebM (máximo 250 MB)
          <input name="file" type="file" accept="video/mp4,video/webm" required disabled={busy}/>
        </label>
        {progress !== null && (<div role="status">
            <progress max={100} value={progress}/>
            <p>
              {progress < 100
                ? `Subiendo archivo: ${progress}%`
                : "Carga enviada. El servidor está comprobando el archivo..."}
            </p>
          </div>)}
        <button disabled={busy || !works.length} className="primary">
          {busy ? "Subiendo..." : "Subir o reemplazar video"}
        </button>
      </form>
      <h3>Archivos cargados</h3>
      <div className="video-list">
        {videos.map((v) => (<article className="video-record" key={v.id}>
            <div>
              <b>{v.titulo}</b>
              <small>
                Archivo #{v.id} ·{" "}
                {(Number(v.tamano_bytes) / 1024 / 1024).toFixed(1)} MB
              </small>
              <p>
                {({
                pendiente: "En espera",
                procesando: "Procesando",
                listo: "Listo para reproducir",
                error: "Error al procesar",
            } as Row)[v.estado_transcodificacion]}{" "}
                ·{" "}
                {v.estado_transcodificacion === "listo"
                ? "Procesamiento completado"
                : v.estado_transcodificacion === "error"
                    ? "No se pudo procesar el archivo"
                    : v.etapa}
              </p>
              {v.estado_transcodificacion === "error" && (<small>
                  El archivo no pudo convertirse. Comprueba que el video se abre
                  en tu equipo y sube una copia válida.
                </small>)}
            </div>
            <button type="button" disabled={v.estado_transcodificacion === "procesando"} onClick={async () => {
                if (!window.confirm("¿Eliminar este archivo de video? Su historial de reproducciones se conservará."))
                    return;
                try {
                    const r = await fetch("/api/v1/admin/videos/" + v.id, {
                        method: "DELETE",
                    }), d = await r.json();
                    if (!r.ok)
                        throw Error(d.error);
                    setMessage("Video eliminado");
                    setError("");
                    load();
                    refresh();
                }
                catch (e) {
                    setError((e as Error).message);
                }
            }}>
              Eliminar archivo
            </button>
          </article>))}
      </div>
      {!videos.length && <p>Todavía no hay archivos de video.</p>}
    </section>);
}
