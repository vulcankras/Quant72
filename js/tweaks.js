/* ============================================================
   tweaks.js — shared vanilla Tweaks panel for all Quant72 pages.
   Dark-themed to match the matrix aesthetic. Persists to
   localStorage so accent/font carry across pages, and speaks the
   host edit-mode protocol so the toolbar toggle shows/hides it.

   Per-page config: set window.Q72_TWEAKS_CONFIG = ['accent',
   'font','matrix','glow','tagline','poweredby'] before this loads.
   Defaults to all. Tagline/poweredby controls only do anything if
   the matching [data-tweak] element exists on the page.
   ============================================================ */
(function () {
  const KEY = "q72_tweaks_v1";
  const DEFAULTS = {
    accent: "#3DE8B0",
    font: "space-jet",
    matrix: 1.0,
    glow: true,
    tagline: "The DeFi Agent Network to Empower On-chain Trading.",
    poweredby: "Hubble",
  };
  const ACCENTS = [
    { v: "#3DE8B0", n: "Teal" },
    { v: "#39FF7A", n: "Matrix" },
    { v: "#2EE6C5", n: "Cyan" },
    { v: "#23B0FF", n: "Blue" },
  ];
  const FONTS = [
    { v: "space-jet", l: "Grotesk", sans: '"Space Grotesk"', mono: '"JetBrains Mono"' },
    { v: "sora-jet", l: "Sora", sans: '"Sora"', mono: '"JetBrains Mono"' },
    { v: "mono", l: "Mono", sans: '"JetBrains Mono"', mono: '"JetBrains Mono"' },
  ];

  function load() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch (e) { return { ...DEFAULTS }; }
  }
  let state = load();

  function hexToRgb(hex) {
    const m = hex.replace("#", "");
    const v = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
    const n = parseInt(v, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function apply() {
    const root = document.documentElement.style;
    const [r, g, b] = hexToRgb(state.accent);
    root.setProperty("--accent", state.accent);
    root.setProperty("--accent-soft", `rgba(${r},${g},${b},0.14)`);
    root.setProperty("--accent-mid", `rgba(${r},${g},${b},0.5)`);
    root.setProperty("--up", state.accent);
    root.setProperty("--glow", `0 0 24px rgba(${r},${g},${b},0.35)`);
    root.setProperty("--glow-strong", `0 0 40px rgba(${r},${g},${b},0.5)`);
    root.setProperty("--line", `rgba(${r},${g},${b},0.12)`);
    root.setProperty("--line-2", `rgba(${r},${g},${b},0.24)`);
    root.setProperty("--line-3", `rgba(${r},${g},${b},0.45)`);

    const f = FONTS.find((x) => x.v === state.font) || FONTS[0];
    root.setProperty("--sans", `${f.sans}, system-ui, sans-serif`);

    root.setProperty("--glow-on", state.glow ? "1" : "0");
    document.body.classList.toggle("no-glow", !state.glow);

    window.__q72MatrixSpeed = state.matrix;
    if (window.refreshMatrixRain) window.refreshMatrixRain();

    document.querySelectorAll('[data-tweak="tagline"]').forEach((el) => { el.textContent = state.tagline; });
    document.querySelectorAll('[data-tweak="poweredby"]').forEach((el) => { el.textContent = state.poweredby; });

    window.dispatchEvent(new CustomEvent("q72tweak", { detail: state }));
  }

  function set(key, val) {
    state[key] = val;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [key]: val } }, "*"); } catch (e) {}
    apply();
  }

  // apply persisted state immediately (before panel exists)
  if (document.body) apply();
  else document.addEventListener("DOMContentLoaded", apply);

  /* ---------- panel UI ---------- */
  const CSS = `
  .q72twk{position:fixed;right:18px;bottom:18px;z-index:2147483646;width:264px;
    background:rgba(7,11,9,.86);-webkit-backdrop-filter:blur(20px) saturate(150%);
    backdrop-filter:blur(20px) saturate(150%);color:var(--text,#def3ec);
    border:1px solid var(--line-2,rgba(61,232,176,.24));border-radius:6px;
    box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4);
    font-family:var(--mono,"JetBrains Mono",monospace);overflow:hidden}
  .q72twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:11px 12px;border-bottom:1px solid var(--line,rgba(61,232,176,.12));cursor:move;user-select:none}
  .q72twk-hd b{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent,#3DE8B0);font-weight:600}
  .q72twk-x{background:none;border:0;color:var(--text-mute,#7f978e);cursor:pointer;font-size:13px;padding:2px 6px;border-radius:3px}
  .q72twk-x:hover{background:var(--accent-soft);color:var(--accent)}
  .q72twk-bd{padding:14px 12px;display:flex;flex-direction:column;gap:16px;max-height:70vh;overflow-y:auto}
  .q72twk-row{display:flex;flex-direction:column;gap:8px}
  .q72twk-lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-mute,#7f978e);display:flex;justify-content:space-between}
  .q72twk-lbl em{font-style:normal;color:var(--accent,#3DE8B0)}
  .q72twk-sw{display:flex;gap:7px}
  .q72twk-sw button{flex:1;height:30px;border:1px solid rgba(255,255,255,.08);border-radius:4px;cursor:pointer;position:relative}
  .q72twk-sw button[data-on="1"]{box-shadow:0 0 0 1.5px var(--accent),0 0 14px rgba(61,232,176,.4)}
  .q72twk-seg{display:flex;border:1px solid var(--line-2);border-radius:4px;overflow:hidden}
  .q72twk-seg button{flex:1;background:transparent;border:0;color:var(--text-mute);font-family:inherit;font-size:11px;padding:8px 4px;cursor:pointer;letter-spacing:.03em}
  .q72twk-seg button[data-on="1"]{background:var(--accent-soft);color:var(--accent)}
  .q72twk-rng{-webkit-appearance:none;appearance:none;width:100%;height:3px;background:var(--line-2);border-radius:99px;outline:none}
  .q72twk-rng::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent);cursor:pointer;box-shadow:0 0 10px rgba(61,232,176,.6)}
  .q72twk-rng::-moz-range-thumb{width:14px;height:14px;border:0;border-radius:50%;background:var(--accent);cursor:pointer}
  .q72twk-tg{width:38px;height:20px;border-radius:99px;border:1px solid var(--line-2);background:rgba(255,255,255,.06);position:relative;cursor:pointer;flex:none}
  .q72twk-tg[data-on="1"]{background:var(--accent-soft);border-color:var(--accent)}
  .q72twk-tg i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--text-mute);transition:transform .15s,background .15s}
  .q72twk-tg[data-on="1"] i{transform:translateX(18px);background:var(--accent);box-shadow:0 0 8px rgba(61,232,176,.7)}
  .q72twk-row-h{flex-direction:row;align-items:center;justify-content:space-between}
  .q72twk-txt{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--line-2);border-radius:4px;color:var(--text);font-family:var(--sans);font-size:12px;padding:8px 9px;outline:none;resize:vertical}
  .q72twk-txt:focus{border-color:var(--accent)}
  `;

  function buildPanel() {
    const cfg = window.Q72_TWEAKS_CONFIG || ["accent", "font", "matrix", "glow", "tagline", "poweredby"];
    const has = (k) => cfg.includes(k);
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const panel = document.createElement("div");
    panel.className = "q72twk";
    panel.setAttribute("data-omelette-chrome", "");
    panel.style.display = "none";

    const rows = [];
    if (has("accent")) rows.push(`<div class="q72twk-row"><div class="q72twk-lbl"><span>Accent</span></div><div class="q72twk-sw" data-ctl="accent">${ACCENTS.map((a) => `<button data-v="${a.v}" style="background:${a.v}" title="${a.n}"></button>`).join("")}</div></div>`);
    if (has("font")) rows.push(`<div class="q72twk-row"><div class="q72twk-lbl"><span>Typeface</span></div><div class="q72twk-seg" data-ctl="font">${FONTS.map((f) => `<button data-v="${f.v}">${f.l}</button>`).join("")}</div></div>`);
    if (has("matrix")) rows.push(`<div class="q72twk-row"><div class="q72twk-lbl"><span>Matrix speed</span><em data-val="matrix"></em></div><input type="range" class="q72twk-rng" data-ctl="matrix" min="0.2" max="2.5" step="0.1"></div>`);
    if (has("glow")) rows.push(`<div class="q72twk-row q72twk-row-h"><div class="q72twk-lbl"><span>Neon glow</span></div><div class="q72twk-tg" data-ctl="glow"><i></i></div></div>`);
    if (has("tagline")) rows.push(`<div class="q72twk-row"><div class="q72twk-lbl"><span>Tagline</span></div><textarea class="q72twk-txt" rows="2" data-ctl="tagline"></textarea></div>`);
    if (has("poweredby")) rows.push(`<div class="q72twk-row"><div class="q72twk-lbl"><span>Data powered by</span></div><textarea class="q72twk-txt" rows="1" data-ctl="poweredby"></textarea></div>`);

    panel.innerHTML = `<div class="q72twk-hd"><b>Tweaks</b><button class="q72twk-x">✕</button></div><div class="q72twk-bd">${rows.join("")}</div>`;
    document.body.appendChild(panel);

    function sync() {
      panel.querySelectorAll('[data-ctl="accent"] button').forEach((b) => b.setAttribute("data-on", b.dataset.v === state.accent ? "1" : "0"));
      panel.querySelectorAll('[data-ctl="font"] button').forEach((b) => b.setAttribute("data-on", b.dataset.v === state.font ? "1" : "0"));
      const rng = panel.querySelector('[data-ctl="matrix"]'); if (rng) rng.value = state.matrix;
      const mv = panel.querySelector('[data-val="matrix"]'); if (mv) mv.textContent = state.matrix.toFixed(1) + "×";
      const tg = panel.querySelector('[data-ctl="glow"]'); if (tg) tg.setAttribute("data-on", state.glow ? "1" : "0");
      const tl = panel.querySelector('[data-ctl="tagline"]'); if (tl) tl.value = state.tagline;
      const pb = panel.querySelector('[data-ctl="poweredby"]'); if (pb) pb.value = state.poweredby;
    }
    sync();

    panel.querySelector('[data-ctl="accent"]')?.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return; set("accent", b.dataset.v); sync();
    });
    panel.querySelector('[data-ctl="font"]')?.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return; set("font", b.dataset.v); sync();
    });
    panel.querySelector('[data-ctl="matrix"]')?.addEventListener("input", (e) => { set("matrix", parseFloat(e.target.value)); sync(); });
    panel.querySelector('[data-ctl="glow"]')?.addEventListener("click", () => { set("glow", !state.glow); sync(); });
    panel.querySelector('[data-ctl="tagline"]')?.addEventListener("input", (e) => set("tagline", e.target.value));
    panel.querySelector('[data-ctl="poweredby"]')?.addEventListener("input", (e) => set("poweredby", e.target.value));

    // dragging
    const hd = panel.querySelector(".q72twk-hd");
    let off = { x: 18, y: 18 };
    hd.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("q72twk-x")) return;
      const r = panel.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY;
      const sr = window.innerWidth - r.right, sb = window.innerHeight - r.bottom;
      const mv = (ev) => {
        off = { x: Math.max(8, sr - (ev.clientX - sx)), y: Math.max(8, sb - (ev.clientY - sy)) };
        panel.style.right = off.x + "px"; panel.style.bottom = off.y + "px";
      };
      const up = () => { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); };
      document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up);
    });

    panel.querySelector(".q72twk-x").addEventListener("click", () => {
      panel.style.display = "none";
      try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch (e) {}
    });

    // host protocol
    window.addEventListener("message", (e) => {
      const t = e?.data?.type;
      if (t === "__activate_edit_mode") { panel.style.display = "block"; sync(); }
      else if (t === "__deactivate_edit_mode") panel.style.display = "none";
    });
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildPanel);
  else buildPanel();
})();
