"use client";
import { Menu, Film, User, Sun, Moon } from "lucide-react";
import type { Row } from "@/lib/types";
type Props = {
    setDrawer: (value: boolean) => void;
    navigate: (value: string) => void;
    me: Row;
    setDark: (value: boolean) => void;
    dark: boolean;
    setAuth: (value: string | null) => void;
    section: string;
};
export default function Navbar({ setDrawer, navigate, me, setDark, dark, setAuth, section }: Props) {
    return (<header>
        <div className="header-inner">
          <button aria-label="Abrir menú" onClick={() => setDrawer(true)}>
            <Menu />
          </button>
          <button className="brand" onClick={() => navigate("Películas")}>
            <Film />
            <span>
              Cinemateca
            </span>
          </button>
          <div className="header-actions">
            {me.user && (<span className="tag">
                {me.user.rol === "administrador"
                ? "Administrador"
                : me.user.rol === "programador"
                    ? "Programador de funciones"
                    : "Espectador"}
              </span>)}
            <button aria-label="Cambiar tema" onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </button>
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
