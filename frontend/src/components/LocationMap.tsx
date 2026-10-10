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
    const destination = hasCoordinates ? `${lat},${lon}` :
        [address, item.municipio, "Boyacá, Colombia"].filter(Boolean).join(", ");
    const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    if (!hasCoordinates)
        return (<div className="map map-address">
        <p><MapPin size={16}/>{address || "Ubicación por confirmar"}</p>
        <p className="location-note">El mapa aparecerá cuando se registren las coordenadas del lugar.</p>
        {address && <a className="directions-link" href={directions} target="_blank" rel="noopener noreferrer">Consultar cómo llegar</a>}
      </div>);
    return (<div className="map">
      <iframe title={"Ubicación de " + (item.titulo ?? item.nombre ?? item.municipio)} loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.012},${lat - 0.008},${lon + 0.012},${lat + 0.008}&layer=mapnik&marker=${lat},${lon}`}/>
      <p>
        <MapPin size={16}/>
        {item.direccion ?? item.ubicacion}
      </p>
      <a className="directions-link" href={directions} target="_blank" rel="noopener noreferrer">Abrir indicaciones</a>
    </div>);
}
