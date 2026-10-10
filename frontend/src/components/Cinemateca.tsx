"use client";
import EnrollmentForm from "@/features/aprende/EnrollmentForm";
import DetailPage from "@/components/DetailPage";
import WorkDetail from "@/features/catalogo/WorkDetail";
import MovieCard from "@/components/MovieCard";
import Navbar from "@/components/Navbar";
import NavigationMenu from "@/components/NavigationMenu";
import CatalogSection from "@/features/catalogo/CatalogSection";
import LearningSection from "@/features/aprende/LearningSection";
import EventsSection from "@/features/eventos/EventsSection";
import TravelCalendar from "@/features/rodante/TravelCalendar";
import ShowtimesSection from "@/features/taquilla/ShowtimesSection";
import TransparencySection from "@/features/transparencia/TransparencySection";
import ProfileSection from "@/features/perfil/ProfileSection";
import Map from "@/components/LocationMap";
import Footer from "@/components/Footer";
import Auth from "@/features/auth/AuthDialog";
import Seats from "@/features/taquilla/SeatCheckout";
import Ticket from "@/features/taquilla/Ticket";
import Player from "@/features/streaming/VideoPlayer";
import Admin from "@/features/administracion/AdminPanel";
import { api, date } from "@/lib/client";
import type { Row } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { resourceNames } from "../features/administracion/AdminFields";
export default function Cinemateca() {
    const [section, setSection] = useState("Películas"), [drawer, setDrawer] = useState(false), [dark, setDark] = useState(true), [data, setData] = useState<Row[]>([]), [allWorks, setAllWorks] = useState<Row[]>([]), [me, setMe] = useState<Row>({
        user: null,
        favorites: [],
        courses: [],
        events: [],
        reservations: [],
    }), [detail, setDetail] = useState<Row | null>(null), [auth, setAuth] = useState<string | null>(null), [notice, setNotice] = useState(""), [error, setError] = useState(""), [loading, setLoading] = useState(true), [query, setQuery] = useState(""), [genre, setGenre] = useState("Todos"), [subtab, setSubtab] = useState("Programas"), [playing, setPlaying] = useState<Row | null>(null), [month, setMonth] = useState(new Date()), [editProfile, setEditProfile] = useState(false), [adminResource, setAdminResource] = useState("obras");
    const flash = (message: string) => {
        setNotice(message);
        setTimeout(() => setNotice(""), 5500);
    };
    async function refreshMe() {
        const result = await api("me");
        setMe({
            user: null,
            favorites: [],
            courses: [],
            events: [],
            reservations: [],
            ...result,
        });
    }
    useEffect(() => {
        refreshMe().catch(() => { });
        const reset = new URLSearchParams(window.location.search).get("reset");
        if (reset)
            setAuth("reset");
    }, []);
    useEffect(() => {
        document.documentElement.dataset.theme = dark ? "dark" : "light";
    }, [dark]);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        setDetail(null);
        const route = ["Películas", "Cortos", "Mis favoritos", "Buscar"].includes(section)
            ? "obras"
            : section === "Aprende"
                ? "cursos"
                : section === "Eventos"
                    ? "eventos"
                    : section === "Cinemateca Rodante"
                        ? "rodante"
                        : section === "Cinemateca Física"
                            ? "funciones"
                            : section === "Transparencia"
                                ? "legal"
                                : null;
        if (!route) {
            setLoading(false);
            return;
        }
        api(route)
            .then((result) => {
            if (active) {
                setData(result);
                if (route === "obras")
                    setAllWorks(result);
            }
        })
            .catch((e) => active && setError(e.message))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [section]);
    const navigate = (name: string) => {
        setSection(name);
        setDrawer(false);
        setQuery("");
        setGenre("Todos");
        window.scrollTo({ top: 0 });
    };
    const requireLogin = () => {
        if (!me.user) {
            setAuth("login");
            return false;
        }
        return true;
    };
    const favoriteRequests = useRef(new Set<number>());
    const [savingFavorites, setSavingFavorites] = useState<number[]>([]);
    async function favorite(oid: number) {
        if (!requireLogin() || favoriteRequests.current.has(oid))
            return;
        favoriteRequests.current.add(oid);
        setSavingFavorites((previous) => [...previous, oid]);
        const active = !me.favorites.includes(oid);
        try {
            const result = await api(`obras/${oid}/favorito`, "POST", { active });
            if (Array.isArray(result.favorites)) {
                setMe((previous) => ({ ...previous, favorites: result.favorites }));
            }
            else {
                await refreshMe();
            }
            flash(active ? "Guardado en Mis favoritos" : "Quitado de Mis favoritos");
        }
        catch (e) {
            flash((e as Error).message);
        }
        finally {
            favoriteRequests.current.delete(oid);
            setSavingFavorites((previous) => previous.filter((id) => id !== oid));
        }
    }
    async function openWork(w: Row) {
        try {
            setDetail({ ...(await api("obras/" + w.id)), kind: "obra" });
        }
        catch (e) {
            flash((e as Error).message);
        }
    }
    async function watch(oid: number) {
        if (!requireLogin())
            return;
        try {
            const info = await api("streaming/token", "POST", { obra_id: oid });
            setPlaying({ ...info, obra_id: oid });
        }
        catch (e) {
            flash((e as Error).message);
        }
    }
    const cards = (works: Row[], horizontal = false) => (<div className={horizontal ? "horizontal" : "poster-grid"}>
      {works.map((w) => (<MovieCard key={w.id} work={w} favorites={me.favorites} savingFavorites={savingFavorites} openWork={openWork} favorite={favorite}/>))}
    </div>);
    const visible = allWorks.filter((w) => (section !== "Cortos" || w.tipo === "corto") &&
        (section !== "Películas" || w.tipo !== "corto") &&
        (section !== "Mis favoritos" || me.favorites.includes(w.id)) &&
        w.titulo.toLowerCase().includes(query.toLowerCase()) &&
        (genre === "Todos" || w.generos.includes(genre)));
    const fullDetail = Boolean(detail && ["curso", "aula", "evento"].includes(detail.kind));
    const detailContent = detail ? (<>{detail.kind === "funcion" ? (<Seats item={detail} done={refreshMe} flash={flash}/>) : detail.kind === "ticket" ? (<Ticket value={detail.codigo_ticket} reservationId={detail.id}/>) : (<>
                <h1>{detail.titulo ?? detail.nombre ?? detail.municipio}</h1>
                {(detail.poster || detail.imagen) && (<img className="detail-image" src={detail.poster ?? detail.imagen} alt=""/>)}
                {["curso","evento"].includes(detail.kind) && <>
                  <div className="program-meta"><span><b>Categoría</b><br />{detail.categoria}</span>{detail.involucrados && <details><summary>Involucrados</summary><p className="preserve">{detail.involucrados}</p></details>}{detail.inicio && <time>{date(detail.inicio)}</time>}</div>
                  <h2>{detail.kind === "curso" ? "Resumen del programa" : "Resumen del evento"}</h2>
                  <p className="detail-description">{detail.descripcion}</p>
                  {detail.requisitos && <section className="program-requirements"><h2>Requerimientos</h2><ul>{detail.requisitos.split(/\r?\n/).filter(Boolean).map((line:string,i:number)=><li key={i}>{line}</li>)}</ul></section>}
                </>}
                {detail.kind === "curso" ? (<>
                    <p>
                      {detail.categoria} · {detail.duracion}
                    </p>
                    <EnrollmentForm key={"curso-"+detail.id} item={detail} user={me.user} requireLogin={requireLogin} done={refreshMe} />
                    {(detail.direccion || detail.latitud != null) && <><h2>¿Cómo llego?</h2><Map item={detail}/></>}
                    <h2>Aula virtual</h2>
                    {detail.modulos.map((m: Row) => (<div className="module" key={m.id}>
                        <p>
                          {m.orden}. {m.titulo}
                        </p>
                        {m.obra_id ? (<button onClick={() => watch(m.obra_id)}>
                            Ver lección
                          </button>) : (<small>
                            Material de la lección pendiente de carga.
                          </small>)}
                        <button onClick={async () => {
                            if (requireLogin())
                                try {
                                    await api(`modulos/${m.id}/completar`, "POST", {});
                                    await refreshMe();
                                    flash("Avance actualizado");
                                }
                                catch (e) {
                                    flash((e as Error).message);
                                }
                        }}>
                          Marcar como completado
                        </button>
                      </div>))}
                  </>) : (<>
                    {detail.kind !== "evento" && <p className="detail-description">{detail.descripcion}</p>}
                    {detail.inicio && <p>{date(detail.inicio)}</p>}
                    {detail.fecha_evento && (<p>
                        {date(detail.fecha_evento)} · {detail.obra_titulo}
                      </p>)}
                    {detail.horarios && <p>{detail.horarios}</p>}
                    {detail.kind === "evento" && <EnrollmentForm key={"evento-"+detail.id} item={detail} user={me.user} requireLogin={requireLogin} done={refreshMe} />}
                    {(detail.direccion || detail.latitud != null) && <><h2>¿Cómo llego?</h2><Map item={detail}/></>}
                  </>)}
              </>)}</>) : null;
    return (<>
      {detail?.kind === "obra" ? <WorkDetail work={detail} loggedIn={Boolean(me.user)} favorite={me.favorites.includes(detail.id)} saving={savingFavorites.includes(detail.id)} back={() => setDetail(null)} watch={() => watch(detail.id)} toggleFavorite={() => favorite(detail.id)} similar={cards(allWorks.filter(work => work.id !== detail.id && (work.generos ?? []).some((genre: string) => detail.generos?.includes(genre))).slice(0, 8), true)} /> : fullDetail && detail ? <DetailPage pageKey={detail.kind + "-" + detail.id} back={() => setDetail(null)}>{detailContent}<section className="work-similar"><h2>{detail.kind === "curso" ? "Otros programas" : detail.kind === "evento" ? "Otros eventos" : "Otras aulas"}</h2><div className="content-grid">{data.filter(item => item.id !== detail.id).slice(0, 4).map(item => <button className="content-card" key={item.id} onClick={async () => {try {setDetail({...item, kind:detail.kind, ...(detail.kind === "curso" ? {modulos:await api("cursos/"+item.id)} : {})})}catch(error){flash((error as Error).message)}}}><img src={item.poster || item.imagen || "/posters/default.svg"} alt="" /><div><h3>{item.titulo || item.nombre}</h3><small>{item.categoria}</small></div></button>)}</div></section></DetailPage> : <>
      <Navbar setDrawer={setDrawer} navigate={navigate} me={me} setDark={setDark} dark={dark} setAuth={setAuth} section={section}/>
      {drawer && (<NavigationMenu setDrawer={setDrawer} me={me} navigate={navigate} setAuth={setAuth}/>)}
      <main>
        {me.user?.rol === "programador" && section !== "Administración" && (<div className="route-card actions">
            <b>Programador de funciones</b>
            <button className="primary" onClick={() => navigate("Administración")}>
              Gestionar funciones y cartelera
            </button>
          </div>)}
        {me.user?.rol === "administrador" && section !== "Administración" && (<div className="route-card actions">
            <b>Modo administrador</b>
            {(section === "Aprende"
                ? ["cursos", "aulas", "modulos"]
                : section === "Eventos"
                    ? ["eventos"]
                    : section === "Cinemateca Rodante"
                        ? ["rodante"]
                        : section === "Cinemateca Física"
                            ? ["funciones", "salas"]
                            : section === "Transparencia"
                                ? ["legal"]
                                : ["obras"]).map((r) => (<button className="primary" key={r} onClick={() => {
                    setAdminResource(r);
                    navigate("Administración");
                }}>
                Gestionar {resourceNames[r]}
              </button>))}
          </div>)}
        <div className="page-label">
          <span>CINEMATECA DEPARTAMENTAL DE BOYACÁ</span>
          <span>Archivo · Encuentro · Creación</span>
        </div>
        {error && (<div className="error" role="alert">
            {error}
            <p>
              Inicia PostgreSQL y aplica los archivos de la carpeta database.
            </p>
          </div>)}
        {loading && <p className="empty">Cargando la Cinemateca…</p>}
        {!loading &&
            ["Películas", "Cortos", "Mis favoritos", "Buscar"].includes(section) && (<CatalogSection openWork={openWork} section={section} me={me} setAuth={setAuth} genre={genre} setGenre={setGenre} query={query} setQuery={setQuery} cards={cards} visible={visible} error={error} allWorks={allWorks}/>)}
        {!loading && section === "Aprende" && (<LearningSection subtab={subtab} setSubtab={setSubtab} data={data} setDetail={setDetail}/>)}
        {!loading && section === "Eventos" && (<EventsSection genre={genre} setGenre={setGenre} data={data} setDetail={setDetail}/>)}
        {!loading && section === "Cinemateca Rodante" && (<TravelCalendar setMonth={setMonth} month={month} data={data} setDetail={setDetail}/>)}
        {!loading && section === "Cinemateca Física" && (<ShowtimesSection data={data} requireLogin={requireLogin} setDetail={setDetail} error={error}/>)}
        {!loading && section === "Transparencia" && (<TransparencySection data={data}/>)}
        {section === "Mi perfil" && (<ProfileSection me={me} setEditProfile={setEditProfile} editProfile={editProfile} setAuth={setAuth} setMe={setMe} refreshMe={refreshMe} flash={flash} cards={cards} allWorks={allWorks} setDetail={setDetail} navigate={navigate}/>)}
        {section === "Administración" &&
            ["administrador", "programador"].includes(me.user?.rol) && (<Admin key={adminResource} initialResource={me.user.rol === "programador" ? "funciones" : adminResource} programmer={me.user.rol === "programador"} flash={flash}/>)}
      </main>
      <Footer />
      <button className="floating-search" aria-label="Buscar contenido" onClick={() => navigate("Buscar")}>
        <Search />
      </button>
      </>}
      {notice && (<div className="toast" role="status">
          {notice}
        </div>)}
      {auth && (<Auth mode={auth} change={setAuth} done={async () => {
                setAuth(null);
                await refreshMe();
                flash("Sesión iniciada");
            }}/>)}
      {detail && detail.kind !== "obra" && !fullDetail && (<div className="modal-backdrop" onClick={() => setDetail(null)}>
          <section className="modal" role="dialog" aria-modal="true" aria-label={detail.titulo ?? detail.nombre ?? "Detalles"} onClick={(e) => e.stopPropagation()}>
            <button className="close" aria-label="Cerrar detalles" onClick={() => setDetail(null)}>
              <X />
            </button>
            {detailContent}
          </section>
        </div>)}
      {playing && (<Player initial={playing} close={() => setPlaying(null)} flash={flash}/>)}
    </>);
}
