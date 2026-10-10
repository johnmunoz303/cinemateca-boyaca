"use client";
import {useEffect, useRef} from "react";
import {ArrowLeft, Film} from "lucide-react";
export default function DetailPage({pageKey, back, children}: {pageKey: string; back: () => void; children: React.ReactNode}) {
  const backButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {window.scrollTo(0, 0);backButton.current?.focus({preventScroll:true});}, [pageKey]);
  return <div className="work-page">
    <header className="work-page-header">
      <button ref={backButton} type="button" aria-label="Volver a la sección anterior" onClick={back}><ArrowLeft /></button>
      <span><Film aria-hidden="true" /> Cinemateca</span>
      <span className="work-header-spacer" aria-hidden="true" />
    </header>
    <main className="work-page-content section-detail-page">{children}</main>
  </div>;
}
