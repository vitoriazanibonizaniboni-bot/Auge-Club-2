// ─── COMPONENTES DO REDESIGN (Etapa 2, versão suave) ────────────────────────
// Peças visuais reaproveitáveis em cima de tokens.js. Nenhuma busca ou grava
// dados: quem usa passa valores e funções por props.
// Direção aprovada pela Vitória (25/09): cores suaves, perto do bege que o app
// já tem; botões de 48px, sem negrito pesado; o mínimo de texto.
// Contraste: texto sempre ink (16:1) ou inkSoft (7,4:1). Dourado só de fundo.
// Regra da Vitória (25/09): botão ESCURO leva letra CLARA; botão claro, letra escura.
import { useEffect, useRef } from "react";
import { T, RAIO, SOMBRA, FONTE, MOV, alfa } from "./tokens.js";

const OURO_TXT = "#7E6038"; // único dourado permitido como texto (5,44:1)
const OURO_BOTAO = "#7A6140"; // dourado de botão cheio: letra creme por cima (5,45:1)
const VERMELHO = "#A32D2D"; // só em ação que apaga (7,1:1 no branco)

// Foco visível e toque. Renderizar <EstilosUI /> uma vez no app.
export function EstilosUI() {
  return (
    <style>{`
      .aug-toque{transition:transform ${MOV.rapido},opacity ${MOV.rapido};-webkit-tap-highlight-color:transparent}
      .aug-toque:active:not(:disabled){transform:scale(.98);opacity:.85}
      .aug-toque:focus-visible{outline:2px solid ${OURO_TXT};outline-offset:2px}
      @keyframes aug-brilho{0%{background-position:-200px 0}100%{background-position:200px 0}}
      @keyframes aug-sobe{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
      @keyframes aug-sheet{from{transform:translateY(100%)}to{transform:none}}
      @keyframes aug-fade{from{opacity:0}to{opacity:1}}
      @keyframes aug-gira{to{transform:rotate(360deg)}}
    `}</style>
  );
}

// ─── Button ─────────────────────────────────────────────────────────────────
// principal: dourado escuro com letra creme (5,45:1)
// feito: oliva, texto branco · contorno: branco com borda · texto: só a palavra
const VARIANTES = {
  principal: { background: OURO_BOTAO, color: T.bg, border: "none" },
  feito: { background: T.olive, color: T.onColor, border: "none" },
  contorno: { background: T.surface, color: T.ink, border: `1px solid ${T.line}` },
  texto: { background: "transparent", color: OURO_TXT, border: "none", textDecoration: "underline", textUnderlineOffset: 3 },
};
export function Button({ variante = "principal", carregando = false, disabled = false, icone = null, largura = "100%", children, onClick, type = "button", style, ...resto }) {
  const parado = disabled || carregando;
  const v = VARIANTES[variante] || VARIANTES.principal;
  return (
    <button
      type={type}
      className="aug-toque"
      onClick={parado ? undefined : onClick}
      disabled={parado}
      aria-busy={carregando || undefined}
      style={{
        fontFamily: FONTE, fontSize: 16, fontWeight: 500, lineHeight: 1.2, minHeight: 48, width: largura,
        padding: "0 18px", borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        cursor: parado ? "default" : "pointer", ...v, ...(disabled && !carregando ? { opacity: 0.45 } : {}), ...style,
      }}
      {...resto}
    >
      {carregando ? <Girando cor={v.color} /> : icone}
      <span>{children}</span>
    </button>
  );
}
function Girando({ cor }) {
  return <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${alfa(cor, 0.25)}`, borderTopColor: cor, animation: "aug-gira .8s linear infinite", flexShrink: 0 }} />;
}

// ─── Card ───────────────────────────────────────────────────────────────────
// tom: "branco" · "suave" (bege) · "blush" (afeto)
export function Card({ tom = "branco", onClick, children, style, rotulo, ...resto }) {
  const base = {
    background: { branco: T.surface, suave: T.surfaceSoft, blush: T.blush }[tom],
    border: tom === "branco" ? `1px solid ${T.line}` : "none", borderRadius: 16,
    boxShadow: tom === "branco" ? SOMBRA : "none", padding: 16, color: T.ink, fontFamily: FONTE,
    textAlign: "left", width: "100%", display: "block",
  };
  if (!onClick) return <div style={{ ...base, ...style }} {...resto}>{children}</div>;
  return (
    <button type="button" className="aug-toque" onClick={onClick} aria-label={rotulo} style={{ ...base, cursor: "pointer", ...style }} {...resto}>
      {children}
    </button>
  );
}

// ─── SectionHeader ──────────────────────────────────────────────────────────
export function SectionHeader({ titulo, acao, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "24px 0 10px", ...style }}>
      <h2 style={{ fontFamily: FONTE, fontSize: 15, fontWeight: 600, color: T.inkSoft, margin: 0 }}>{titulo}</h2>
      {acao}
    </div>
  );
}

// ─── Chip ───────────────────────────────────────────────────────────────────
// Etiqueta (sem onClick) ou filtro (com onClick; 48px de alvo).
export function Chip({ children, selecionado = false, onClick, icone, style }) {
  const visual = {
    display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONTE, fontSize: 15, fontWeight: 500, lineHeight: 1.2,
    padding: "6px 12px", borderRadius: 999, whiteSpace: "nowrap", color: T.ink,
    background: selecionado ? alfa(T.gold, 0.35) : T.surfaceSoft,
    border: `1px solid ${selecionado ? T.gold : "transparent"}`,
  };
  if (!onClick) return <span style={{ ...visual, ...style }}>{icone}{children}</span>;
  return (
    <button type="button" className="aug-toque" onClick={onClick} aria-pressed={selecionado}
      style={{ minHeight: 48, background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", ...style }}>
      <span style={visual}>{icone}{children}</span>
    </button>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────────────────
// Iniciais escuras sobre fundo claro de tom quente.
const FUNDOS_AVATAR = ["#EBD9C6", "#DCE0CC", "#E9D6DC", "#D6E2E2", "#EFE0C4"];
export const iniciais = (nome = "") => {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
};
export function Avatar({ nome = "", src, tamanho = 40 }) {
  const box = { width: tamanho, height: tamanho, borderRadius: "50%", flexShrink: 0 };
  if (src) return <img src={src} alt="" style={{ ...box, objectFit: "cover", background: T.surfaceSoft }} />;
  const fundo = FUNDOS_AVATAR[[...nome].reduce((a, c) => a + c.charCodeAt(0), 0) % FUNDOS_AVATAR.length];
  return (
    <span aria-hidden="true" style={{ ...box, background: fundo, color: T.ink, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 600, fontSize: Math.max(15, Math.round(tamanho * 0.36)) }}>
      {iniciais(nome)}
    </span>
  );
}

// ─── ProgressDots ───────────────────────────────────────────────────────────
// Segunda a domingo. Cheio = feito; anel = hoje. Letras do dia opcionais.
// dias: 7 datas · feitos: datas feitas · hoje: data em jogo (Sono: ontem)
const LETRAS = ["S", "T", "Q", "Q", "S", "S", "D"];
export function ProgressDots({ dias = [], feitos = [], hoje, letras = true }) {
  const f = feitos instanceof Set ? feitos : new Set(feitos);
  const total = dias.filter((d) => f.has(d)).length;
  return (
    <div role="img" aria-label={`${total} de 7 dias feitos nesta semana`} style={{ display: "flex", gap: 8 }}>
      {dias.map((d, i) => {
        const feito = f.has(d);
        const ehHoje = d === hoje;
        return (
          <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 20 }}>
            <span style={{
              width: 14, height: 14, borderRadius: "50%", boxSizing: "border-box",
              background: feito ? T.olive : "transparent",
              border: feito ? "none" : `1.5px solid ${alfa(T.inkSoft, 0.45)}`,
              boxShadow: ehHoje ? `0 0 0 2px ${T.bg}, 0 0 0 3.5px ${T.inkSoft}` : "none",
            }} />
            {letras && <span style={{ fontFamily: FONTE, fontSize: 13, lineHeight: 1, fontWeight: ehHoje ? 600 : 400, color: T.inkSoft }}>{LETRAS[i]}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({ icone, titulo, texto, acao }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 16px", fontFamily: FONTE }}>
      {icone && <div style={{ color: T.inkSoft, marginBottom: 12, display: "flex", justifyContent: "center" }}>{icone}</div>}
      <div style={{ fontSize: 17, fontWeight: 600, color: T.ink }}>{titulo}</div>
      {texto && <div style={{ fontSize: 16, color: T.inkSoft, marginTop: 4 }}>{texto}</div>}
      {acao && <div style={{ marginTop: 16 }}>{acao}</div>}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
export function Skeleton({ altura = 16, largura = "100%", raio = 8, style }) {
  return (
    <span aria-hidden="true" style={{
      display: "block", height: altura, width: largura, borderRadius: raio,
      background: `linear-gradient(90deg, ${T.surfaceSoft} 0px, ${T.bg} 80px, ${T.surfaceSoft} 160px)`,
      backgroundSize: "400px 100%", animation: "aug-brilho 1.4s ease-in-out infinite", ...style,
    }} />
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ mensagem, icone }) {
  if (!mensagem) return null;
  return (
    <div role="status" aria-live="polite" style={{
      position: "absolute", top: "calc(12px + env(safe-area-inset-top))", left: 16, right: 16, zIndex: 300,
      display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14,
      background: T.surface, color: T.ink, border: `1px solid ${T.line}`,
      fontFamily: FONTE, fontSize: 16, fontWeight: 500, boxShadow: "0 6px 20px rgba(31,26,23,.10)", animation: "aug-sobe .2s ease-out",
    }}>
      {icone && <span style={{ color: T.olive, display: "flex" }}>{icone}</span>}
      <span>{mensagem}</span>
    </div>
  );
}

// ─── Sheet ──────────────────────────────────────────────────────────────────
// Painel que sobe de baixo. Fecha tocando fora, no X ou com Esc.
export function Sheet({ aberto, onFechar, titulo, children, rodape }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!aberto) return;
    const esc = (e) => e.key === "Escape" && onFechar?.();
    window.addEventListener("keydown", esc);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", esc);
  }, [aberto, onFechar]);
  if (!aberto) return null;
  return (
    <div onClick={onFechar} style={{ position: "absolute", inset: 0, zIndex: 250, background: "rgba(31,26,23,.30)", display: "flex", alignItems: "flex-end", animation: "aug-fade .2s ease-out" }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxHeight: "88%", overflowY: "auto", background: T.bg, borderRadius: "20px 20px 0 0",
        padding: "8px 20px calc(20px + env(safe-area-inset-bottom))", fontFamily: FONTE, color: T.ink, outline: "none",
        animation: "aug-sheet .25s cubic-bezier(.2,.8,.2,1)",
      }}>
        <div aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 2, background: T.line, margin: "4px auto 8px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>{titulo}</h2>
          <button type="button" className="aug-toque" onClick={onFechar} aria-label="Fechar" style={{ width: 48, height: 48, marginRight: -12, background: "none", border: "none", color: T.inkSoft, fontSize: 24, lineHeight: 1, cursor: "pointer" }}>
            ×
          </button>
        </div>
        {children}
        {rodape && <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>{rodape}</div>}
      </div>
    </div>
  );
}

// ─── ConfirmDialog ──────────────────────────────────────────────────────────
// Para ação que apaga algo. Cancelar é o botão de destaque; apagar é discreto.
export function ConfirmDialog({ aberto, titulo, texto, textoConfirmar = "Apagar", textoCancelar = "Cancelar", onConfirmar, onCancelar }) {
  useEffect(() => {
    if (!aberto) return;
    const esc = (e) => e.key === "Escape" && onCancelar?.();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto, onCancelar]);
  if (!aberto) return null;
  return (
    <div onClick={onCancelar} style={{ position: "absolute", inset: 0, zIndex: 260, background: "rgba(31,26,23,.30)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "aug-fade .2s ease-out" }}>
      <div role="alertdialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: T.surface, borderRadius: 16, padding: 20, fontFamily: FONTE, color: T.ink }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{titulo}</h2>
        {texto && <p style={{ fontSize: 16, lineHeight: 1.45, color: T.inkSoft, margin: "6px 0 0" }}>{texto}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <Button variante="contorno" onClick={onCancelar}>{textoCancelar}</Button>
          <Button variante="contorno" onClick={onConfirmar} style={{ color: VERMELHO }}>{textoConfirmar}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── BottomNav ──────────────────────────────────────────────────────────────
// abas: [{ id, rotulo, icone: (cor) => svg, contador? }] — sempre ícone + texto.
export function BottomNav({ abas, ativa, onIr }) {
  return (
    <nav aria-label="Navegação principal" style={{ display: "flex", background: T.bg, borderTop: `1px solid ${T.line}`, padding: "6px 4px calc(6px + env(safe-area-inset-bottom))" }}>
      {abas.map((a) => {
        const on = a.id === ativa;
        return (
          <button key={a.id} type="button" className="aug-toque" onClick={() => onIr(a.id)} aria-current={on ? "page" : undefined}
            style={{ flex: 1, minWidth: 0, minHeight: 56, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, position: "relative" }}>
            {a.icone(on ? OURO_TXT : T.inkSoft)}
            <span style={{ fontFamily: FONTE, fontSize: 13, fontWeight: on ? 600 : 400, color: on ? OURO_TXT : T.inkSoft, whiteSpace: "nowrap" }}>{a.rotulo}</span>
            {a.contador > 0 && (
              <span aria-label={`${a.contador} novas`} style={{ position: "absolute", top: 4, left: "calc(50% + 6px)", minWidth: 18, height: 18, padding: "0 4px", borderRadius: 9, background: T.gold, color: T.ink, fontFamily: FONTE, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {a.contador}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
