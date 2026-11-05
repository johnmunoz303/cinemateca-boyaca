"use client";

import { Scale } from "lucide-react";
import { date } from "@/lib/client";
import type { Row } from "@/lib/types";
import styles from "./TransparencySection.module.css";

function LegalDocument({ document, featured = false }: { document: Row; featured?: boolean }) {
    return (
        <article className={featured ? styles.featured : "route-card"}>
            {featured && (
                <>
                    <p className={styles.label}>Ordenanza</p>
                    <div className={styles.illustration} aria-hidden="true">
                        <Scale size={108} strokeWidth={1.3} />
                    </div>
                </>
            )}
            <h2>{document.titulo}</h2>
            {(document.entidad || document.fecha_documento) && (
                <p className={styles.metadata}>
                    {[document.entidad, document.fecha_documento && date(document.fecha_documento)].filter(Boolean).join(" · ")}
                </p>
            )}
            <p className="preserve">{document.contenido}</p>
            {(document.archivo_pdf || document.fuente_url) && (
                <div className={styles.actions}>
                    {document.archivo_pdf && (
                        <a className="primary" href={"/api/v1/legal/" + document.id + "/pdf"}>Descargar PDF</a>
                    )}
                    {document.fuente_url && (
                        <a className="primary" href={document.fuente_url} target="_blank" rel="noopener noreferrer">
                            Consultar fuente oficial
                        </a>
                    )}
                </div>
            )}
        </article>
    );
}

export default function TransparencySection({ data }: { data: Row[] }) {
    const ordinance = data.find(document => /ordenanza/i.test(document.titulo));
    const otherDocuments = data.filter(document => document !== ordinance);

    return (
        <section className={styles.section}>
            <h1>Transparencia</h1>
            {ordinance && <LegalDocument document={ordinance} featured />}
            <h2 className={styles.heading}>Documentos</h2>
            {otherDocuments.map(document => <LegalDocument key={document.id} document={document} />)}
            {!otherDocuments.length && (
                <p className="empty">{ordinance ? "Aún no hay otros documentos publicados." : "Aún no hay documentos oficiales publicados."}</p>
            )}
        </section>
    );
}
