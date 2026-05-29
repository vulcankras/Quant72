/* ============================================================
   app-cards.jsx — Quant72 tool cards (rich result renderers)
   Exports card components + chart helpers to window.
   ============================================================ */
const { fmtPrice } = window.Q72;

function Pct({ v, sign = true }) {
  const up = v >= 0;
  return <span className={"pct " + (up ? "up" : "down")}>{up && sign ? "+" : ""}{v.toFixed(up || v === 0 ? 1 : 1)}%</span>;
}

/* ---------- sparkline ---------- */
function Spark({ data, w = 72, h = 26, up = true }) {
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => `${(i * step).toFixed(1)},${(h - ((d - min) / rng) * h).toFixed(1)}`).join(" ");
  const col = up ? "var(--up)" : "var(--down)";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- candlestick chart ---------- */
function CandleChart({ data, height = 180 }) {
  const W = 720, H = height, padT = 12, padB = 18;
  const lows = data.map((d) => d.l), highs = data.map((d) => d.h);
  const min = Math.min(...lows), max = Math.max(...highs), rng = max - min || 1;
  const innerH = H - padT - padB;
  const y = (v) => padT + innerH - ((v - min) / rng) * innerH;
  const step = W / data.length;
  const cw = Math.max(2, step * 0.58);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => padT + innerH * f);
  return (
    <div className="chart-wrap">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", height: H }}>
        {grid.map((gy, i) => (
          <line key={i} x1="0" x2={W} y1={gy} y2={gy} stroke="rgba(61,232,176,0.07)" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const up = d.c >= d.o;
          const cx = i * step + step / 2;
          const col = up ? "var(--up)" : "var(--down)";
          return (
            <g key={i}>
              <line x1={cx} x2={cx} y1={y(d.h)} y2={y(d.l)} stroke={col} strokeWidth="1" opacity="0.7" />
              <rect x={cx - cw / 2} y={Math.min(y(d.o), y(d.c))} width={cw}
                    height={Math.max(1.5, Math.abs(y(d.o) - y(d.c)))} fill={col} opacity={up ? 0.9 : 0.8} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- PRICE ---------- */
function PriceCard({ sym }) {
  const t = window.Q72.TOKENS[sym];
  const [tf, setTf] = React.useState("4H");
  const series = React.useMemo(() => window.Q72.candles(sym, 48), [sym]);
  return (
    <div className="tc">
      <div className="tc-hd">
        <div className="l"><span className="tag">FETCH_PRICE</span><span className="nm">{sym}<small>{t.name}</small></span></div>
        <Pct v={t.chg} />
      </div>
      <div className="tc-bd">
        <div className="pc-top">
          <span className="pc-price">{fmtPrice(t.price)}</span>
          <span className="mute mono" style={{ fontSize: 12 }}>24h</span>
        </div>
        <div className="tf-row">
          {["1H", "4H", "1D", "1W"].map((x) => (
            <button key={x} className={"tf-btn " + (x === tf ? "on" : "")} onClick={() => setTf(x)}>{x}</button>
          ))}
        </div>
        <CandleChart data={series} />
        <div className="pc-stats">
          <div className="pc-stat"><div className="k">Market Cap</div><div className="v">${t.mc}</div></div>
          <div className="pc-stat"><div className="k">24h Vol</div><div className="v">${t.vol}</div></div>
          <div className="pc-stat"><div className="k">24h High</div><div className="v">{fmtPrice(Math.max(...series.map((c) => c.h)))}</div></div>
          <div className="pc-stat"><div className="k">24h Low</div><div className="v">{fmtPrice(Math.min(...series.map((c) => c.l)))}</div></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- INFERENCE ---------- */
function InferenceCard({ sym }) {
  const rows = React.useMemo(() => window.Q72.inference(sym), [sym]);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.deltaPct)), 0.5);
  return (
    <div className="tc">
      <div className="tc-hd">
        <div className="l"><span className="tag">GET_PRICE_INFERENCE</span><span className="nm">{sym} forecast</span></div>
        <span className="mono mute" style={{ fontSize: 11 }}>via Allora</span>
      </div>
      <div className="tc-bd">
        {rows.map((r) => (
          <div className="inf-row" key={r.tf}>
            <span className="inf-tf">{r.tf}</span>
            <span className="inf-px">{fmtPrice(r.price)}</span>
            <span className="inf-bar"><i style={{ width: (Math.abs(r.deltaPct) / maxAbs) * 100 + "%", background: r.deltaPct >= 0 ? "var(--up)" : "var(--down)" }} /></span>
            <span style={{ width: 58, textAlign: "right" }}><Pct v={r.deltaPct} /></span>
            <span className="inf-conf">{r.conf}%</span>
          </div>
        ))}
        <div className="mono mute" style={{ fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
          Confidence reflects model agreement across the Allora topic network. Not financial advice.
        </div>
      </div>
    </div>
  );
}

/* ---------- TRENDING ---------- */
function TrendingCard() {
  const rows = React.useMemo(() => window.Q72.trending(), []);
  return (
    <div className="tc">
      <div className="tc-hd">
        <div className="l"><span className="tag">TRENDING_TOKENS</span><span className="nm">Trending on Solana</span></div>
        <span className="mono mute" style={{ fontSize: 11 }}>CoinGecko · ELFA</span>
      </div>
      <div className="tc-bd">
        {rows.map((r) => (
          <div className="lrow" key={r.sym}>
            <span className="rk">{r.rank}</span>
            <span className="sy">{r.sym}<small>{r.name}</small></span>
            <Spark data={r.spark} up={r.chg >= 0} />
            <span className="pxr">{fmtPrice(r.price)}<br /><Pct v={r.chg} /></span>
            <span className="vol">${r.vol}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- GAINERS ---------- */
function GainersCard() {
  const rows = React.useMemo(() => window.Q72.topGainers(), []);
  return (
    <div className="tc">
      <div className="tc-hd">
        <div className="l"><span className="tag">TOP_GAINERS</span><span className="nm">Top gainers · 24h</span></div>
      </div>
      <div className="tc-bd">
        {rows.map((r) => (
          <div className="lrow" key={r.sym}>
            <span className="rk">{r.rank}</span>
            <span className="sy">{r.sym}<small>{r.name}</small></span>
            <Spark data={r.spark} up={true} />
            <span className="pxr">{fmtPrice(r.price)}</span>
            <span style={{ width: 64, textAlign: "right" }}><Pct v={r.chg} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- POOLS ---------- */
function PoolsCard() {
  const rows = React.useMemo(() => window.Q72.pools(), []);
  return (
    <div className="tc">
      <div className="tc-hd">
        <div className="l"><span className="tag">TRENDING_POOLS</span><span className="nm">Hot liquidity pools</span></div>
      </div>
      <div className="tc-bd">
        <div className="pool-row hd"><span>Pool</span><span style={{ textAlign: "right" }}>TVL</span><span style={{ textAlign: "right" }}>24h Vol</span><span style={{ textAlign: "right" }}>APR</span></div>
        {rows.map((r) => (
          <div className="pool-row" key={r.pair}>
            <span className="pr">{r.pair}<small>{r.dex}</small></span>
            <span className="num">${r.tvl}</span>
            <span className="num">${r.vol}</span>
            <span className="num" style={{ color: "var(--accent)" }}>{r.apr}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- NARRATIVE ---------- */
function NarrativeCard() {
  const rows = React.useMemo(() => window.Q72.narratives(), []);
  return (
    <div className="tc">
      <div className="tc-hd">
        <div className="l"><span className="tag">GET_ALL_TOPICS</span><span className="nm">Active narratives</span></div>
        <span className="mono mute" style={{ fontSize: 11 }}>Allora · ELFA</span>
      </div>
      <div className="tc-bd">
        {rows.map((r) => (
          <div className="nar" key={r.topic}>
            <div className="nar-top">
              <div>
                <div className="nar-name">{r.topic}</div>
                <div className="nar-meta"><span>momentum {r.momentum}</span><span>·</span><span>{r.mentions} mentions</span></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Pct v={r.chg} />
                <div className="nar-toks" style={{ marginTop: 6 }}>
                  {r.tokens.map((t) => <span className="nar-tok" key={t}>${t}</span>)}
                </div>
              </div>
            </div>
            <div className="nar-bar"><i style={{ width: r.momentum + "%" }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- MENTIONS ---------- */
function MentionsCard({ sym }) {
  const data = React.useMemo(() => window.Q72.mentions(sym), [sym]);
  return (
    <div className="tc">
      <div className="tc-hd">
        <div className="l"><span className="tag">SMART_MENTIONS</span><span className="nm">${sym} smart mentions</span></div>
        <span className="mono mute" style={{ fontSize: 11 }}>via ELFA</span>
      </div>
      <div className="tc-bd">
        <div className="ment-hd">
          <div className="gauge">
            <span className="big" style={{ color: data.bullish >= 60 ? "var(--up)" : data.bullish >= 40 ? "var(--warn)" : "var(--down)" }}>{data.bullish}%</span>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{data.bullish >= 60 ? "Bullish" : data.bullish >= 40 ? "Mixed" : "Bearish"}</div><div className="mono mute" style={{ fontSize: 11 }}>smart-money sentiment</div></div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }} className="mono mute">
            <div style={{ fontSize: 18, color: "var(--text)", fontWeight: 600 }}>{data.count}</div>
            <div style={{ fontSize: 11 }}>mentions · 24h</div>
          </div>
        </div>
        {data.items.map((m, i) => (
          <div className="ment" key={i}>
            <span className={"sent-dot sent-" + m.sent}></span>
            <div>
              <span className="ah">{m.h}</span> <span className="meta">· {m.f} followers · smart {m.smart} · {m.hrs}h ago</span>
              <div className="tx">{m.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- ANALYSIS ---------- */
function AnalysisCard({ sym }) {
  const a = React.useMemo(() => window.Q72.analyze(sym), [sym]);
  const col = a.grade === "LOW" ? "var(--up)" : a.grade === "MEDIUM" ? "var(--warn)" : "var(--down)";
  const R = 40, C = 2 * Math.PI * R, off = C * (1 - a.risk / 100);
  return (
    <div className="tc">
      <div className="tc-hd">
        <div className="l"><span className="tag">GET_ASSET</span><span className="nm">{sym} analysis<small>{a.name}</small></span></div>
        <span className="pill" style={{ color: col, borderColor: col }}>{a.grade} RISK</span>
      </div>
      <div className="tc-bd">
        <div className="an-top">
          <div className="risk-ring">
            <svg width="92" height="92" viewBox="0 0 92 92">
              <circle cx="46" cy="46" r={R} fill="none" stroke="var(--bg-3)" strokeWidth="7" />
              <circle cx="46" cy="46" r={R} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 46 46)" />
            </svg>
            <div className="lab"><div><b style={{ color: col }}>{a.risk}</b><span>RISK</span></div></div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="pc-stats" style={{ marginTop: 0, gridTemplateColumns: "1fr 1fr" }}>
              <div className="pc-stat"><div className="k">Holders</div><div className="v">{a.holders}</div></div>
              <div className="pc-stat"><div className="k">Liquidity</div><div className="v">{a.liq}/100</div></div>
              <div className="pc-stat"><div className="k">Top-10 hold</div><div className="v">{a.top10}%</div></div>
              <div className="pc-stat"><div className="k">Market Cap</div><div className="v">${a.mc}</div></div>
            </div>
          </div>
        </div>
        <div className="an-checks">
          {a.checks.map((c) => (
            <div className="an-check" key={c.k}>
              <span className={"ck " + (c.ok ? "ok" : "no")}>{c.ok ? "✓" : "✕"}</span>
              <span>{c.k}</span>
              <span className="v">{c.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- WALLET ---------- */
function WalletCard() {
  const w = React.useMemo(() => window.Q72.wallet(), []);
  return (
    <div className="tc">
      <div className="tc-hd">
        <div className="l"><span className="tag">TOKEN_BALANCES</span><span className="nm">Portfolio</span></div>
        <span className="mono mute" style={{ fontSize: 11 }}>{w.addr}</span>
      </div>
      <div className="tc-bd">
        <div className="wal-top">
          <span className="wal-total">${w.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          <span className="mono mute" style={{ fontSize: 12 }}>{w.holds.length} assets</span>
        </div>
        {w.holds.map((h) => (
          <div className="wal-row" key={h.sym}>
            <span className="sy">{h.sym}</span>
            <span className="amt">{h.amt.toLocaleString("en-US")} {h.sym}</span>
            <span style={{ marginLeft: "auto", textAlign: "right" }}>
              <span className="val">${h.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              <br /><Pct v={h.chg} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  Pct, Spark, CandleChart, PriceCard, InferenceCard, TrendingCard,
  GainersCard, PoolsCard, NarrativeCard, MentionsCard, AnalysisCard, WalletCard,
});
