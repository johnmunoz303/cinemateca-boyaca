"use client";
import HeroSlider from "./HeroSlider";
import type { Row } from "@/lib/types";
type Props = {
    openWork: (work: Row) => void;
    section: string;
    me: Row;
    setAuth: (value: string | null) => void;
    genre: string;
    setGenre: (value: string) => void;
    query: string;
    setQuery: (value: string) => void;
    cards: (works: Row[], horizontal?: boolean) => React.ReactNode;
    visible: Row[];
    error: string;
    allWorks: Row[];
};
export default function CatalogSection({ openWork, section, me, setAuth, genre, setGenre, query, setQuery, cards, visible, error, allWorks }: Props) {
    return (<>
              <div className="section-top">
                <h1>
                  {section === "Películas"
            ? "Historias de nuestro territorio"
            : section}
                </h1>
                {section === "Mis favoritos" && !me.user && (<button className="primary" onClick={() => setAuth("login")}>
                    Iniciar sesión
                  </button>)}
              </div>
              {section === "Películas" && <HeroSlider works={visible.filter(work => work.tipo === "pelicula")} openWork={openWork} />}
              <div className="filters">
                {[
            "Todos",
            "Drama",
            "Animación",
            "Comedia",
            "Documental",
            "Suspenso",
        ].map((g) => (<button key={g} className={genre === g ? "selected" : ""} onClick={() => setGenre(g)}>
                    {g}
                  </button>))}
              </div>
              {section === "Buscar" && (<input autoFocus placeholder="Buscar películas, cortos y documentales" value={query} onChange={(e) => setQuery(e.target.value)}/>)}
              {cards(visible)}
              {!visible.length && !error && (<p className="empty">
                  {section === "Mis favoritos"
                ? "Aquí aparecerán las obras que marques con el corazón."
                : allWorks.length
                    ? "No encontramos obras con esos filtros."
                    : "Todavía no hay obras publicadas."}
                </p>)}
              {visible.length > 0 && (<>
                  <h2 className="strip-title">Te puede interesar</h2>
                  {cards(allWorks.filter((w) => !visible.slice(0, 2).includes(w)), true)}
                </>)}
            </>);
}
