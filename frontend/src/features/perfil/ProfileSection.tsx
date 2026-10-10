"use client";
import { User, LogOut } from "lucide-react";
import { api, date } from "@/lib/client";
import type { Row } from "@/lib/types";
type Props = {
    me: Row;
    setEditProfile: (value: boolean) => void;
    editProfile: boolean;
    setAuth: (value: string | null) => void;
    setMe: (value: Row) => void;
    refreshMe: () => Promise<void>;
    flash: (value: string) => void;
    cards: (works: Row[], horizontal?: boolean) => React.ReactNode;
    allWorks: Row[];
    setDetail: (value: Row | null) => void;
    navigate: (value: string) => void;
};
export default function ProfileSection({ me, setEditProfile, editProfile, setAuth, setMe, refreshMe, flash, cards, allWorks, setDetail, navigate }: Props) {
    return (<>
            {me.user ? (<>
                <div className="profile">
                  <div className="avatar">
                    <User size={42}/>
                  </div>
                  <h1>
                    {me.user.nombres} {me.user.apellidos}
                  </h1>
                  <p>{me.user.email}</p>
                  <p>
                    Rol:{" "}
                    {me.user.rol === "administrador"
                ? "Administrador"
                : me.user.rol === "programador"
                    ? "Programador de funciones"
                    : "Espectador"}
                  </p>
                  <button className="primary" onClick={() => setEditProfile(!editProfile)}>
                    Editar perfil
                  </button>
                </div>
                {editProfile && (<form className="form route-card" onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    try {
                        const r = await api("me", "PATCH", Object.fromEntries(f));
                        if (r.relogin) {
                            setAuth("login");
                            setMe({
                                user: null,
                                favorites: [],
                                courses: [],
                                events: [],
                                reservations: [],
                            });
                        }
                        else
                            await refreshMe();
                        flash("Perfil actualizado");
                    }
                    catch (err) {
                        flash((err as Error).message);
                    }
                }}>
                    <label>
                      Nombres
                      <input name="nombres" defaultValue={me.user.nombres} required/>
                    </label>
                    <label>
                      Apellidos
                      <input name="apellidos" defaultValue={me.user.apellidos}/>
                    </label>
                    <label>
                      Contraseña actual
                      <input name="currentPassword" type="password" autoComplete="current-password"/>
                    </label>
                    <label>
                      Nueva contraseña (opcional)
                      <input name="newPassword" type="password" minLength={12} autoComplete="new-password"/>
                    </label>
                    <button className="primary">Guardar</button>
                  </form>)}
                <h2>Mi actividad</h2>
                <div className="stats">
                  <div>
                    <b>{me.courses.length}</b>Programas inscritos
                  </div>
                  <div>
                    <b>{me.events.length}</b>Eventos inscritos
                  </div>
                </div>
                {me.courses.map((c: Row) => (<p key={c.id}>
                    {c.titulo}
                    <span className="tag">{c.progreso_porcentaje}%</span>
                  </p>))}
                <h2 className="strip-title">Favoritos</h2>
                {cards(allWorks.filter((w) => me.favorites.includes(w.id)), true)}
                <h2 className="strip-title">Eventos y convocatorias</h2>
                {me.events.map((e: Row) => (<p key={e.id}>
                    {e.titulo}
                    <span className="tag">{e.inscripcion_estado}</span>
                  </p>))}
                <h2 className="strip-title">Mis reservas</h2>
                {me.reservations.map((r: Row) => (<div className="reservation-row" key={r.id}>
                    <span>
                      {r.titulo} · {date(r.inicio)} · {r.estado}
                    </span>
                    {r.estado === "confirmada" && (<button onClick={() => setDetail({ ...r, kind: "ticket" })}>
                        Ver tiquete
                      </button>)}
                    {r.estado === "pendiente" && (<button onClick={async () => {
                        try {
                            await api("reservas/cancelar", "POST", {
                                reserva_id: r.id,
                            });
                            await refreshMe();
                        }
                        catch (e) {
                            flash((e as Error).message);
                        }
                    }}>
                        Cancelar
                      </button>)}
                  </div>))}
                <button className="logout" onClick={async () => {
                await api("auth/logout", "POST", {});
                setMe({
                    user: null,
                    favorites: [],
                    courses: [],
                    events: [],
                    reservations: [],
                });
                navigate("Películas");
            }}>
                  <LogOut size={18}/>
                  Cerrar sesión
                </button>
              </>) : (<div className="empty">
                <h1>Tu espacio en la Cinemateca</h1>
                <button className="primary" onClick={() => setAuth("login")}>
                  Iniciar sesión
                </button>
              </div>)}
          </>);
}
