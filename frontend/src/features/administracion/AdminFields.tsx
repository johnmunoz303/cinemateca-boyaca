"use client";
type Row = Record<string, any>;
export const resourceNames: Record<string, string> = {
    inscripciones: "Inscripciones",
    entrada: "Control de entrada",
    generos: "Géneros",
    roles: "Roles y permisos",
    obras: "Películas y cortos",
    cursos: "Programas",
    modulos: "Lecciones",
    eventos: "Eventos",
    rodante: "Paradas de la Rodante",
    aulas: "Aulas",
    funciones: "Funciones y cartelera",
    salas: "Salas",
    usuarios: "Usuarios",
    comentarios: "Comentarios",
    legal: "Transparencia",
    personas: "Participantes",
    reportes: "Seguimiento de videos",
};
const labels: Record<string, string> = {
    requisitos: "Requisitos (uno por línea)",
    involucrados: "Involucrados: nombres y funciones (uno por línea)",
    clasificacion: "Clasificación de edad",
    duracion_minutos: "Duración de la función (minutos)",
    intervalo_minutos: "Preparación entre funciones (minutos)",
    titulo_manual: "Nombre de la película o corto",
    rol_id: "Rol de la cuenta",
    entidad: "Entidad emisora",
    fecha_documento: "Fecha del documento",
    fuente_url: "Enlace a la fuente oficial (opcional)",
    titulo: "Título",
    sinopsis: "Sinopsis",
    duracion: "Duración (minutos para videos)",
    anio: "Año",
    tipo: "Tipo de obra",
    estado_publicacion: "Publicar en el catálogo",
    dominio_publico: "Obra de dominio público",
    permitir_descarga: "Permitir descarga a usuarios registrados",
    fecha_ini_lic: "Inicio de licencia",
    fecha_fin_lic: "Fin de licencia",
    descripcion: "Descripción",
    categoria: "Categoría",
    estado: "Estado",
    curso_id: "Programa",
    obra_id: "Película o corto",
    sala_id: "Sala",
    inicio: "Fecha y hora",
    fecha_evento: "Fecha y hora de la parada",
    ubicacion: "Lugar de la parada",
    municipio: "Municipio",
    direccion: "Dirección o enlace para evento virtual",
    latitud: "Latitud (opcional)",
    longitud: "Longitud (opcional)",
    cupo: "Cupos (opcional)",
    precio: "Precio simulado en pesos",
    nombre: "Nombre",
    horarios: "Horarios",
    ruta: "Enlace al material (opcional)",
    orden: "Orden de la lección",
    contenido: "Contenido",
    publicado: "Publicado",
    nombres: "Nombres",
    apellidos: "Apellidos",
    tipo_persona: "Participación",
    fecha_nac: "Fecha de nacimiento",
    pais: "País",
};
export const defaults: Record<string, Row> = {
    obras: {
        tipo: "pelicula",
        estado_publicacion: false,
        dominio_publico: false,
        permitir_descarga: false,
    },
    cursos: { estado: true },
    modulos: { orden: 1 },
    eventos: { categoria: "presencial", estado: "publicado" },
    funciones: {
        estado: "publicada",
        precio: 0,
        duracion_minutos: 120,
        intervalo_minutos: 15,
    },
    legal: { publicado: false },
};
const required: Record<string, string[]> = {
    obras: ["titulo", "sinopsis", "duracion", "tipo"],
    cursos: ["titulo", "descripcion"],
    modulos: ["titulo", "curso_id"],
    eventos: ["titulo", "descripcion", "inicio", "categoria"],
    rodante: ["municipio", "ubicacion", "fecha_evento", "descripcion"],
    aulas: ["nombre", "descripcion", "direccion"],
    funciones: ["titulo_manual", "sala_id", "inicio", "precio"],
    salas: ["nombre", "direccion"],
    legal: ["titulo", "contenido"],
    personas: ["nombre"],
    usuarios: ["nombres"],
};
export function AdminField({ resource, field, editing, relations, }: {
    resource: string;
    field: string;
    editing: Row;
    relations: Record<string, Row[]>;
}) {
    const relation = {
        obra_id: "obras",
        curso_id: "cursos",
        sala_id: "salas",
        rol_id: "roles",
    }[field as "obra_id" | "curso_id" | "sala_id" | "rol_id"];
    const options = field === "clasificacion"
        ? ["Todos", "7+", "12+", "15+", "18+"]
        : field === "tipo" && resource === "obras"
            ? ["pelicula", "corto", "documental"]
            : field === "categoria" && resource === "eventos"
                ? ["presencial", "virtual", "convocatoria"]
                : field === "estado" && resource === "eventos"
                    ? ["borrador", "publicado", "cancelado"]
                    : field === "estado" && resource === "funciones"
                        ? ["publicada", "cancelada", "finalizada"]
                        : field === "estado" && resource === "comentarios"
                            ? ["pendiente", "aprobado", "rechazado"]
                            : null;
    const boolean = [
        "estado_publicacion",
        "dominio_publico",
        "permitir_descarga",
        "publicado",
    ].includes(field) ||
        (field === "estado" && ["cursos", "usuarios"].includes(resource));
    const isDate = [
        "inicio",
        "fecha_evento",
        "fecha_ini_lic",
        "fecha_fin_lic",
        "fecha_nac",
        "fecha_documento",
    ].includes(field), isTime = ["inicio", "fecha_evento"].includes(field);
    let value = editing[field] ?? defaults[resource]?.[field] ?? "";
    if (isDate && value) {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime()))
            value = isTime
                ? new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)
                : d.toISOString().slice(0, 10);
    }
    const props = {
        name: field,
        defaultValue: String(value),
        required: required[resource]?.includes(field),
    };
    return (<label>
      {resource === "funciones" && field === "descripcion" ? "Descripción breve (opcional)" : labels[field] ?? field.replaceAll("_", " ")}
      {relation ? (<select {...props}>
          <option value="">Selecciona una opción</option>
          {(relations[relation] ?? []).map((r) => (<option key={r.id} value={r.id}>
              {r.titulo ?? r.nombre}
            </option>))}
        </select>) : boolean ? (<select {...props} defaultValue={String(value || false)}>
          <option value="false">No</option>
          <option value="true">Sí</option>
        </select>) : options ? (<select {...props}>
          {options.map((o) => (<option key={o} value={o}>
              {o === "pelicula"
                    ? "Película"
                    : o === "corto"
                        ? "Corto"
                        : o === "documental"
                            ? "Documental"
                            : o}
            </option>))}
        </select>) : ["sinopsis", "descripcion", "contenido", "horarios", "requisitos", "involucrados"].includes(field) ? (<textarea {...props}/>) : (<input {...props} type={isDate
                ? isTime
                    ? "datetime-local"
                    : "date"
                : [
                    "duracion",
                    "duracion_minutos",
                    "intervalo_minutos",
                    "anio",
                    "orden",
                    "precio",
                    "cupo",
                    "latitud",
                    "longitud",
                ].includes(field) &&
                    !(field === "duracion" && resource === "cursos")
                    ? "number"
                    : "text"} step={["latitud", "longitud", "precio"].includes(field)
                ? "any"
                : undefined} min={["duracion", "orden", "cupo"].includes(field) &&
                resource !== "cursos"
                ? 1
                : field === "precio"
                    ? 0
                    : undefined}/>)}
    </label>);
}
