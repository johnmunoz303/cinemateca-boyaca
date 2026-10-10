"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Row } from "@/lib/types";
import EnrollmentsPanel from "./EnrollmentsPanel";
import Subtitles from "@/features/administracion/Subtitles";
import Admission from "@/features/administracion/Admission";
import WorkMetadata from "@/features/administracion/WorkMetadata";
import RoomEditor from "@/features/administracion/RoomEditor";
import VideoManager from "@/features/administracion/VideoManager";
import { AdminField, resourceNames, defaults } from "@/features/administracion/AdminFields";
const fieldMap: Record<string, string[]> = {
    generos: ["nombre"],
    obras: [
        "titulo",
        "sinopsis",
        "anio",
        "clasificacion",
        "tipo",
        "estado_publicacion",
        "dominio_publico",
        "poster",
        "permitir_descarga",
        "fecha_ini_lic",
        "fecha_fin_lic",
    ],
    cursos: [
        "titulo",
        "descripcion",
        "categoria",
        "duracion",
        "poster",
        "estado",
        "requisitos", "involucrados", "inicio", "direccion", "latitud", "longitud",
    ],
    modulos: ["curso_id", "titulo", "ruta", "orden", "obra_id"],
    eventos: [
        "titulo",
        "descripcion",
        "categoria",
        "inicio",
        "direccion",
        "latitud",
        "longitud",
        "imagen",
        "estado",
        "cupo", "requisitos", "involucrados",
    ],
    rodante: [
        "municipio",
        "ubicacion",
        "fecha_evento",
        "descripcion",
        "obra_id",
        "latitud",
        "longitud",
    ],
    aulas: [
        "nombre",
        "descripcion",
        "horarios",
        "direccion",
        "latitud",
        "longitud",
        "imagen",
    ],
    funciones: [
        "titulo_manual",
        "descripcion",
        "sala_id",
        "inicio",
        "duracion_minutos",
        "intervalo_minutos",
        "precio",
        "estado",
    ],
    salas: ["nombre", "direccion", "latitud", "longitud"],
    roles: ["descripcion"],
    usuarios: ["nombres", "apellidos", "estado", "rol_id"],
    comentarios: ["estado"],
    legal: [
        "titulo",
        "contenido",
        "entidad",
        "fecha_documento",
        "fuente_url",
        "publicado",
    ],
    personas: ["nombre", "tipo_persona", "fecha_nac", "pais"],
};
export default function Admin({ flash, initialResource, programmer, }: {
    flash: (m: string) => void;
    initialResource: string;
    programmer: boolean;
}) {
    const [resource, setResource] = useState(initialResource), [relations, setRelations] = useState<Record<string, Row[]>>({}), [rows, setRows] = useState<Row[]>([]), [editing, setEditing] = useState<Row | null>(null), [busy, setBusy] = useState(false), [formError, setFormError] = useState("");
    async function load() {
        try {
            setRows(await api("admin/" + (resource === "entrada" ? "reportes" : resource)));
        }
        catch (e) {
            flash((e as Error).message);
        }
    }
    useEffect(() => {
        setEditing(null);
        load();
        Promise.all((programmer
            ? ["obras", "salas"]
            : ["obras", "cursos", "salas", "roles", "generos", "personas"]).map(async (r) => [r, await api("admin/" + r)]))
            .then((v) => setRelations(Object.fromEntries(v)))
            .catch((e) => flash(e.message));
    }, [resource]);
    useEffect(() => {
        if (resource !== "obras")
            return;
        const timer = setInterval(load, 5000);
        return () => clearInterval(timer);
    }, [resource]);
    return (<>
      <p className="eyebrow">ACCESO RESTRINGIDO</p>
      <h1>Administración</h1>
      <p>
        {programmer
            ? "Crea una función seleccionando la obra, la sala, la fecha y hora y el precio simulado. Con estado publicada aparecerá en Cinemateca Física para reservar asientos."
            : "Crea o edita el contenido de cada sección. Para publicar un video, primero crea la obra, carga el archivo y espera su procesamiento; luego activa su publicación."}
      </p>
      {resource === "roles" && (<p>
          Los permisos de cada rol están definidos por el sistema. Para asignar
          un rol, abre Usuarios y edita una cuenta registrada. El registro
          público siempre crea espectadores.
        </p>)}
      {resource === "usuarios" && (<p>
          Cambiar el rol o los datos de una cuenta cierra sus sesiones
          anteriores. Solo concede Administrador a una persona autorizada.
        </p>)}
      <div className="admin-tabs">
        {(programmer
            ? ["funciones"]
            : [...Object.keys(fieldMap).filter(key => key !== "comentarios"), "reportes", "entrada", "inscripciones"]).map((t) => (<button key={t} className={resource === t ? "selected" : ""} onClick={() => setResource(t)}>
            {resourceNames[t] ?? t}
          </button>))}
      </div>
      {!["roles", "usuarios", "comentarios", "reportes", "entrada", "inscripciones"].includes(resource) && (<button className="primary" onClick={() => {
                setFormError("");
                setEditing({ ...defaults[resource] });
            }}>
          Crear {resourceNames[resource]}
        </button>)}
      {["obras", "cursos", "eventos", "aulas"].includes(resource) &&
            rows.length > 0 && (<form className="upload route-card" onSubmit={async (e) => {
                e.preventDefault();
                try {
                    flash((await api("admin/imagen", "POST", new FormData(e.currentTarget))).message);
                    load();
                }
                catch (err) {
                    flash((err as Error).message);
                }
            }}>
            <h2>Cargar imagen</h2>
            <input type="hidden" name="recurso" value={resource}/>
            <label>
              Registro
              <select name="id">
                {rows.map((r) => (<option value={r.id} key={r.id}>
                    {r.titulo ?? r.nombre}
                  </option>))}
              </select>
            </label>
            <label>
              Cartel o fotografía
              <input type="file" name="file" accept="image/png,image/jpeg,image/webp" required/>
            </label>
            <button className="primary">Guardar imagen</button>
          </form>)}
      {resource === "legal" && rows.length > 0 && (<form className="upload route-card" onSubmit={async (e) => {
                e.preventDefault();
                try {
                    flash((await api("admin/documento", "POST", new FormData(e.currentTarget))).message);
                    load();
                }
                catch (err) {
                    flash((err as Error).message);
                }
            }}>
          <h2>Adjuntar documento oficial</h2>
          <label>
            Documento
            <select name="id">
              {rows.map((r) => (<option key={r.id} value={r.id}>
                  {r.titulo}
                </option>))}
            </select>
          </label>
          <label>
            PDF (m?ximo 10 MB)
            <input name="file" type="file" accept="application/pdf" required/>
          </label>
          <button className="primary">Guardar PDF</button>
        </form>)}
      {resource === "entrada" && <Admission />}
      {resource === "obras" && rows.length > 0 && (<VideoManager works={rows} refresh={load}/>)}
      {editing && resource === "salas" && (<RoomEditor key={editing.id ?? "new"} room={editing} done={() => {
                setEditing(null);
                load();
                flash("Sala y sillas guardadas");
            }} cancel={() => setEditing(null)}/>)}
      {editing && resource !== "salas" && (<form className="form route-card" onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget), b: Row = {};
                fieldMap[resource].forEach((k) => {
                    if (!f.has(k))
                        return;
                    const v = f.get(k);
                    b[k] =
                        v === "true"
                            ? true
                            : v === "false"
                                ? false
                                : ["inicio", "fecha_evento"].includes(k) && v
                                    ? new Date(String(v)).toISOString()
                                    : v;
                });
                if (resource === "obras") {
                    b.destacada_inicio = f.has("destacada_inicio");
                    b.orden_destacada = Number(f.get("orden_destacada"));
                    b.genero_ids = f.getAll("genero_ids").map(Number);
                    b.participantes = f
                        .getAll("participante_nombre")
                        .map((v, i) => ({
                        nombre: String(v),
                        rol: f.getAll("participacion_rol")[i],
                    }));
                }
                try {
                    const imageFile = ["funciones","cursos","eventos"].includes(resource) ? f.get("function_image") : null;
                    if(imageFile instanceof File && imageFile.size > 5 * 1024 * 1024)throw Error("La imagen debe pesar como máximo 5 MB");
                    const result = await api("admin/" + resource + (editing.id ? "/" + editing.id : ""), editing.id ? "PATCH" : "POST", b);
                    if(["funciones","cursos","eventos"].includes(resource) && imageFile instanceof File && imageFile.size > 0){
                        const imageForm = new FormData(); imageForm.set("recurso",resource); imageForm.set("id",String(result.id)); imageForm.set("file",imageFile);
                        try { await api("admin/imagen","POST",imageForm); }
                        catch(error){setEditing(result);load();throw Error("El registro se guardó, pero la imagen no: "+(error as Error).message);}
                    }
                    if (result.relogin) {
                        window.location.reload();
                        return;
                    }
                    setEditing(null);
                    load();
                    flash("Registro guardado");
                }
                catch (err) {
                    setFormError((err as Error).message);
                    flash((err as Error).message);
                }
            }}>
          <h2>
            {editing.id ? "Editar" : "Crear"} {resourceNames[resource]}
          </h2>
          {resource === "obras" && (<p>
              La duración se calcula automáticamente al procesar el video
              {editing.duracion ? " · " + editing.duracion + " min" : ""}.
            </p>)}
          {formError && (<p className="error" role="alert">
              {formError}
            </p>)}
          {fieldMap[resource]
                .filter((k) => !["poster", "imagen"].includes(k))
                .map((k) => (<AdminField key={resource + "-" + (editing.id ?? "new") + "-" + k} resource={resource} field={k} editing={editing} relations={relations}/>))}
          {resource === "obras" && (<WorkMetadata key={editing.id ?? "new"} editing={editing} relations={relations}/>)}
          {["funciones","cursos","eventos"].includes(resource) && <label>Imagen o cartel (opcional, máximo 5 MB)
            {(editing.imagen || editing.poster) && <img className="function-poster-preview" src={editing.imagen || editing.poster} alt="Cartel actual de la función" />}
            <input key={editing.id ?? "new"} type="file" name="function_image" accept="image/png,image/jpeg,image/webp" />
            <small>PNG, JPEG o WebP. Deja este campo vacío para conservar la imagen actual.</small>
          </label>}
          {formError && <p className="error" role="alert">No se pudo guardar: {formError}</p>}
          <div className="actions">
            <button className="primary">Guardar</button>
            <button type="button" onClick={() => setEditing(null)}>
              Cancelar
            </button>
          </div>
        </form>)}
      {editing?.id && resource === "obras" && <Subtitles id={editing.id}/>}
      {resource === "inscripciones" && <EnrollmentsPanel rows={rows} refresh={load} />}
      <div className="table-wrap" hidden={resource === "entrada" || resource === "inscripciones"}>
        <table>
          <thead>
            <tr>
              {resource === "reportes" ? (<>
                  <th>Usuario</th>
                  <th>Obra</th>
                  <th>Fecha</th>
                  <th>Hora de ingreso</th>
                  <th>Hora de salida</th>
                  <th>Rastreo</th>
                  <th>Estado</th>
                  <th>Descargas</th>
                </>) : (<>
                  <th>ID</th>
                  <th>Registro</th>
                  <th>Estado</th>
                  {resource === "obras" && <th>Estado del video</th>}
                  <th>Acciones</th>
                </>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (<tr key={r.id}>
                {resource === "reportes" ? (<>
                    <td>
                      {r.nombres}
                      <small>{r.email}</small>
                    </td>
                    <td>{r.titulo}</td>
                    <td>
                      {new Date(r.fecha_ini).toLocaleDateString("es-CO", {
                    timeZone: "America/Bogota",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                })}
                    </td>
                    <td>
                      {new Date(r.fecha_ini).toLocaleTimeString("es-CO", {
                    timeZone: "America/Bogota",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                })}
                      <small>Hora de Colombia</small>
                    </td>
                    <td>
                      {r.fecha_fin
                    ? new Date(r.fecha_fin).toLocaleTimeString("es-CO", {
                        timeZone: "America/Bogota",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                    })
                    : r.estado === "activa"
                        ? "En reproducción"
                        : "Sin registro"}
                      {r.fecha_fin && (<small>
                          {new Date(r.fecha_fin).toLocaleDateString("es-CO", {
                        timeZone: "America/Bogota",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                        </small>)}
                    </td>
                    <td>{r.codigo_rastreo}</td>
                    <td>{r.estado}</td>
                    <td>{r.descargas}</td>
                  </>) : (<>
                    <td>{r.id}</td>
                    <td>
                      {r.titulo_manual ??
                    r.titulo ??
                    r.nombre ??
                    r.nombres ??
                    r.municipio ??
                    r.contenido}
                      <small>{r.email ?? r.direccion ?? r.permisos}</small>
                      {resource === "roles" && (<p>{r.descripcion ?? "Sin descripción"}</p>)}
                      {resource === "usuarios" && (<small>
                          Rol:{" "}
                          {relations.roles?.find((role) => role.id === r.rol_id)?.nombre}
                        </small>)}
                    </td>
                    <td>
                      {resource === "obras"
                    ? r.estado_publicacion
                        ? "Publicado"
                        : "Borrador"
                    : String(r.estado ?? "—")}
                    </td>
                    {resource === "obras" && (<td>
                        <strong>
                          {({
                        pendiente: "En espera",
                        procesando: "Procesando video...",
                        listo: "Listo para reproducir",
                        error: "Error al procesar",
                    } as Record<string, string>)[r.video_estado] ?? "Sin video"}
                        </strong>
                        <small>
                          {r.video_estado === "listo"
                        ? r.estado_publicacion
                            ? "Disponible en el catálogo"
                            : "Ya puedes activar Publicar en el catálogo desde Editar"
                        : r.video_estado === "error"
                            ? "Vuelve a subir un archivo MP4 o WebM válido"
                            : r.video_estado
                                ? (r.video_etapa ??
                                    "Se actualiza automáticamente cada 5 segundos.")
                                : "Carga un archivo para esta obra."}
                        </small>
                      </td>)}
                    <td>
                      <button onClick={() => {
                    setFormError("");
                    setEditing(r);
                }}>
                        Editar
                      </button>
                      {![
                    "roles",
                    "usuarios",
                    "comentarios",
                    "funciones",
                ].includes(resource) && (<button onClick={async () => {
                        if (!window.confirm("¿Eliminar este registro?"))
                            return;
                        try {
                            await api(`admin/${resource}/${r.id}`, "DELETE");
                            load();
                        }
                        catch (e) {
                            flash((e as Error).message);
                        }
                    }}>
                          Eliminar
                        </button>)}
                    </td>
                  </>)}
              </tr>))}
          </tbody>
        </table>
        {!rows.length && <p className="empty">No hay registros.</p>}
      </div>
    </>);
}
