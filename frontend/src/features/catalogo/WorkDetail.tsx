"use client";
import {useEffect, useRef} from "react";
import {ArrowLeft, Heart, Play} from "lucide-react";
import CinematecaBrand from "@/components/CinematecaBrand";
import WorkCredits from "./WorkCredits";
import Footer from "@/components/Footer";
import type {Row} from "@/lib/types";

type Props = {work: Row; loggedIn: boolean; favorite: boolean; saving: boolean; back: () => void; home: () => void; watch: () => void; toggleFavorite: () => void; similar: React.ReactNode};
export default function WorkDetail({work, loggedIn, favorite, saving, back, home, watch, toggleFavorite, similar}: Props) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {window.scrollTo(0, 0); title.current?.focus({preventScroll:true});}, [work.id]);
  return <div className="work-page">
    <header className="work-page-header">
      <button type="button" aria-label="Volver al catálogo" onClick={back}><ArrowLeft /></button>
      <button className="work-home" type="button" onClick={home} aria-label="Ir al inicio"><CinematecaBrand /></button>
      <span className="work-header-spacer" aria-hidden="true" />
    </header>
    <main className="work-page-content">
      <div className="work-page-title"><h1 tabIndex={-1} ref={title}>{work.titulo}</h1><span>{work.idioma_ori}</span></div>
      <button className="work-preview" onClick={watch} aria-label={loggedIn ? `Reproducir ${work.titulo}` : `Inicia sesión para reproducir ${work.titulo}`}>
        <img src={work.poster || "/posters/default.svg"} alt={"Cartel de " + work.titulo} />
        <span className="work-play"><Play fill="currentColor" aria-hidden="true" /></span>
      </button>
      <div className="work-detail-tools">
        <span>Género: {work.generos?.join(", ") || "No registrado"}</span>
        <WorkCredits key={work.id} work={work} />
        <button className={"work-favorite" + (favorite ? " active" : "")} aria-label={favorite ? "Quitar de Mis favoritos" : "Guardar en Mis favoritos"} aria-pressed={favorite} disabled={saving} onClick={toggleFavorite}><Heart fill={favorite ? "currentColor" : "none"} /></button>
      </div>
      <section className="work-synopsis"><h2>Sinopsis</h2><p>{work.sinopsis}</p></section>
      <section className="work-similar"><h2>Similares</h2>{similar}</section>
    </main>
    <Footer />
  </div>;
}
