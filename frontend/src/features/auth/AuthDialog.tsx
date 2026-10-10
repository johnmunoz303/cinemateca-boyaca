"use client";
import { useState } from "react";
import { Film, X } from "lucide-react";
import { api } from "@/lib/client";
import type { Row } from "@/lib/types";
export default function Auth({ mode, change, done, }: {
    mode: string;
    change: (v: string | null) => void;
    done: () => void;
}) {
    const [error, setError] = useState(""), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
    return (<div className="modal-backdrop">
      <section className="modal auth" role="dialog" aria-modal="true" aria-label="Acceso">
        <button className="close" aria-label="Cerrar" onClick={() => change(null)}>
          <X />
        </button>
        <Film size={36}/>
        <h1>
          {mode === "register"
            ? "Crea tu perfil"
            : mode === "forgot"
                ? "Recuperar contraseña"
                : mode === "reset"
                    ? "Nueva contraseña"
                    : "Bienvenido a la Cinemateca"}
        </h1>
        <form className="form" onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const f = new FormData(e.currentTarget), b: Row = Object.fromEntries(f);
            if (mode === "reset")
                b.token = new URLSearchParams(location.search).get("reset");
            try {
                const r = await api("auth/" + mode, "POST", b);
                if (mode === "forgot") {
                    setMessage(r.message);
                }
                else if (mode === "reset") {
                    history.replaceState(null, "", "/");
                    change("login");
                    setMessage("Contraseña actualizada");
                }
                else
                    done();
            }
            catch (err) {
                setError((err as Error).message);
            }
            finally {
                setBusy(false);
            }
        }}>
          {mode === "register" && (<>
              <label>
                Nombres
                <input name="nombres" autoComplete="given-name" required/>
              </label>
              <label>
                Apellidos
                <input name="apellidos" autoComplete="family-name"/>
              </label>
            </>)}
          {mode !== "reset" && (<label>
              Correo electrónico
              <input name="email" type="email" autoComplete="email" required/>
            </label>)}
          {mode !== "forgot" && (<label>
              Contraseña
              <input name="password" type="password" minLength={mode === "login" ? 1 : 12} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} required/>
              {mode !== "login" && <small>Mínimo 12 caracteres.</small>}
            </label>)}
          {error && (<p role="alert" className="error">
              {error}
            </p>)}
          {message && <p role="status">{message}</p>}
          <button disabled={busy} className="primary full">
            {busy
            ? "Procesando…"
            : mode === "forgot"
                ? "Solicitar enlace"
                : mode === "register"
                    ? "Registrarme"
                    : mode === "reset"
                        ? "Guardar contraseña"
                        : "Iniciar sesión"}
          </button>
        </form>
        <div className="auth-links">
          <button onClick={() => {
            change(mode === "register" ? "login" : "register");
            setMessage("");
            setError("");
        }}>
            {mode === "register" ? "Ya tengo cuenta" : "Crear perfil"}
          </button>
          <button onClick={() => {
            change("forgot");
            setMessage("");
            setError("");
        }}>
            Olvidé mi contraseña
          </button>
        </div>
      </section>
    </div>);
}
