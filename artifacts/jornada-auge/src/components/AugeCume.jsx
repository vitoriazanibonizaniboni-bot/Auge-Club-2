// ─── O CUME ──────────────────────────────────────────────────────────────────
// Cabeçalho da tela Hoje: uma montanha terracota num céu creme, com a trilha
// tracejada subindo a encosta e UMA luz que percorre a trilha conforme a semana
// avança. t = 0 deixa a luz na base; t = 1 leva ao cume. Sem números na tela.
//
// A luz é um <div> por cima do desenho, e não um círculo dentro do SVG: o SVG
// estica na largura do celular (preserveAspectRatio="none") e um círculo lá
// dentro viraria oval em celular estreito.
import { useEffect, useRef, useState } from "react";
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

// ── A luz sobe devagar, PELA TRILHA ─────────────────────────────────────────
// Em vez de pular em linha reta (transição de CSS), o valor de t vai mudando
// quadro a quadro, e a luz segue as curvas da trilha. Começa devagar, acelera
// e chega devagar. Quando chega, o brilho pulsa uma vez.
const reduzMovimento = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const suave = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function useLuzAnimada(alvo, inicio = alvo) {
  const [valor, setValor] = useState(inicio);
  const [chegou, setChegou] = useState(0);
  const [andando, setAndando] = useState(false);
  const atual = useRef(inicio);
  useEffect(() => {
    const de = atual.current;
    if (Math.abs(alvo - de) < 1e-4) return;
    if (reduzMovimento()) { atual.current = alvo; setValor(alvo); return; }
    // devagar de propósito: mesmo uma subida pequena leva mais de 2 segundos
    const dur = Math.min(3500, 2200 + Math.abs(alvo - de) * 2500);
    let t0 = null, raf;
    setAndando(true);
    const passo = (agora) => {
      if (t0 == null) t0 = agora;
      const f = Math.min(1, (agora - t0) / dur);
      const v = de + (alvo - de) * suave(f);
      atual.current = v;
      setValor(v);
      if (f < 1) raf = requestAnimationFrame(passo);
      else { setAndando(false); if (alvo > de) setChegou((c) => c + 1); }
    };
    raf = requestAnimationFrame(passo);
    return () => { cancelAnimationFrame(raf); setAndando(false); };
  }, [alvo]);
  return [valor, chegou, andando];
}

// A luz: enquanto sobe, o brilho fica um pouco maior; quando para, ela
// "acende": o brilho cresce e volta, e um anel de luz se abre e some.
function Luz({ x, y, raio, nucleo, pulso, andando, dataLuz }) {
  const halo = raio * 2, anel = raio * 2;
  return (
    <div aria-hidden="true" {...(dataLuz ? { "data-luz": "" } : {})}
         style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
      {pulso > 0 && (
        <span key={`anel${pulso}`} style={{ position: "absolute", left: -raio, top: -raio, width: anel, height: anel, borderRadius: raio,
                                            border: `${Math.max(2, raio / 6)}px solid #FFE3AE`, boxSizing: "border-box", opacity: 0,
                                            animation: "augeLuzAnel 1.4s ease-out" }} />
      )}
      <span key={`halo${pulso}`} style={{ position: "absolute", left: -raio, top: -raio, width: halo, height: halo, borderRadius: raio,
                                          background: "radial-gradient(circle, #FFEFC9 0%, #FCE6C4 55%, rgba(252,230,196,0) 100%)",
                                          opacity: andando ? 0.85 : 0.6, transform: andando ? "scale(1.35)" : "scale(1)",
                                          transition: "transform .6s ease, opacity .6s ease",
                                          animation: pulso ? "augeLuzBrilho 1.6s ease-out" : "none" }} />
      <span key={`nucleo${pulso}`} style={{ position: "absolute", left: -nucleo, top: -nucleo, width: nucleo * 2, height: nucleo * 2, borderRadius: nucleo,
                                            background: "#FFF8E8", boxShadow: "0 0 6px 1px rgba(255,236,190,.9)",
                                            animation: pulso ? "augeLuzNucleo 1.6s ease-out" : "none" }} />
      <style>{"@keyframes augeLuzBrilho{0%{transform:scale(1.35);opacity:.85}35%{transform:scale(2.3);opacity:1}100%{transform:scale(1);opacity:.6}}"
             + "@keyframes augeLuzNucleo{0%{transform:scale(1)}35%{transform:scale(1.35)}100%{transform:scale(1)}}"
             + "@keyframes augeLuzAnel{0%{transform:scale(.8);opacity:.9}100%{transform:scale(3.2);opacity:0}}"}</style>
    </div>
  );
}

export function Cume({ t, titulo, subtitulo, onAjuda, achatar = 1 }) {
  const k = achatar;
  const trilha = baixa(TRILHA_BASE, k);
  // A luz sai do 2º ponto da trilha, não da borda: na base ela ficava cortada
  // pela metade. O tracejado continua desenhado desde a borda.
  const [tLuz, pulso, andando] = useLuzAnimada(t);
  const [x, y] = pontoNaTrilha(tLuz, trilha.slice(1));
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

      {/* a luz — com "reduzir movimento" ela muda de lugar sem animar */}
      <Luz x={`${(x / W) * 100}%`} y={`${(y / H) * 100}%`} raio={16} nucleo={7.5} pulso={pulso} andando={andando} dataLuz />

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
      {passo(3, "Sua luz sobe a trilha da montanha. No fim da semana, você chega ao seu auge.")}
      {passo(4, <><b>Dia difícil? Vale o mínimo.</b> Nos dias pesados, troque as metas pelos seus mínimos com um toque. Aqui ninguém começa do zero.</>)}
      {passo(5, <>Quando bater a preguiça, toque em <b>bateu a preguiça?</b>, no canto de baixo da tela.</>)}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onFechar}
                style={{ minHeight: 44, padding: "0 12px", background: "none", border: "none", cursor: "pointer",
                         fontFamily: FONTE, fontSize: 17, fontWeight: 600, color: T.primary }}>Entendi</button>
      </div>
    </div>
  );
}

// Montanha pequena, para quando o cabeçalho sai da tela. "de" é de onde a luz
// parte: ela aparece lá e desliza até "t", para a aluna VER a subida.
export function CumeMini({ t, de = t, largura = 112, altura = 56 }) {
  const k = 0.62;
  const trilha = baixa(TRILHA_BASE, k);
  // aparece onde a luz estava e, logo depois, sobe até o ponto novo
  const [alvo, setAlvo] = useState(de);
  useEffect(() => { const id = setTimeout(() => setAlvo(t), 250); return () => clearTimeout(id); }, [t]);
  const [pos, pulso, andando] = useLuzAnimada(alvo, de);
  const [x, y] = pontoNaTrilha(pos, trilha.slice(1));
  // recorta só a parte de baixo do desenho, onde está a montanha
  const topo = 72;
  return (
    <div aria-hidden="true" style={{ position: "relative", width: largura, height: altura, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
      <svg width="100%" height="100%" viewBox={`0 ${topo} ${W} ${H - topo}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, display: "block" }}>
        <rect y={topo} width={W} height={H - topo} fill="#F3E3CC" />
        <path d={caminho(baixa(FUNDO, k))} fill="#D8B79C" />
        <path d={caminho(baixa(MONTANHA, k))} fill="#B5563C" />
        <path d={caminho(baixa(SOMBRA, k))} fill={T.primary} />
        <path d={caminho(baixa(NEVE, k))} fill="#FBF3E8" opacity=".9" />
        <path d={caminho(trilha, false)} fill="none" stroke="#FBF3E8" strokeWidth="1.6" strokeDasharray="2 4" strokeLinecap="round" opacity=".9" vectorEffect="non-scaling-stroke" />
      </svg>
      <Luz x={`${(x / W) * 100}%`} y={`${((y - topo) / (H - topo)) * 100}%`} raio={11} nucleo={5.5} pulso={pulso} andando={andando} />
    </div>
  );
}

// ── Dia difícil? Faça só o mínimo ────────────────────────────────────────────
// Um toque troca as metas do dia pelos Mínimos Inegociáveis. É só visual:
// marcar "Feito hoje" grava o mesmo registro de sempre.
export function DiaDificil({ ativo, onAtivar, onDesfazer }) {
  if (!ativo) {
    return (
      <button onClick={onAtivar} aria-label="Ativar dia mínimo"
        style={{ width: "100%", minHeight: 56, borderRadius: 18, border: "1px solid #E6DCCF",
                 background: "#F4EDE3", color: T.ink, display: "flex", alignItems: "center",
                 gap: 10, padding: "0 16px", textAlign: "left", fontFamily: FONTE, cursor: "pointer", marginBottom: 16 }}>
        <span style={{ flex: 1, fontSize: 16, lineHeight: 1.35, padding: "10px 0" }}><b>Dia difícil?</b> Faça só o mínimo hoje</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    );
  }
  return (
    <div role="status" style={{ background: "#EEF0E4", borderRadius: 18, padding: "14px 16px", fontFamily: FONTE,
                 display: "flex", alignItems: "center", gap: 10, marginBottom: 16, animation: "fadeUp .3s ease" }}>
      <div style={{ flex: 1, fontSize: 16, lineHeight: 1.4, color: T.ink }}><b>Hoje é dia de mínimo.</b> Conta igual.</div>
      <button onClick={onDesfazer}
        style={{ minHeight: 44, padding: "0 4px", border: "none", background: "transparent", color: T.primary,
                 fontSize: 15, fontWeight: 600, textDecoration: "underline", fontFamily: FONTE, cursor: "pointer" }}>
        Desfazer
      </button>
    </div>
  );
}

export function SeloMinimo() {
  return (
    <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", background: T.olive, fontFamily: FONTE,
                   borderRadius: 8, padding: "2px 8px", whiteSpace: "nowrap" }}>mínimo</span>
  );
}
