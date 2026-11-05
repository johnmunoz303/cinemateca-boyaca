"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, Maximize, Settings, Volume2, VolumeX, Subtitles, PictureInPicture2 } from "lucide-react";
import "./player.css";
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
    const stage = useRef<HTMLDivElement>(null);
    const autoplayAttempted = useRef(false);
    const [paused, setPaused] = useState(true), [position, setPosition] = useState(0), [duration, setDuration] = useState(0);
    const [visible, setVisible] = useState(true), [menu, setMenu] = useState(""), [speed, setSpeed] = useState(1), [muted, setMuted] = useState(false);
    const [subtitle, setSubtitle] = useState(-1), [title, setTitle] = useState(initial.titulo || "");
    const [activity, setActivity] = useState(0), [volume, setVolume] = useState(1);
    const wake = () => { setVisible(true); setActivity(n => n + 1); };
    async function pictureInPicture() {
        try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else if (video.current?.requestPictureInPicture) await video.current.requestPictureInPicture(); else flash("Este navegador no permite video flotante."); }
        catch { flash("El video flotante no está disponible en este navegador."); }
    }
    const format = (seconds: number) => { const n = Math.max(0, Math.floor(seconds || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`; };
    const toggle = () => { const el = video.current; if (!el) return; setVisible(true); if (el.paused) el.play().catch(() => setPaused(true)); else el.pause(); };
    async function startPlayback(el: HTMLVideoElement) {
        setVideoLoading(false);
        if (autoplayAttempted.current) return;
        autoplayAttempted.current = true;
        if (!el.paused) return;
        try {
            await el.play();
        } catch (error) {
            if (video.current !== el || !(error instanceof DOMException) || error.name !== "NotAllowedError") return;
            el.muted = true;
            try {
                await el.play();
            } catch {
                if (video.current !== el) return;
                el.muted = false;
                wake();
            }
        }
    }
    const seek = (delta: number) => { const el = video.current; if (el && Number.isFinite(el.duration)) { el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + delta)); setPosition(el.currentTime); } setVisible(true); };
    async function fullscreen() {
        const el = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
        try {
            if (document.fullscreenElement) { await document.exitFullscreen(); return; }
            if (stage.current?.requestFullscreen) await stage.current.requestFullscreen();
            else if (el?.webkitEnterFullscreen) { el.webkitEnterFullscreen(); return; }
            const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
            await orientation?.lock?.("landscape").catch(() => {});
        } catch { /* El modo horizontal de la interfaz sigue disponible sin fullscreen. */ }
    }
    useEffect(() => {
        const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
        if (!initial.titulo) api("obras/" + initial.obra_id).then(w => setTitle(w.titulo || "Reproducción")).catch(() => setTitle("Reproducción"));
        return () => { document.body.style.overflow = previous; screen.orientation?.unlock?.(); };
    }, []);
    useEffect(() => {
        if (!visible || paused || menu || playerError) return;
        const timer = setTimeout(() => setVisible(false), 3000); return () => clearTimeout(timer);
    }, [visible, paused, menu, playerError, activity]);
    useEffect(() => {
        const tracks = video.current?.textTracks; if (!tracks) return;
        for (let i = 0; i < tracks.length; i++) tracks[i].mode = i === subtitle ? "showing" : "disabled";
    }, [subtitle, info.subtitulos]);
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
                    const el = video.current, t = el.currentTime, wasPaused = el.paused, previousRate = el.playbackRate;
                    el.src = result.url;
                    el.onloadedmetadata = () => {
                        el.currentTime = t;
                        el.playbackRate = previousRate;
                        if (!wasPaused) el.play().catch(() => { });
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
    return (<div className="cinema-player-shell" role="dialog" aria-modal="true" aria-label={title || "Reproductor"}>
      <div ref={stage} className={"cinema-player " + (visible || paused || menu || playerError ? "controls-visible" : "")} tabIndex={0}
        onPointerMove={e => {if (e.pointerType !== "touch") wake();}} onPointerDown={e => {if(e.target !== video.current) wake();}} onFocusCapture={wake} onContextMenu={e => e.preventDefault()}
        onKeyDown={e => { wake(); if ((e.target as HTMLElement).closest("button,input")) return; if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); } if (e.key === "ArrowRight") {e.preventDefault(); seek(10);} if (e.key === "ArrowLeft") {e.preventDefault(); seek(-10);} if (e.key === "Escape" && !document.fullscreenElement) close(); }}>
        <video crossOrigin="use-credentials" ref={video} preload="auto" playsInline onClick={() => {setVisible(v => !v); setActivity(n => n + 1);}}
          onPause={() => {setPaused(true); setVisible(true);}} onEnded={() => setPaused(true)}
          onTimeUpdate={() => setPosition(video.current?.currentTime || 0)} onDurationChange={() => setDuration(Number.isFinite(video.current?.duration) ? video.current!.duration : 0)}
          onVolumeChange={() => {setMuted(!!video.current?.muted);setVolume(video.current?.volume ?? 1);}} onWaiting={() => setVideoLoading(true)} onCanPlay={event => void startPlayback(event.currentTarget)}
          onLoadedData={() => {
            setVideoLoading(false);
            setPlayerError("");
        }} onPlaying={() => {
            setPaused(false);
            setVideoLoading(false);
            setPlayerError("");
        }} onError={() => {
            setVideoLoading(false);
            setPlayerError("No se pudo cargar el video. Vuelve a abrirlo.");
        }}>
          {(info.subtitulos ?? []).map((sub: Row) => (<track key={sub.id} kind="subtitles" src={sub.url} srcLang={sub.idioma.toLowerCase().startsWith("es") ? "es" : "und"} label={sub.idioma}/>))}
        </video>
        <div className="cinema-shade" aria-hidden="true" />
        <div className="cinema-top cinema-controls">
          <button type="button" aria-label="Cerrar reproductor" onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); close(); }}><ArrowLeft /></button>
        </div>
        {videoLoading && !playerError && <div className="cinema-loading" role="status">Cargando video…</div>}
        {playerError && <div className="cinema-error" role="alert">{playerError}</div>}
        <footer className="cinema-bottom cinema-controls">
          <div className="cinema-progress"><input aria-label="Posición del video" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(position, duration || 1)} disabled={!duration} style={{"--played": `${duration ? position / duration * 100 : 0}%`} as React.CSSProperties} onChange={e => {if(video.current) video.current.currentTime = Number(e.target.value); setPosition(Number(e.target.value));}} /></div>
          <div className="cinema-toolbar">
            <button type="button" aria-label={paused ? "Reproducir" : "Pausar"} title={paused ? "Reproducir" : "Pausar"} onClick={toggle}>{paused ? <Play fill="currentColor"/> : <Pause fill="currentColor"/>}</button>
            <button type="button" className="cinema-skip" aria-label="Retroceder 10 segundos" title="Retroceder 10 segundos" onClick={() => seek(-10)}><RotateCcw/><small>10</small></button>
            <button type="button" className="cinema-skip" aria-label="Adelantar 10 segundos" title="Adelantar 10 segundos" onClick={() => seek(10)}><RotateCw/><small>10</small></button>
            <span className="cinema-time">{format(position)} / {format(duration)}</span>
            <div className="cinema-toolbar-spacer"/>
            <button type="button" aria-label={muted ? "Activar sonido" : "Silenciar"} onClick={() => {if(video.current) video.current.muted = !video.current.muted;}}>{muted ? <VolumeX /> : <Volume2 />}</button>
            <input className="cinema-volume" aria-label="Volumen" type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={e => {if(video.current){video.current.volume=Number(e.target.value); video.current.muted=false;}}}/>
            <div className="cinema-option"><button type="button" aria-label="Configuración de velocidad" title={"Velocidad: " + speed + "×"} aria-expanded={menu === "speed"} onClick={() => setMenu(menu === "speed" ? "" : "speed")}><Settings /></button>
              {menu === "speed" && <div className="cinema-menu" aria-label="Velocidad de reproducción">{[0.5,0.75,1,1.25,1.5,2].map(rate => <button type="button" key={rate} aria-pressed={speed === rate} onClick={() => {if(video.current) video.current.playbackRate = rate; setSpeed(rate); setMenu("");}}>{rate}× {rate === 1 ? "Normal" : ""}</button>)}</div>}
            </div>
            {!!info.subtitulos?.length && <div className="cinema-option"><button type="button" aria-label="Subtítulos" title="Subtítulos" aria-expanded={menu === "subtitles"} onClick={() => setMenu(menu === "subtitles" ? "" : "subtitles")}><Subtitles /></button>
              {menu === "subtitles" && <div className="cinema-menu"><button type="button" aria-pressed={subtitle === -1} onClick={() => {setSubtitle(-1); setMenu("");}}>Desactivados</button>{info.subtitulos.map((sub: Row, i: number) => <button type="button" key={sub.id} aria-pressed={subtitle === i} onClick={() => {setSubtitle(i); setMenu("");}}>{sub.idioma}</button>)}</div>}
            </div>}
            <button type="button" aria-label="Video flotante" title="Video flotante" onClick={pictureInPicture}><PictureInPicture2/></button>
            <button type="button" className="cinema-expand" aria-label="Pantalla completa" title="Pantalla completa" onClick={fullscreen}><Maximize /></button>
          </div>
        </footer>
      </div>
    </div>);
}
