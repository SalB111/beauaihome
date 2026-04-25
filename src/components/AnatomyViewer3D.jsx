import { useEffect, useRef, useState, useCallback } from "react";

/**
 * AnatomyViewer3D — Holographic X-Ray Viewer
 * ============================================================================
 * Renders Sal's custom cyan X-ray skeleton PNGs as an interactive holographic
 * display. No WebGL/Sketchfab dependency — uses CSS 3D transforms + canvas
 * particles + GPU-composited animations for a premium 3D feel.
 *
 * Interaction model:
 *   Desktop  → mouse move over card drives rotateX/Y tilt
 *   Mobile   → touch drag drives tilt; DeviceOrientation if granted
 *   Always   → breathing float loop + scan line + particle field
 *
 * Images live in /public/:
 *   /dog-holographic.png
 *   /cat-holographic.png
 * ============================================================================
 */

// ── Particle system config ──────────────────────────────────────────────────
const PARTICLE_COUNT = 55;
const PARTICLE_COLOR = "rgba(0, 240, 255,";  // cyan — matches X-ray glow

function initParticles(canvas) {
  const W = canvas.width;
  const H = canvas.height;
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.6 + Math.random() * 1.8,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -0.15 - Math.random() * 0.4,
    alpha: 0.15 + Math.random() * 0.55,
    life: Math.random(),   // 0–1 phase offset
  }));
}

function tickParticles(particles, W, H) {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life += 0.004;
    // Pulse alpha via sine wave
    p.alpha = 0.1 + 0.5 * Math.abs(Math.sin(p.life * Math.PI));
    // Wrap around
    if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
    if (p.x < -4) p.x = W + 4;
    if (p.x > W + 4) p.x = -4;
  }
}

// ── Spring interpolation for smooth tilt tracking ──────────────────────────
function spring(current, target, velocity, stiffness = 0.1, damping = 0.75) {
  const force = (target - current) * stiffness;
  const newVel = (velocity + force) * damping;
  return { value: current + newVel, velocity: newVel };
}

// ── Main component ──────────────────────────────────────────────────────────
export default function AnatomyViewer3D({ species = "dog", height = 380 }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const tiltRef = useRef({ rx: 0, ry: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 });
  const scanRef = useRef(0);  // scan line position 0–1
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const src = species === "cat" ? "/cat-holographic.png" : "/dog-holographic.png";
  const label = species === "cat" ? "Feline" : "Canine";

  // ── Preload image ──────────────────────────────────────────────────────
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
    const img = new Image();
    img.src = src;
    img.onload = () => setImgLoaded(true);
    img.onerror = () => setImgError(true);
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);

  // ── Canvas particle + scan line loop ──────────────────────────────────
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    if (!particlesRef.current.length) {
      particlesRef.current = initParticles(canvas);
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      // Particles
      tickParticles(particlesRef.current, W, H);
      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${PARTICLE_COLOR}${p.alpha.toFixed(2)})`;
        ctx.fill();
      }

      // Scan line sweep (top → bottom, looping)
      scanRef.current = (scanRef.current + 0.003) % 1;
      const scanY = scanRef.current * H;
      const scanGrad = ctx.createLinearGradient(0, scanY - 18, 0, scanY + 18);
      scanGrad.addColorStop(0,   "rgba(0,240,255,0)");
      scanGrad.addColorStop(0.4, "rgba(0,240,255,0.06)");
      scanGrad.addColorStop(0.5, "rgba(0,240,255,0.18)");
      scanGrad.addColorStop(0.6, "rgba(0,240,255,0.06)");
      scanGrad.addColorStop(1,   "rgba(0,240,255,0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 18, W, 36);

      // Tilt spring update
      const t = tiltRef.current;
      const rxSpring = spring(t.rx, t.targetX, t.vx, 0.08, 0.78);
      const rySpring = spring(t.ry, t.targetY, t.vy, 0.08, 0.78);
      t.rx = rxSpring.value;  t.vx = rxSpring.velocity;
      t.ry = rySpring.value;  t.vy = rySpring.velocity;

      // Apply tilt to container inner (the perspective child)
      const inner = containerRef.current?.querySelector("[data-tilt]");
      if (inner) {
        inner.style.transform =
          `rotateX(${t.rx.toFixed(2)}deg) rotateY(${t.ry.toFixed(2)}deg)`;
      }

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => {
    if (!imgLoaded) return;
    startLoop();
    return stopLoop;
  }, [imgLoaded, startLoop, stopLoop]);

  // ── Canvas resize ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ro = new ResizeObserver(() => {
      const { width, height: h } = container.getBoundingClientRect();
      canvas.width = Math.floor(width);
      canvas.height = Math.floor(h);
      particlesRef.current = initParticles(canvas);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ── Pointer / touch interaction ────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // clientX/Y from mouse or first touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = (clientX - cx) / (rect.width / 2);   // -1 to 1
    const dy = (clientY - cy) / (rect.height / 2);  // -1 to 1
    tiltRef.current.targetX = -dy * 14;  // max ±14° vertical tilt
    tiltRef.current.targetY =  dx * 18;  // max ±18° horizontal tilt
  }, []);

  const handlePointerLeave = useCallback(() => {
    tiltRef.current.targetX = 0;
    tiltRef.current.targetY = 0;
  }, []);

  // ── Device orientation (mobile gyroscope) ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // gamma = left/right tilt, beta = front/back tilt
      const ry = Math.max(-18, Math.min(18, (e.gamma || 0) * 0.5));
      const rx = Math.max(-14, Math.min(14, ((e.beta || 45) - 45) * 0.4));
      tiltRef.current.targetX = rx;
      tiltRef.current.targetY = ry;
    };
    window.addEventListener("deviceorientation", handler, { passive: true });
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  // ── Error state ────────────────────────────────────────────────────────
  if (imgError) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #0F1828 0%, #050A14 100%)",
        border: "1px solid #1C1C1F", borderRadius: 12,
        padding: "20px 22px", margin: "8px 0",
        color: "#F5F5F5", fontSize: 13
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#00F0FF",
          letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>
          🩻 Holographic Anatomy · {label}
        </div>
        <p style={{ color: "#BFBFC4" }}>Image could not be loaded.</p>
      </div>
    );
  }

  return (
    <div style={{ margin: "8px 0", borderRadius: 12, overflow: "hidden",
      border: "1px solid #1C3A4A", background: "#000" }}>

      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid #0A2030",
        background: "rgba(0,10,20,0.7)",
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#00F0FF",
          letterSpacing: "1px", textTransform: "uppercase" }}>
          🩻 Holographic Anatomy · {label}
        </span>
        <span style={{ fontSize: 10, color: "#2A7A8A" }}>
          {imgLoaded ? "Drag to tilt · Pinch to zoom" : "Initialising…"}
        </span>
      </div>

      {/* Viewer stage */}
      <div
        ref={containerRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerLeave}
        style={{
          position: "relative",
          width: "100%",
          height: height,
          background: "#000",
          cursor: "grab",
          // Perspective for 3D child tilt
          perspective: "900px",
          perspectiveOrigin: "50% 50%",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow backdrop */}
        <div style={{
          position: "absolute", inset: 0,
          background:
            "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(0,180,220,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* 3D tilt wrapper — transform applied by RAF */}
        <div
          data-tilt=""
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transformStyle: "preserve-3d",
            willChange: "transform",
            transition: "none",  // spring does its own interpolation
          }}
        >
          {/* Loading skeleton */}
          {!imgLoaded && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#1A4A5A", fontSize: 13,
            }}>
              Loading hologram…
            </div>
          )}

          {/* The X-ray image */}
          {imgLoaded && (
            <img
              src={src}
              alt={`${label} skeleton hologram`}
              draggable={false}
              style={{
                maxHeight: height - 4,
                maxWidth: "100%",
                objectFit: "contain",
                display: "block",
                // Subtle drop-shadow that matches the cyan glow
                filter:
                  "drop-shadow(0 0 18px rgba(0,240,255,0.45)) " +
                  "drop-shadow(0 0 4px rgba(0,240,255,0.7)) " +
                  "brightness(1.08) contrast(1.06)",
                // CSS breathing animation — translateZ for subtle depth pulse
                animation: "beauHoloFloat 4.2s ease-in-out infinite",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Canvas overlay — particles + scan line, sits above image */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />

        {/* Corner bracket decorations */}
        {imgLoaded && (
          <>
            {[
              { top: 6, left: 6, borderTop: "1px solid #00F0FF44", borderLeft: "1px solid #00F0FF44" },
              { top: 6, right: 6, borderTop: "1px solid #00F0FF44", borderRight: "1px solid #00F0FF44" },
              { bottom: 6, left: 6, borderBottom: "1px solid #00F0FF44", borderLeft: "1px solid #00F0FF44" },
              { bottom: 6, right: 6, borderBottom: "1px solid #00F0FF44", borderRight: "1px solid #00F0FF44" },
            ].map((s, i) => (
              <div key={i} style={{
                position: "absolute",
                width: 14, height: 14,
                pointerEvents: "none",
                ...s,
              }} />
            ))}
          </>
        )}
      </div>

      {/* CSS keyframes injected once via a style tag */}
      <style>{`
        @keyframes beauHoloFloat {
          0%   { transform: translateY(0px)   scale(1.000); }
          30%  { transform: translateY(-6px)  scale(1.004); }
          60%  { transform: translateY(-3px)  scale(1.002); }
          100% { transform: translateY(0px)   scale(1.000); }
        }
      `}</style>
    </div>
  );
}
