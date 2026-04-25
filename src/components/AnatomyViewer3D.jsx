import { useEffect, useRef, useState } from "react";

/**
 * 3D Anatomy Viewer — Sketchfab embed
 * ============================================================================
 * Loads CC-licensed dog & cat skeleton models from Sketchfab via their free
 * Viewer API. The user can rotate, zoom, and inspect from any angle. Works on
 * mobile (native pinch + drag) and desktop.
 *
 * Why Sketchfab embed (not three.js + downloaded GLTF):
 *   1. Free, hosted, instantly available — no model storage cost
 *   2. Their viewer handles WebGL quirks better than custom three.js code
 *   3. Built-in mobile gesture support
 *   4. Per-user device GPU off-load happens on Sketchfab's side
 *
 * Tradeoffs accepted:
 *   - Free tier shows a small Sketchfab watermark (acceptable for v1)
 *   - Limited material customization without their PRO Inspector tier
 *
 * To swap models: edit DOG_MODEL_UID / CAT_MODEL_UID below. UID is the hex
 * string after /3d-models/<slug>- in the model's Sketchfab URL.
 * ============================================================================
 */

// ── Verified Sketchfab model UIDs (free, embeddable) ────────────────────
// Dog: vetanat.UZH (University of Zurich vet anatomy department) — Schäfer
//      https://sketchfab.com/3d-models/dog-skeleton-fb8e7afba65b439d86d404e37d6a0cc2
const DOG_MODEL_UID = "fb8e7afba65b439d86d404e37d6a0cc2";

// Cat: westerly — Feline Skeleton (clean ecorche-style base)
//      https://sketchfab.com/3d-models/feline-skeleton-dec-a5d0bb8f55dc4f49b103cd20d65e0b17
const CAT_MODEL_UID = "a5d0bb8f55dc4f49b103cd20d65e0b17";

const SKETCHFAB_API_SRC = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";

function loadSketchfabAPI() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.Sketchfab) return resolve(window.Sketchfab);
    const existing = document.querySelector(`script[src="${SKETCHFAB_API_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Sketchfab));
      existing.addEventListener("error", () => reject(new Error("script load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = SKETCHFAB_API_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(window.Sketchfab));
    script.addEventListener("error", () => reject(new Error("script load failed")));
    document.head.appendChild(script);
  });
}

export default function AnatomyViewer3D({ species = "dog", height = 380 }) {
  const iframeRef = useRef(null);
  const apiRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const uid = species === "cat" ? CAT_MODEL_UID : DOG_MODEL_UID;
  const speciesLabel = species === "cat" ? "Feline" : "Canine";

  // Initialise / re-initialise Sketchfab viewer when species changes
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError(null);

    (async () => {
      try {
        const Sketchfab = await loadSketchfabAPI();
        if (cancelled || !iframeRef.current) return;

        const client = new Sketchfab(iframeRef.current);
        client.init(uid, {
          // Auto-start, hide most chrome — we provide our own UI shell
          autostart: 1,
          preload: 1,
          ui_infos: 0,
          ui_inspector: 0,
          ui_stop: 0,
          ui_help: 0,
          ui_settings: 0,
          ui_vr: 0,
          ui_annotations: 0,
          ui_loading: 1,
          ui_fullscreen: 1,
          ui_theme: "dark",
          transparent: 0,
          camera: 0,
          double_click: 0,

          success: (api) => {
            if (cancelled) return;
            apiRef.current = api;
            api.start();
            api.addEventListener("viewerready", () => {
              if (cancelled) return;
              setLoaded(true);
              try {
                // Match B.E.A.U.'s dark surface
                api.setBackground({ color: [0.047, 0.047, 0.055] });
              } catch { /* setBackground may fail on some models */ }
            });
          },
          error: () => {
            if (cancelled) return;
            setError("Could not load the 3D anatomy model. Please retry in a moment.");
          },
        });
      } catch (err) {
        if (!cancelled) {
          console.error("[AnatomyViewer3D]", err?.message || err);
          setError(
            "3D viewer is unavailable on this device or browser. " +
            "Often this is fixed by closing other browser tabs that use 3D graphics, " +
            "or switching to Chrome/Safari."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      apiRef.current = null;
    };
  }, [uid]);

  // ── Fallback when Sketchfab / WebGL unavailable ──────────────────────
  if (error) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #0F1828 0%, #050A14 100%)",
        border: "1px solid #1C1C1F", borderRadius: 12,
        padding: "20px 22px", margin: "8px 0",
        color: "#F5F5F5", fontSize: 13, lineHeight: 1.6
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#00F0FF",
          letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>
          🩻 3D Anatomy · {speciesLabel}
        </div>
        <p style={{ color: "#BFBFC4", margin: "8px 0 14px" }}>{error}</p>
        <button
          onClick={() => { setError(null); setLoaded(false); }}
          style={{
            background: "#00F0FF22", border: "1px solid #00F0FF66",
            color: "#00F0FF", fontSize: 12, fontWeight: 500,
            padding: "8px 16px", borderRadius: 6, cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative",
      borderRadius: 12,
      overflow: "hidden",
      background: "#0C0C0E",
      border: "1px solid #1C1C1F",
      margin: "8px 0",
    }}>
      {/* Mini header — species + status */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid #1C1C1F",
        background: "rgba(0,0,0,0.35)",
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: "#00F0FF",
          letterSpacing: "1px", textTransform: "uppercase"
        }}>
          🩻 3D Anatomy · {speciesLabel}
        </span>
        <span style={{ fontSize: 10, color: "#6C6C74" }}>
          {loaded ? "Drag to rotate · Pinch to zoom" : "Loading…"}
        </span>
      </div>

      {/* Loading skeleton — soft pulse over the iframe area */}
      {!loaded && (
        <div style={{
          position: "absolute", top: 41, left: 0, right: 0, height: height,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#6C6C74", fontSize: 13,
          background: "linear-gradient(135deg, #0F1828 0%, #050A14 100%)",
          pointerEvents: "none",
        }}>
          Loading anatomy…
        </div>
      )}

      {/*
        The iframe MUST be in the DOM before Sketchfab.init() is called,
        which is why we render it unconditionally and overlay the skeleton.
        `allow="autoplay; fullscreen"` is required by Sketchfab.
      */}
      <iframe
        ref={iframeRef}
        title={`${speciesLabel} 3D Anatomy`}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        // mozallowfullscreen + webkitallowfullscreen are deprecated but kept
        // for older browser support (vet nurses on legacy iPads, etc.)
        mozallowfullscreen="true"
        webkitallowfullscreen="true"
        style={{
          width: "100%",
          height: height,
          border: 0,
          display: "block",
          // CSS hue-rotate gives a cyan X-ray vibe across most models without
          // needing Sketchfab PRO material customization. Tunable here.
          filter: "saturate(1.05) contrast(1.04)",
        }}
      />
    </div>
  );
}
