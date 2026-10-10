"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/client";
import type { Row } from "@/lib/types";
import Hls from "hls.js";
export default function Player({ initial, close, flash, }: {
    initial: Row;
    close: () => void;
    flash: (m: string) => void;
}) {
    const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null), [playerError, setPlayerError] = useState(""), [videoLoading, setVideoLoading] = useState(true);
    const video = useRef<HTMLVideoElement>(null), [info, setInfo] = useState(initial), tokenRef = useRef(initial.token);
    useEffect(() => {
        const el = video.current!;
        let hls: Hls | undefined;
        if (Hls.isSupported()) {
            hls = new Hls({
                xhrSetup: (xhr, url) => {
                    const target = new URL(url, location.origin);
                    target.searchParams.set("token", tokenRef.current);
                    xhr.open("GET", target.toString(), true);
                },
            });
            hls.loadSource(info.url);
            hls.attachMedia(el);
            hls.on(Hls.Events.ERROR, (_, d) => {
                if (d.fatal) {
                    setVideoLoading(false);
                    setPlayerError("No se pudo reproducir el video. Cierra el reproductor y vuelve a intentarlo.");
                    el.pause();
                }
            });
        }
        else
            el.src = info.url;
        return () => hls?.destroy();
    }, []);
    useEffect(() => {
        if (endTimer.current) {
            clearTimeout(endTimer.current);
            endTimer.current = null;
        }
        const timeout = setTimeout(() => {
            if (video.current && video.current.readyState < 2) {
                setVideoLoading(false);
                setPlayerError("El video está tardando demasiado en cargar. Cierra el reproductor y vuelve a intentarlo.");
            }
        }, 20000);
        const renew = setInterval(async () => {
            try {
                const result = await api("streaming/token", "POST", {
                    obra_id: initial.obra_id,
                    session_id: initial.session_id,
                });
                tokenRef.current = result.token;
                setInfo(result);
                if (!Hls.isSupported() && video.current) {
                    const el = video.current, t = el.currentTime;
                    el.src = result.url;
                    el.onloadedmetadata = () => {
                        el.currentTime = t;
                        el.play().catch(() => { });
                    };
                }
            }
            catch (e) {
                video.current?.pause();
                flash((e as Error).message);
            }
        }, 120000);
        return () => {
            clearTimeout(timeout);
            clearInterval(renew);
            endTimer.current = setTimeout(() => {
                api("streaming/end", "POST", { session_id: initial.session_id }).catch(() => { });
            }, 300);
        };
    }, []);
    return (<div className="player-backdrop">
      <button className="close" aria-label="Cerrar reproductor" onClick={close}>
        <X />
      </button>
      <div className="player" onContextMenu={(e) => e.preventDefault()}>
        <video crossOrigin="use-credentials" ref={video} controls autoPlay playsInline onLoadedData={() => {
            setVideoLoading(false);
            setPlayerError("");
        }} onPlaying={() => {
            setVideoLoading(false);
            setPlayerError("");
        }} onError={() => {
            setVideoLoading(false);
            setPlayerError("No se pudo cargar el video. Vuelve a abrirlo.");
        }}>
          {(info.subtitulos ?? []).map((sub: Row) => (<track key={sub.id} kind="subtitles" src={sub.url} srcLang={sub.idioma.toLowerCase().startsWith("es") ? "es" : "und"} label={sub.idioma}/>))}
        </video>
      </div>
    </div>);
}
