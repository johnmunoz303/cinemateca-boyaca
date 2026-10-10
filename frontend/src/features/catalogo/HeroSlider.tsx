"use client";
import {useEffect, useState} from "react";
import {ChevronLeft, ChevronRight, Info} from "lucide-react";
import type {Row} from "@/lib/types";

export default function HeroSlider({works, openWork}: {works: Row[]; openWork: (work: Row) => void}) {
  const [index, setIndex] = useState(0);
  const slides = works.filter(work => work.destacada_inicio).sort((a, b) => a.orden_destacada - b.orden_destacada || a.id - b.id).slice(0, 5);
  const slideKey = slides.map(slide => slide.id).join(',');
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(value => (value + 1) % slides.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [slideKey, slides.length, index]);
  if (!slides.length) return null;
  const current = index % slides.length;
  const work = slides[current];
  return <section className="catalog-hero" aria-label="Obras destacadas" aria-roledescription="carrusel">
    <img key={work.id} className="catalog-hero-image" src={work.poster || "/posters/default.svg"} alt={"Cartel de " + work.titulo} />
    <div className="catalog-hero-info" aria-live="off">
      <p className="eyebrow">CINEMATECA · SELECCIÓN DESTACADA</p>
      <h2>{work.titulo}</h2>
      <p className="catalog-hero-meta">{[work.anio, work.duracion ? `${work.duracion} min` : null, work.clasificacion].filter(Boolean).join(" · ")}</p>
      <p className="catalog-hero-synopsis">{work.sinopsis}</p>
      <button className="primary" onClick={() => openWork(work)}><Info size={18} aria-hidden="true" /> Más información</button>
    </div>
    {slides.length > 1 && <div className="catalog-hero-controls">
      <button className="hero-previous" aria-label="Obra anterior" onClick={() => setIndex((current + slides.length - 1) % slides.length)}><ChevronLeft size={20} /></button>
      <div className="catalog-hero-dots">{slides.map((slide, position) => <button key={slide.id} aria-label={`Mostrar ${slide.titulo}`} aria-pressed={position === current} className={position === current ? "active" : ""} onClick={() => setIndex(position)} />)}</div>
      <button className="hero-next" aria-label="Obra siguiente" onClick={() => setIndex((current + 1) % slides.length)}><ChevronRight size={20} /></button>
    </div>}
  </section>;
}
