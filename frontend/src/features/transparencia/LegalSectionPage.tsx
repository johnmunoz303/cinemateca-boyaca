"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "@/lib/client";
import type { Row } from "@/lib/types";
import { LegalDocument } from "./TransparencySection";
import styles from "./TransparencySection.module.css";

export default function LegalSectionPage({ slug, title }: { slug: string; title: string }) {
  const [documents, setDocuments] = useState<Row[]>([]);
  const [admin, setAdmin] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load(manage: boolean) {
    const rows: Row[] = await api(manage ? "admin/legal" : "legal");
    setDocuments(rows.filter(row => (row.seccion ?? "institucionales") === slug));
  }

  useEffect(() => {
    async function start() {
      try {
        const session = await api("me").catch(() => null);
        const manage = session?.user?.rol === "administrador";
        setAdmin(manage);
        await load(manage);
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        setLoading(false);
      }
    }
    void start();
  }, [slug]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const id = editing?.id;
      const record = await api(id ? "admin/legal/" + id : "admin/legal", id ? "PATCH" : "POST", {
        seccion: slug,
        titulo: form.get("titulo"),
        contenido: form.get("contenido"),
        entidad: form.get("entidad") || null,
        fecha_documento: form.get("fecha_documento") || null,
        fuente_url: form.get("fuente_url") || null,
        publicado: form.has("publicado"),
      });
      if (!id) setEditing(record);
      const file = form.get("file");
      if (file instanceof File && file.size) {
        const upload = new FormData();
        upload.set("id", String(id ?? record.id));
        upload.set("file", file);
        await api("admin/documento", "POST", upload);
      }
      setEditing(null);
      setMessage("Documento guardado.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      await load(true).catch(() => {});
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("¿Eliminar este documento?")) return;
    setBusy(true);
    try {
      await api("admin/legal/" + id, "DELETE");
      setEditing(null);
      await load(true);
      setMessage("Documento eliminado.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section}>
      <h1>{title}</h1>
      {message && <p role="status">{message}</p>}
      {admin && <button className="primary" disabled={busy} onClick={() => setEditing({})}>Crear documento</button>}
      {admin && editing && <form className="form route-card" key={editing.id ?? "new"} onSubmit={save}>
        <h2>{editing.id ? "Editar documento" : "Nuevo documento"}</h2>
        <label>Título<input name="titulo" defaultValue={editing.titulo} required /></label>
        <label>Contenido<textarea name="contenido" defaultValue={editing.contenido} required /></label>
        <label>Entidad<input name="entidad" defaultValue={editing.entidad} /></label>
        <label>Fecha<input type="date" name="fecha_documento" defaultValue={editing.fecha_documento?.slice(0, 10)} /></label>
        <label>Fuente oficial<input type="url" name="fuente_url" defaultValue={editing.fuente_url} /></label>
        <label>Adjuntar o reemplazar PDF<input name="file" type="file" accept="application/pdf" /></label>
        <label><input type="checkbox" name="publicado" defaultChecked={Boolean(editing.publicado)} /> Publicar</label>
        <button className="primary" disabled={busy}>Guardar</button>
        <button type="button" disabled={busy} onClick={() => setEditing(null)}>Cancelar</button>
      </form>}
      {loading && <p>Cargando documentos…</p>}
      {!loading && documents.length === 0 && <p className="empty">Aún no hay documentos en esta sección.</p>}
      {documents.map(document => <div key={document.id}>
        <LegalDocument document={document.publicado ? document : { ...document, archivo_pdf: null }} />
        {admin && <div className="actions">
          <span>{document.publicado ? "Publicado" : "Borrador"}</span>
          <button disabled={busy} onClick={() => setEditing(document)}>Editar</button>
          <button disabled={busy} onClick={() => void remove(document.id)}>Eliminar</button>
        </div>}
      </div>)}
    </section>
  );
}
