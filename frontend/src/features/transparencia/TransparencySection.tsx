"use client";
import { date } from "@/lib/client";
import type { Row } from "@/lib/types";
type Props = {
    data: Row[];
};
export default function TransparencySection({ data }: Props) {
    return (<>
            <h1>Transparencia</h1>
            {data.length ? (data.map((d) => (<article className="route-card" key={d.id}>
                  <h2>{d.titulo}</h2>
                  <p>
                    {d.entidad}
                    {d.fecha_documento && " ? " + date(d.fecha_documento)}
                  </p>
                  <p className="preserve">{d.contenido}</p>
                  {d.fuente_url && (<a className="primary" href={d.fuente_url} target="_blank" rel="noopener noreferrer">
                      Consultar fuente oficial
                    </a>)}
                  {d.archivo_pdf && (<a className="primary" href={"/api/v1/legal/" + d.id + "/pdf"}>
                      Descargar PDF
                    </a>)}
                </article>))) : (<p className="empty">
                Los documentos legales se publicarán cuando la Cinemateca
                suministre las versiones oficiales.
              </p>)}
          </>);
}
