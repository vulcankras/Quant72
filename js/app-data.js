/* ============================================================
   app-data.js — Quant72 terminal demo data engine
   Deterministic mock generators so the chatbot feels real
   offline. Attaches Q72 to window.
   ============================================================ */
(function () {
  // seeded RNG so the same token always renders the same chart
  function rng(seed) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  const TOKENS = {
    SOL:   { name: "Solana",        price: 172.40, chg: 4.2,  mc: "82.4B", vol: "3.1B",  cat: "L1" },
    JUP:   { name: "Jupiter",       price: 0.91,   chg: 1.8,  mc: "1.2B",  vol: "210M",  cat: "DEX" },
    BONK:  { name: "Bonk",          price: 0.0000241, chg: -3.1, mc: "1.7B", vol: "340M", cat: "Meme" },
    WIF:   { name: "dogwifhat",     price: 2.84,   chg: 6.7,  mc: "2.8B",  vol: "520M",  cat: "Meme" },
    JTO:   { name: "Jito",          price: 3.12,   chg: -0.9, mc: "420M",  vol: "88M",   cat: "LST" },
    PYTH:  { name: "Pyth Network",  price: 0.42,   chg: 2.3,  mc: "1.5B",  vol: "120M",  cat: "Oracle" },
    RAY:   { name: "Raydium",       price: 5.67,   chg: 0.4,  mc: "1.6B",  vol: "180M",  cat: "DEX" },
    ORCA:  { name: "Orca",          price: 4.01,   chg: -1.7, mc: "230M",  vol: "42M",   cat: "DEX" },
    HNT:   { name: "Helium",        price: 6.84,   chg: 9.1,  mc: "1.1B",  vol: "95M",   cat: "DePIN" },
    RENDER:{ name: "Render",        price: 8.12,   chg: -2.4, mc: "4.2B",  vol: "210M",  cat: "DePIN" },
    JLP:   { name: "Jupiter LP",    price: 4.55,   chg: 0.8,  mc: "1.3B",  vol: "30M",   cat: "Yield" },
    W:     { name: "Wormhole",      price: 0.31,   chg: 3.4,  mc: "640M",  vol: "70M",   cat: "Infra" },
  };

  function fmtPrice(p) {
    if (p >= 1) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 0.01) return "$" + p.toFixed(4);
    return "$" + p.toFixed(8).replace(/0+$/, "");
  }

  function resolveToken(text) {
    const up = text.toUpperCase();
    for (const k of Object.keys(TOKENS)) {
      if (up.includes("$" + k) || new RegExp("\\b" + k + "\\b").test(up)) return k;
    }
    for (const k of Object.keys(TOKENS)) {
      if (text.toLowerCase().includes(TOKENS[k].name.toLowerCase())) return k;
    }
    return null;
  }

  // ---- candlestick series ----
  function candles(sym, n) {
    n = n || 48;
    const t = TOKENS[sym] || TOKENS.SOL;
    const r = rng(sym + "candles");
    let price = t.price / (1 + t.chg / 100);
    const out = [];
    const drift = (t.price - price) / n;
    for (let i = 0; i < n; i++) {
      const o = price;
      const vol = price * (0.012 + r() * 0.03);
      const c = o + drift + (r() - 0.5) * vol;
      const h = Math.max(o, c) + r() * vol * 0.8;
      const l = Math.min(o, c) - r() * vol * 0.8;
      out.push({ o, h, l, c: Math.max(c, 0.0000001), v: r() });
      price = c;
    }
    // pin last close to current price
    out[out.length - 1].c = t.price;
    return out;
  }

  // ---- price inference (Allora-style) ----
  function inference(sym) {
    const t = TOKENS[sym] || TOKENS.SOL;
    const r = rng(sym + "infer");
    const tf = ["5m", "15m", "1h", "6h", "24h"];
    let p = t.price;
    return tf.map((f, i) => {
      const bias = (t.chg / 100) * (0.15 + i * 0.22);
      p = p * (1 + bias / 5 + (r() - 0.5) * 0.012);
      const conf = Math.round(82 - i * 6 + r() * 6);
      return { tf: f, price: p, deltaPct: ((p - t.price) / t.price) * 100, conf };
    });
  }

  // ---- trending tokens ----
  function trending() {
    const order = ["WIF", "HNT", "SOL", "JUP", "RENDER", "PYTH", "BONK", "RAY"];
    return order.map((s, i) => ({
      rank: i + 1, sym: s, name: TOKENS[s].name, price: TOKENS[s].price,
      chg: TOKENS[s].chg, vol: TOKENS[s].vol, spark: spark(s),
    }));
  }

  function topGainers() {
    return [
      { sym: "HNT", name: "Helium", price: 6.84, chg: 9.1, vol: "95M" },
      { sym: "WIF", name: "dogwifhat", price: 2.84, chg: 6.7, vol: "520M" },
      { sym: "SOL", name: "Solana", price: 172.40, chg: 4.2, vol: "3.1B" },
      { sym: "W", name: "Wormhole", price: 0.31, chg: 3.4, vol: "70M" },
      { sym: "PYTH", name: "Pyth", price: 0.42, chg: 2.3, vol: "120M" },
    ].map((x, i) => ({ ...x, rank: i + 1, spark: spark(x.sym) }));
  }

  function pools() {
    return [
      { pair: "SOL / USDC", dex: "Orca",     tvl: "48.2M", vol: "121M", apr: 28.4, chg: 3.1 },
      { pair: "WIF / SOL",  dex: "Raydium",  tvl: "12.7M", vol: "64M",  apr: 91.2, chg: 14.7 },
      { pair: "JUP / USDC", dex: "Orca",     tvl: "9.4M",  vol: "33M",  apr: 41.6, chg: -2.2 },
      { pair: "HNT / SOL",  dex: "Fluxbeam", tvl: "3.1M",  vol: "18M",  apr: 122.8, chg: 22.3 },
      { pair: "JTO / USDC", dex: "Raydium",  tvl: "6.8M",  vol: "11M",  apr: 19.7, chg: 1.4 },
    ];
  }

  // ---- narratives / topics (Allora) ----
  function narratives() {
    return [
      { topic: "AI Agents",   momentum: 94, chg: 18.2, tokens: ["RENDER", "W"], mentions: "12.4K" },
      { topic: "DePIN",       momentum: 88, chg: 12.7, tokens: ["HNT", "RENDER"], mentions: "8.9K" },
      { topic: "Solana Memes",momentum: 81, chg: -6.3, tokens: ["WIF", "BONK"], mentions: "21.7K" },
      { topic: "LSTs",        momentum: 67, chg: 4.1,  tokens: ["JTO", "JLP"], mentions: "3.2K" },
      { topic: "RWA",         momentum: 59, chg: 9.8,  tokens: ["PYTH"], mentions: "5.6K" },
      { topic: "DEX Wars",    momentum: 52, chg: -1.2, tokens: ["JUP", "RAY", "ORCA"], mentions: "4.8K" },
    ];
  }

  // ---- smart mentions (ELFA) ----
  function mentions(sym) {
    sym = sym || "SOL";
    const r = rng(sym + "mentions");
    const accts = [
      { h: "@AnselTrades", f: "284K", smart: 96 },
      { h: "@onchainwizard", f: "121K", smart: 91 },
      { h: "@DeFiDegen", f: "88K", smart: 84 },
      { h: "@SolWhale", f: "203K", smart: 89 },
      { h: "@quant_sol", f: "47K", smart: 78 },
    ];
    const snips = {
      pos: ["accumulating here, structure looks clean", "this is the rotation everyone missed", "bid support holding strong, adding", "narrative + flows aligning nicely"],
      neg: ["taking profit into strength", "watching for a deeper retrace first", "liquidity thinning, careful up here"],
      neu: ["range-bound, waiting for a break", "tracking funding on this one", "neutral until volume confirms"],
    };
    const out = accts.map((a) => {
      const roll = r();
      const sent = roll > 0.55 ? "pos" : roll > 0.3 ? "neu" : "neg";
      const lib = snips[sent];
      return { ...a, sent, text: `$${sym} ${lib[(r() * lib.length) | 0]}`, hrs: (1 + (r() * 11) | 0) };
    });
    const pos = out.filter((o) => o.sent === "pos").length;
    const score = Math.round((pos / out.length) * 100);
    return { items: out, bullish: score, count: "1,284", smartCount: out.length };
  }

  // ---- token deep analysis ----
  function analyze(sym) {
    sym = sym || "SOL";
    const t = TOKENS[sym] || TOKENS.SOL;
    const r = rng(sym + "analyze");
    const liq = (t.cat === "Meme") ? 0.4 + r() * 0.3 : 0.7 + r() * 0.25;
    const holders = (t.cat === "Meme") ? (40000 + (r() * 80000 | 0)) : (120000 + (r() * 400000 | 0));
    const top10 = (t.cat === "Meme") ? 38 + r() * 22 : 14 + r() * 12;
    const mintRevoked = t.cat !== "Meme" || r() > 0.4;
    let risk = 0;
    risk += top10 > 35 ? 30 : top10 > 22 ? 16 : 6;
    risk += liq < 0.5 ? 26 : liq < 0.75 ? 12 : 4;
    risk += mintRevoked ? 0 : 24;
    risk += t.cat === "Meme" ? 14 : 4;
    risk = Math.min(96, Math.max(6, Math.round(risk + (r() * 8 - 4))));
    const grade = risk < 25 ? "LOW" : risk < 55 ? "MEDIUM" : "HIGH";
    return {
      sym, name: t.name, price: t.price, chg: t.chg, cat: t.cat,
      mc: t.mc, vol: t.vol,
      holders: holders.toLocaleString("en-US"),
      liq: Math.round(liq * 100),
      top10: top10.toFixed(1),
      mintRevoked, freezeRevoked: mintRevoked,
      lpBurned: liq > 0.6,
      risk, grade,
      checks: [
        { k: "Mint authority", ok: mintRevoked, v: mintRevoked ? "Revoked" : "Active ⚠" },
        { k: "Freeze authority", ok: mintRevoked, v: mintRevoked ? "Revoked" : "Active ⚠" },
        { k: "LP burned / locked", ok: liq > 0.6, v: liq > 0.6 ? "Yes" : "Partial" },
        { k: "Top-10 holders", ok: top10 < 30, v: top10.toFixed(1) + "%" },
        { k: "Liquidity depth", ok: liq > 0.6, v: Math.round(liq * 100) + " / 100" },
      ],
    };
  }

  // ---- wallet portfolio ----
  function wallet() {
    const holds = [
      { sym: "SOL", amt: 42.6, price: 172.40 },
      { sym: "JUP", amt: 8200, price: 0.91 },
      { sym: "WIF", amt: 540, price: 2.84 },
      { sym: "JTO", amt: 310, price: 3.12 },
      { sym: "PYTH", amt: 6400, price: 0.42 },
    ].map((h) => ({ ...h, value: h.amt * h.price, chg: TOKENS[h.sym].chg }));
    const total = holds.reduce((s, h) => s + h.value, 0);
    return { addr: "7xKQ…tV3a", total, holds: holds.sort((a, b) => b.value - a.value) };
  }

  // small sparkline series
  function spark(sym) {
    const r = rng(sym + "spark");
    const t = TOKENS[sym] || TOKENS.SOL;
    const pts = [];
    let p = 50;
    for (let i = 0; i < 22; i++) { p += (r() - 0.5) * 14 + (t.chg > 0 ? 0.7 : -0.7); pts.push(p); }
    return pts;
  }

  window.Q72 = {
    TOKENS, fmtPrice, resolveToken, candles, inference, trending,
    topGainers, pools, narratives, mentions, analyze, wallet, spark, rng,
  };
})();
