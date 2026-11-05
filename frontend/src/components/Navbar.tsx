"use client";
import { Menu, User } from "lucide-react";
import CinematecaBrand from "./CinematecaBrand";
import type { Row } from "@/lib/types";
type Props = {
    setDrawer: (value: boolean) => void;
    navigate: (value: string) => void;
    me: Row;
    setAuth: (value: string | null) => void;
    section: string;
};
export default function Navbar({ setDrawer, navigate, me, setAuth, section }: Props) {
    return (<header>
        <div className="header-inner">
          <button aria-label="Abrir menú" onClick={() => setDrawer(true)}>
            <Menu />
          </button>
          <button className="brand" onClick={() => navigate("Películas")}>
            <CinematecaBrand />
          </button>
          <div className="header-actions">
            {me.user && (<span className="tag">
                {me.user.rol === "administrador"
                ? "Administrador"
                : me.user.rol === "programador"
                    ? "Programador de funciones"
                    : "Espectador"}
              </span>)}
            <button aria-label="Mi perfil" onClick={() => me.user ? navigate("Mi perfil") : setAuth("login")}>
              <User />
            </button>
          </div>
        </div>
        <nav className="tabs">
          {["Películas", "Cortos", "Aprende", "Eventos"].map((t) => (<button className={section === t ? "selected" : ""} key={t} onClick={() => navigate(t)}>
              {t}
            </button>))}
        </nav>
      </header>);
}
