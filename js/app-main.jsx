/* ============================================================
   app-main.jsx — Quant72 terminal chat app
   Intent routing → tool cards + Claude-generated commentary
   (graceful template fallback when window.claude is absent).
   ============================================================ */
const { useState, useRef, useEffect, useCallback } = React;
const Q = window.Q72;

/* ---- intent routing ---- */
function route(text) {
  const s = text.toLowerCase();
  const sym = Q.resolveToken(text);
  const has = (...w) => w.some((x) => s.includes(x));

  if (has("portfolio", "my wallet", "my balance", "my holdings", "my bag")) return { tool: "wallet" };
  if (has("trending pool", "hot pool", "pools")) return { tool: "pools" };
  if (has("gainer", "top gain", "biggest move", "pumping")) return { tool: "gainers" };
  if (has("trending", "what's hot", "whats hot", "hot right now", "trending token")) return { tool: "trending" };
  if (has("narrative", "topic", "rotation", "heating", "meta ", "themes")) return { tool: "narrative" };
  if (has("mention", "sentiment", "twitter", " x ", "social", "smart money", "saying")) return { tool: "mentions", sym: sym || "SOL" };
  if (has("forecast", "predict", "inference", "where will", "target", "next ", "going to")) return { tool: "inference", sym: sym || "SOL" };
  if (has("analyze", "analysis", "rug", "risk", "safe", "audit", "scam", "legit", "check ")) return { tool: "analysis", sym: sym || "SOL" };
  if (has("price", "chart", "how much", "value", "trading at", "candle")) return { tool: "price", sym: sym || "SOL" };
  if (sym) return { tool: "price", sym };
  return { tool: "help" };
}

/* ---- facts string for both Claude + template fallback ---- */
function facts(intent) {
  const { tool, sym } = intent;
  const t = sym ? Q.TOKENS[sym] : null;
  switch (tool) {
    case "price": return `Tool FETCH_PRICE on ${sym} (${t.name}). Price ${Q.fmtPrice(t.price)}, 24h ${t.chg > 0 ? "+" : ""}${t.chg}%, mcap $${t.mc}, vol $${t.vol}, category ${t.cat}.`;
    case "inference": {
      const inf = Q.inference(sym);
      const last = inf[inf.length - 1];
      return `Tool GET_PRICE_INFERENCE on ${sym}. Current ${Q.fmtPrice(t.price)}. Allora 24h forecast ${Q.fmtPrice(last.price)} (${last.deltaPct > 0 ? "+" : ""}${last.deltaPct.toFixed(1)}%), confidence ${last.conf}%. 1h forecast delta ${inf[2].deltaPct.toFixed(1)}%.`;
    }
    case "trending": { const tr = Q.trending(); return `Tool TRENDING_TOKENS. Top 3: ${tr.slice(0, 3).map((x) => `${x.sym} ${x.chg > 0 ? "+" : ""}${x.chg}%`).join(", ")}. Source CoinGecko + ELFA.`; }
    case "gainers": { const g = Q.topGainers(); return `Tool TOP_GAINERS 24h. Leaders: ${g.slice(0, 3).map((x) => `${x.sym} +${x.chg}%`).join(", ")}.`; }
    case "pools": { const p = Q.pools(); return `Tool TRENDING_POOLS. Hottest: ${p[1].pair} (${p[1].dex}) APR ${p[1].apr}% vol $${p[1].vol}; ${p[3].pair} APR ${p[3].apr}%.`; }
    case "narrative": { const n = Q.narratives(); return `Tool GET_ALL_TOPICS. Leading narratives: ${n.slice(0, 3).map((x) => `${x.topic} (momentum ${x.momentum}, ${x.chg > 0 ? "+" : ""}${x.chg}%)`).join("; ")}.`; }
    case "mentions": { const m = Q.mentions(sym); return `Tool SMART_MENTIONS on ${sym}. ${m.count} mentions/24h, smart-money sentiment ${m.bullish}% bullish.`; }
    case "analysis": { const a = Q.analyze(sym); return `Tool GET_ASSET on ${sym} (${a.name}). Risk ${a.risk}/100 (${a.grade}). Holders ${a.holders}, top-10 hold ${a.top10}%, liquidity ${a.liq}/100, mint authority ${a.mintRevoked ? "revoked" : "ACTIVE"}.`; }
    case "wallet": { const w = Q.wallet(); return `Tool TOKEN_BALANCES. Portfolio $${w.total.toLocaleString("en-US", { maximumFractionDigits: 0 })} across ${w.holds.length} assets, largest ${w.holds[0].sym}.`; }
    default: return "General greeting / capability question.";
  }
}

/* ---- template fallback commentary ---- */
function template(intent) {
  const { tool, sym } = intent;
  const t = sym ? Q.TOKENS[sym] : null;
  switch (tool) {
    case "price": return `${sym} is trading at ${Q.fmtPrice(t.price)}, ${t.chg >= 0 ? "up" : "down"} ${Math.abs(t.chg)}% on the day with $${t.vol} in volume. Here's the recent candle structure and the key levels.`;
    case "inference": { const inf = Q.inference(sym); const l = inf[inf.length - 1]; return `Allora's models lean ${l.deltaPct >= 0 ? "bullish" : "bearish"} on ${sym} into the next 24h, projecting ${Q.fmtPrice(l.price)} (${l.deltaPct >= 0 ? "+" : ""}${l.deltaPct.toFixed(1)}%) at ${l.conf}% confidence. Treat shorter timeframes as higher-conviction.`; }
    case "trending": return `Here's what's rotating on Solana right now — flows are concentrating in the names below. Watch the ones pairing price strength with rising volume.`;
    case "gainers": return `Today's leaderboard. These are the strongest 24h movers — momentum is real but late entries carry chase risk.`;
    case "pools": return `The hottest liquidity right now. High-APR pools usually mean fresh volume or thinner TVL, so size accordingly.`;
    case "narrative": return `Capital is rotating across these themes. The momentum score blends mention velocity and price action — top narratives are where attention is compounding.`;
    case "mentions": { const m = Q.mentions(sym); return `Smart-money chatter on ${sym} is ${m.bullish}% bullish across ${m.count} mentions in the last 24h. Here's who's talking and what they're saying.`; }
    case "analysis": { const a = Q.analyze(sym); return `${sym} scores ${a.risk}/100 — ${a.grade.toLowerCase()} risk. ${a.mintRevoked ? "Authorities are revoked" : "Mint authority is still active ⚠"} and top-10 wallets hold ${a.top10}%. Full breakdown below.`; }
    case "wallet": { const w = Q.wallet(); return `Your portfolio is worth ~$${w.total.toLocaleString("en-US", { maximumFractionDigits: 0 })} across ${w.holds.length} assets, led by ${w.holds[0].sym}. Breakdown below.`; }
    default: return `I'm Quant72 — your on-chain copilot. Ask me for any token's price & chart, an Allora forecast, what's trending, the hot narratives, smart-money sentiment, a rug-risk analysis, or your portfolio.`;
  }
}

async function commentary(intent, question) {
  if (window.claude && window.claude.complete) {
    try {
      const sys = "You are Quant72, a terminal-native DeFi trading copilot for Solana. You just executed an MCP tool. Given the FACTS, write a sharp 2-3 sentence analyst read for the user. Reference the actual numbers, end with one concise actionable note. No markdown, no headers, no bullet lists, no emojis. Never invent numbers beyond the facts. This is not financial advice but don't be preachy.";
      const out = await window.claude.complete({
        messages: [{ role: "user", content: `${sys}\n\nFACTS: ${facts(intent)}\n\nUSER ASKED: "${question}"\n\nYour read:` }],
      });
      if (out && out.trim()) return out.trim();
    } catch (e) { /* fall through */ }
  }
  return template(intent);
}

function ToolCard({ intent }) {
  switch (intent.tool) {
    case "price": return <PriceCard sym={intent.sym} />;
    case "inference": return <InferenceCard sym={intent.sym} />;
    case "trending": return <TrendingCard />;
    case "gainers": return <GainersCard />;
    case "pools": return <PoolsCard />;
    case "narrative": return <NarrativeCard />;
    case "mentions": return <MentionsCard sym={intent.sym} />;
    case "analysis": return <AnalysisCard sym={intent.sym} />;
    case "wallet": return <WalletCard />;
    default: return null;
  }
}

const CHIPS = [
  "What's trending on Solana?",
  "Price & chart for SOL",
  "6h forecast for WIF",
  "Analyze BONK for rug risk",
  "Which narratives are heating up?",
  "Top gainers today",
  "Smart-money sentiment on JUP",
  "Show my portfolio",
];

const WELCOME = [
  { gl: "▤", h: "Price & charts", d: "price + chart for $SOL", q: "Show me the price and chart for SOL" },
  { gl: "◊", h: "Allora forecast", d: "6h forecast for $WIF", q: "What's the 6h price forecast for WIF?" },
  { gl: "↗", h: "Trending radar", d: "what's hot on solana", q: "What's trending on Solana right now?" },
  { gl: "◈", h: "Narratives", d: "topics heating up", q: "Which narratives are heating up?" },
  { gl: "◎", h: "Rug analysis", d: "analyze $BONK risk", q: "Analyze BONK for rug risk" },
  { gl: "✦", h: "Smart mentions", d: "$JUP sentiment", q: "What's smart-money sentiment on JUP?" },
];

function Message({ m }) {
  if (m.role === "user") {
    return (
      <div className="msg user">
        <div className="av">›_</div>
        <div className="body"><div className="bubble">{m.text}</div></div>
      </div>
    );
  }
  return (
    <div className="msg ai">
      <div className="av"><img src="assets/logo.jpg" alt="Q" /></div>
      <div className="body">
        {m.loading
          ? <div className="txt"><span className="ldr">Running <span className="accent mono">{m.action}</span></span> <span className="typing"><i></i><i></i><i></i></span></div>
          : <div className="txt">{m.text}</div>}
        {m.intent && !m.loading && <div className="cards"><ToolCard intent={m.intent} /></div>}
      </div>
    </div>
  );
}

const ACTION_LABEL = {
  price: "FETCH_PRICE", inference: "GET_PRICE_INFERENCE", trending: "TRENDING_TOKENS",
  gainers: "TOP_GAINERS", pools: "TRENDING_POOLS", narrative: "GET_ALL_TOPICS",
  mentions: "SMART_MENTIONS", analysis: "GET_ASSET", wallet: "TOKEN_BALANCES", help: "agent",
};

function App() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const threadRef = useRef(null);
  const taRef = useRef(null);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      const el = threadRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  useEffect(scrollDown, [msgs, scrollDown]);

  // deep-link: app.html?q=... auto-runs a query (used by the Guide)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) { const t = setTimeout(() => send(q), 350); return () => clearTimeout(t); }
  }, []); // eslint-disable-line

  async function send(text) {
    const q = (text != null ? text : input).trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    const intent = route(q);
    const id = Date.now();
    setMsgs((m) => [
      ...m,
      { id: id, role: "user", text: q },
      { id: id + 1, role: "ai", loading: true, action: ACTION_LABEL[intent.tool] },
    ]);
    // small artificial latency so the tool-run feels real
    await new Promise((r) => setTimeout(r, 520 + Math.random() * 480));
    const text2 = await commentary(intent, q);
    setMsgs((m) => m.map((x) => x.id === id + 1
      ? { ...x, loading: false, text: text2, intent: intent.tool === "help" ? null : intent }
      : x));
    setBusy(false);
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }
  function onInput(e) {
    setInput(e.target.value);
    const ta = taRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; }
  }

  const wallet = Q.wallet();

  return (
    <div className="app-shell">
      {/* sidebar */}
      <aside className="side">
        <div className="side-top">
          <a className="side-brand" href="index.html">
            <img src="assets/logo.jpg" alt="Quant72" />
            <span className="name">Quant72<b> AI</b></span>
          </a>
          <button className="new-chat" onClick={() => setMsgs([])}>＋ New session</button>
        </div>
        <div className="side-scroll">
          <div className="side-sect">
            <h6>Market tools</h6>
            <button className="tool-btn" onClick={() => send("What's trending on Solana right now?")}><span className="gl">↗</span> Trending tokens</button>
            <button className="tool-btn" onClick={() => send("Show trending liquidity pools")}><span className="gl">≈</span> Trending pools</button>
            <button className="tool-btn" onClick={() => send("Top gainers today")}><span className="gl">▲</span> Top gainers</button>
            <button className="tool-btn" onClick={() => send("Which narratives are heating up?")}><span className="gl">◈</span> Narratives</button>
          </div>
          <div className="side-sect">
            <h6>Token tools</h6>
            <button className="tool-btn" onClick={() => send("Price and chart for SOL")}><span className="gl">▤</span> Price &amp; chart</button>
            <button className="tool-btn" onClick={() => send("6h forecast for SOL")}><span className="gl">◊</span> Price forecast</button>
            <button className="tool-btn" onClick={() => send("Analyze BONK for rug risk")}><span className="gl">◎</span> Token analysis</button>
            <button className="tool-btn" onClick={() => send("Smart-money sentiment on JUP")}><span className="gl">✦</span> Smart mentions</button>
          </div>
          <div className="side-sect">
            <h6>Wallet</h6>
            <button className="tool-btn" onClick={() => send("Show my portfolio")}><span className="gl">◇</span> Portfolio</button>
          </div>
        </div>
        <div className="side-wallet">
          <div className="lbl">Demo wallet</div>
          <div className="val">${wallet.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
          <div className="addr"><span className="dot-on"></span>{wallet.addr} · Mainnet</div>
        </div>
        <div className="side-foot">
          <span>powered by <span className="accent">Hubble</span></span>
          <a href="docs.html">docs ↗</a>
        </div>
      </aside>

      {/* main */}
      <main className="main">
        <div className="app-bar">
          <div className="ttl">
            <span className="net-pill"><span className="dot-on"></span>Solana Mainnet</span>
            <span>quant72-mcp · v0.1.0</span>
          </div>
          <div className="app-bar-links">
            <a href="index.html">Home</a>
            <a href="docs.html">Docs</a>
            <a href="guide.html">Guide</a>
            <a href="https://x.com/MeetQuant72AI" target="_blank" rel="noopener">X ↗</a>
          </div>
        </div>

        <div className="thread" ref={threadRef}>
          <div className="thread-inner">
            {msgs.length === 0 && (
              <div className="welcome">
                <img src="assets/logo.jpg" alt="Quant72" />
                <h2>Talk to the market.</h2>
                <p>Your on-chain DeFi copilot for Solana. Ask in plain English — Quant72 runs the right MCP tool and reads the result back to you.</p>
                <div className="welcome-grid">
                  {WELCOME.map((w) => (
                    <div className="wc" key={w.h} onClick={() => send(w.q)}>
                      <div className="h"><span className="gl">{w.gl}</span>{w.h}</div>
                      <div className="d">{w.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m) => <Message key={m.id} m={m} />)}
          </div>
        </div>

        <div className="composer">
          <div className="composer-inner">
            <div className="chips">
              {CHIPS.map((c) => <button className="chip" key={c} onClick={() => send(c)} disabled={busy}>{c}</button>)}
            </div>
            <div className="input-row">
              <span className="chev">›_</span>
              <textarea ref={taRef} rows="1" value={input} placeholder="Ask Quant72 anything — price, forecast, trends, narratives, risk…"
                        onChange={onInput} onKeyDown={onKey} />
              <button className="send-btn" onClick={() => send()} disabled={busy || !input.trim()}>▶</button>
            </div>
            <div className="disclaimer">Quant72 demo · mock market data · responses are illustrative, not financial advice</div>
          </div>
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
