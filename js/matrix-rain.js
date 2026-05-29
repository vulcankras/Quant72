/* ============================================================
   matrix-rain.js — katakana matrix rain on a <canvas>
   Usage:  <canvas class="matrix-rain" data-speed="1" data-density="1"
                    data-fade="0.06"></canvas>
   Reads --accent + --glow-on from :root at runtime so Tweaks apply.
   ============================================================ */
(function () {
  const GLYPHS =
    "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789$₿ΞAQT72<>/\\=+*".split("");

  function hexToRgb(hex) {
    const m = hex.trim().replace("#", "");
    const v = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
    const n = parseInt(v, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function init(canvas) {
    const ctx = canvas.getContext("2d");
    const speed = parseFloat(canvas.dataset.speed || "1");
    const density = parseFloat(canvas.dataset.density || "1");
    const fade = parseFloat(canvas.dataset.fade || "0.06");
    const fontSize = parseInt(canvas.dataset.size || "16", 10);
    let cols, drops, accent, glowOn, dpr, lastW, lastH;

    function readVars() {
      const css = getComputedStyle(document.documentElement);
      accent = hexToRgb(css.getPropertyValue("--accent") || "#3DE8B0");
      glowOn = parseFloat(css.getPropertyValue("--glow-on") || "1");
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      lastW = r.width; lastH = r.height;
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(1, Math.floor(r.width / fontSize));
      drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    }

    readVars();
    resize();

    let raf, t = 0;
    function frame() {
      const liveSpeed = (typeof window.__q72MatrixSpeed === "number") ? window.__q72MatrixSpeed : speed;
      t += liveSpeed;
      // translucent black to fade trails
      ctx.fillStyle = `rgba(3, 6, 4, ${fade})`;
      ctx.fillRect(0, 0, lastW, lastH);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < cols; i++) {
        if (Math.random() > density && drops[i] > 0) continue;
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const [r, g, b] = accent;

        // bright leading glyph
        if (Math.random() > 0.975) {
          ctx.fillStyle = `rgba(${Math.min(r + 90, 255)}, 255, ${Math.min(b + 90, 255)}, 0.95)`;
          if (glowOn > 0.5) { ctx.shadowColor = `rgb(${r},${g},${b})`; ctx.shadowBlur = 12; }
        } else {
          const a = 0.25 + Math.random() * 0.5;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.shadowBlur = 0;
        }
        ctx.fillText(ch, x, y);
        ctx.shadowBlur = 0;

        if (y > lastH && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.45 * liveSpeed;
      }
      raf = requestAnimationFrame(frame);
    }
    frame();

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(resize, 150);
    });
    // expose so Tweaks can re-read colors live
    canvas._matrixRefresh = readVars;
  }

  function boot() {
    document.querySelectorAll("canvas.matrix-rain").forEach(init);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }

  window.refreshMatrixRain = function () {
    document.querySelectorAll("canvas.matrix-rain").forEach((c) => c._matrixRefresh && c._matrixRefresh());
  };
})();
