"use client";
import { useEffect, useState } from "react";
export default function Ticket({ value, reservationId, }: {
    value: string;
    reservationId: string;
}) {
    const [qr, setQr] = useState("");
    useEffect(() => {
        import("qrcode").then((q) => q.default.toDataURL(value)).then(setQr);
    }, [value]);
    return (<>
      <h1>Tu tiquete</h1>
      <p>Pago simulado · Cinemateca de Boyacá</p>
      {qr && <img src={qr} className="qr" alt="QR del tiquete"/>}
      <a className="primary" href={"/api/v1/taquilla/ticket/" + reservationId + "/pdf"}>
        Descargar tiquete PDF
      </a>
    </>);
}
