"use client";
import { X } from "lucide-react";
import type { Row } from "@/lib/types";
type Props = {
    setDrawer: (value: boolean) => void;
    me: Row;
    navigate: (value: string) => void;
    setAuth: (value: string | null) => void;
};
export default function NavigationMenu({ setDrawer, me, navigate, setAuth }: Props) {
    return (<div className="drawer-backdrop" onClick={() => setDrawer(false)}>
          <aside onClick={(e) => e.stopPropagation()}>
            <button aria-label="Cerrar menú" onClick={() => setDrawer(false)}>
              <X />
            </button>
            <h2>Cinemateca departamental de Boyacá</h2>
            {[
            "Cinemateca Rodante",
            "Cinemateca Física",
            "Transparencia",
            "Mis favoritos",
            "Mi perfil",
            ...(["administrador", "programador"].includes(me.user?.rol)
                ? ["Administración"]
                : []),
        ].map((t) => (<button key={t} onClick={() => navigate(t)}>
                {t}
              </button>))}
            <div className="drawer-bottom">
              {me.user ? (<p>{me.user.nombres}</p>) : (<>
                  <b>¿No tienes perfil aún?</b>
                  <button onClick={() => {
                setDrawer(false);
                setAuth("register");
            }}>
                    Crea uno aquí
                  </button>
                </>)}
            </div>
          </aside>
        </div>);
}
