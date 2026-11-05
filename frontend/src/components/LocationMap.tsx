"use client";
import { MapPin } from "lucide-react";
import type { Row } from "@/lib/types";
export default function Map({ item }: {
    item: Row;
}) {
    const address = String(item.direccion ?? item.ubicacion ?? "").trim();
    const lat = Number(item.latitud), lon = Number(item.longitud);
    const hasCoordinates = item.latitud != null && item.longitud != null &&
        String(item.latitud).trim() !== "" && String(item.longitud).trim() !== "" &&
        Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
    const destination = address ? [address, item.municipio].filter(Boolean).join(", ") : hasCoordinates ? `${lat},${lon}` : "";
    const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    if (!hasCoordinates && !address)
        return (<div className="map map-address">
        <p><MapPin size={16}/>{address || "Ubicación por confirmar"}</p>
        <p className="location-note">El mapa aparecerá cuando se registre la dirección del lugar.</p>
        {address && <a className="directions-link" href={directions} target="_blank" rel="noopener noreferrer">Consultar cómo llegar</a>}
      </div>);
    return (<div className="map">
      <iframe title={"Google Maps — " + (item.titulo ?? item.nombre ?? item.municipio ?? "Ubicación")} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen src={`https://www.google.com/maps?q=${encodeURIComponent(destination)}&z=16&hl=es&output=embed`}/>
      <p>
        <MapPin size={16}/>
        {item.direccion ?? item.ubicacion}
      </p>
      <a className="directions-link" href={directions} target="_blank" rel="noopener noreferrer">Abrir indicaciones</a>
    </div>);
}
