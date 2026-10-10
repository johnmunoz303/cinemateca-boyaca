"use client";
import { Heart } from 'lucide-react';
import type { Row } from '@/lib/types';
type Props = {
    work: Row;
    favorites: number[];
    savingFavorites: number[];
    openWork: (work: Row) => void;
    favorite: (id: number) => void;
};
export default function MovieCard({ work: w, favorites, savingFavorites, openWork, favorite }: Props) {
    return (<article className="movie" key={w.id}>
          <button className="poster-button" onClick={() => openWork(w)}>
            <img src={w.poster ?? "/posters/default.svg"} alt={"Cartel de " + w.titulo}/>
          </button>
          <button className={"heart " + (favorites.includes(w.id) ? "active" : "")} aria-label={"Favorito: " + w.titulo} aria-pressed={favorites.includes(w.id)} disabled={savingFavorites.includes(w.id)} onClick={() => favorite(w.id)}>
            <Heart fill={favorites.includes(w.id) ? "currentColor" : "none"}/>
          </button>
          <div className="movie-meta">
            <button onClick={() => openWork(w)}>{w.titulo}</button>
            <small>
              {w.duracion} min{" "}
              <span className="stars">
                {w.rating ? "★ " + w.rating : ""}
              </span>
            </small>
          </div>
        </article>);
}
