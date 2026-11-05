"use client";
import {useEffect, useRef} from "react";
import Footer from "./Footer";
import {ArrowLeft} from "lucide-react";
import CinematecaBrand from "./CinematecaBrand";
export default function DetailPage({pageKey, back, home, children}: {pageKey: string; back: () => void; home: () => void; children: React.ReactNode}) {
  const backButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {window.scrollTo(0, 0);backButton.current?.focus({preventScroll:true});}, [pageKey]);
  return <div className="work-page">
    <header className="work-page-header">
      <button ref={backButton} type="button" aria-label="Volver a la sección anterior" onClick={back}><ArrowLeft /></button>
      <button className="work-home" type="button" onClick={home} aria-label="Ir al inicio"><CinematecaBrand /></button>
      <span className="work-header-spacer" aria-hidden="true" />
    </header>
    <main className="work-page-content section-detail-page">{children}</main>
    <Footer />
  </div>;
}
