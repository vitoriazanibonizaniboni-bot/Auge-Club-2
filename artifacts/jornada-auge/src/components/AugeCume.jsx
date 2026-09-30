// ─── O CUME ──────────────────────────────────────────────────────────────────
// Cabeçalho da tela Hoje: uma montanha terracota num céu creme, com a trilha
// tracejada subindo a encosta e UMA luz que percorre a trilha conforme a semana
// avança. t = 0 deixa a luz na base; t = 1 leva ao cume. Sem números na tela.
//
// A luz é um <div> por cima do desenho, e não um círculo dentro do SVG: o SVG
// estica na largura do celular (preserveAspectRatio="none") e um círculo lá
// dentro viraria oval em celular estreito.
import { T, FONTE } from "../tokens.js";

const W = 350, H = 210;

// Pontos em coordenadas do desenho (350 × 210). "achatar" (0–1) baixa o cume
// sem mexer na base, para o texto do alto não passar por cima da montanha.
const TRILHA_BASE = [[84, 206], [122, 184], [112, 162], [146, 144], [154, 122], [178, 104], [184, 82], [205, 50]];
const FUNDO = [[0, 210], [70, 132], [125, 160], [200, 72], [268, 140], [305, 116], [350, 150], [350, 210]];
const MONTANHA = [[30, 210], [205, 46], [340, 210]];
const SOMBRA = [[205, 46], [340, 210], [236, 210]];
const NEVE = [[205, 46], [186, 64], [198, 61], [205, 72], [212, 61], [224, 64]];

const baixa = (pts, k) => pts.map(([x, y]) => [x, H - (H - y) * k]);
const caminho = (pts, fechar = true) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (fechar ? "Z" : "");

// habitos: [{ feitos, meta }] — só os ativos na semana
export function progressoSemana(habitos) {
  const g = habitos.reduce((a, h) => a + h.meta, 0);
  const d = habitos.reduce((a, h) => a + Math.min(h.feitos, h.meta), 0);
  return g ? d / g : 0;
}

export function pontoNaTrilha(t, pts = TRILHA_BASE) {
  const segs = [];
  let total = 0;
  for (let k = 1; k < pts.length; k++) {
    const L = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    segs.push(L);
    total += L;
  }
  let rem = Math.max(0, Math.min(1, t)) * total;
  for (let k = 0; k < segs.length; k++) {
    if (rem <= segs[k]) {
      const f = segs[k] ? rem / segs[k] : 0;
      return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f];
    }
    rem -= segs[k];
  }
  return pts[pts.length - 1];
}

export function Cume({ t, titulo, subtitulo, onAjuda, achatar = 1 }) {
  const k = achatar;
  const trilha = baixa(TRILHA_BASE, k);
  // A luz sai do 2º ponto da trilha, não da borda: na base ela ficava cortada
  // pela metade. O tracejado continua desenhado desde a borda.
  const [x, y] = pontoNaTrilha(t, trilha.slice(1));
  return (
    <div style={{ position: "relative", height: H, borderRadius: 24, fontFamily: FONTE, overflow: "hidden", flexShrink: 0 }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true"
           style={{ position: "absolute", inset: 0, display: "block" }}>
        {/* céu */}
        <rect width={W} height={H} fill="#F3E3CC" />
        {/* montanhas ao fundo */}
        <path d={caminho(baixa(FUNDO, k))} fill="#D8B79C" />
        {/* montanha principal, com o lado da sombra */}
        <path d={caminho(baixa(MONTANHA, k))} fill="#B5563C" />
        <path d={caminho(baixa(SOMBRA, k))} fill={T.primary} />
        {/* neve no cume */}
        <path d={caminho(baixa(NEVE, k))} fill="#FBF3E8" opacity=".9" />
        {/* trilha */}
        <path d={caminho(trilha, false)} fill="none" stroke="#FBF3E8" strokeWidth="2.2" strokeDasharray="3 6"
              strokeLinecap="round" strokeLinejoin="round" opacity=".9" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* a luz — a transição some sozinha com "reduzir movimento" (regra global do app) */}
      <div aria-hidden="true" data-luz
           style={{ position: "absolute", left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: 0, height: 0,
                    transition: "left .9s ease-out, top .9s ease-out" }}>
        <span style={{ position: "absolute", left: -16, top: -16, width: 32, height: 32, borderRadius: 16, background: "#FCE6C4", opacity: 0.55 }} />
        <span style={{ position: "absolute", left: -7.5, top: -7.5, width: 15, height: 15, borderRadius: 8, background: "#FFF6E2" }} />
      </div>

      <div style={{ position: "absolute", left: 20, right: 12, top: 16, display: "flex", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.15, color: T.ink }}>{titulo}</h1>
          <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4, color: "#3A2E28" }}>{subtitulo}</div>
        </div>
        {onAjuda && (
          <button onClick={onAjuda} aria-label="Como usar a tela Hoje"
                  style={{ width: 44, height: 44, borderRadius: 22, border: "none", flexShrink: 0, cursor: "pointer",
                           background: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9.5" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" /><circle cx="12" cy="17" r=".6" fill={T.primary} />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Explicação curta que abre pelo (?) — o texto do desenho aprovado.
export function ComoUsarHoje({ onFechar }) {
  const passo = (n, conteudo) => (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 10 }}>
      <span style={{ width: 26, height: 26, borderRadius: 13, background: T.primary, color: "#FFFFFF", fontSize: 14, fontWeight: 700,
                     display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{n}</span>
      <div style={{ fontSize: 17, lineHeight: 1.45, color: T.ink }}>{conteudo}</div>
    </div>
  );
  return (
    <div role="region" aria-label="Como usar a tela Hoje"
         style={{ fontFamily: FONTE, background: "#EFE4DA", borderRadius: 20, padding: "18px 18px 8px", marginTop: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.ink }}>Como usar a tela Hoje</div>
      {passo(1, "Faça o seu hábito no seu tempo.")}
      {passo(2, <>Toque em <b>Feito hoje</b>.</>)}
      {passo(3, "Sua luz sobe a trilha da montanha. No fim da semana, você chega ao cume.")}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onFechar}
                style={{ minHeight: 44, padding: "0 12px", background: "none", border: "none", cursor: "pointer",
                         fontFamily: FONTE, fontSize: 17, fontWeight: 600, color: T.primary }}>Entendi</button>
      </div>
    </div>
  );
}
