export function CinematecaMark({size = 28}: {size?: number}) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10V3h7M18 3h7v7M25 18v7h-7M10 25H3v-7" />
    <path d="M3 15h5l6-6 6 6h5M10 20h8" />
  </svg>;
}
export default function CinematecaBrand() {
  return <span className="cinemateca-brand"><CinematecaMark /><span>Cinemateca</span></span>;
}
