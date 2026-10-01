// ─── PASSO A PASSO DE BOAS-VINDAS E DICA DA TELA HOJE ─────────────────────────
// Passo a passo: tela cheia, 3 passos, aparece uma vez (primeiro acesso, ou
// a primeira abertura desta versão para quem já usava o app).
// Dica: cartão logo abaixo do cume, até a aluna tocar em "Entendi".
// Tudo fica guardado no celular (localStorage), nada no Supabase.
import { useEffect, useRef, useState } from "react";
import { T, FONTE } from "../tokens.js";
import { CumeMini, DiaDificil } from "./AugeCume.jsx";

export const CHAVE_TOUR = "auge_tour_visto";
export const CHAVE_DICA = "auge_dica_hoje";
export const lerFlag = (k) => { try { return localStorage.getItem(k) === "1"; } catch { return false; } };
export const gravarFlag = (k) => { try { localStorage.setItem(k, "1"); } catch {} };

const reduzMovimento = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ANEL = "0 0 0 5px rgba(181,86,60,.25)";
const forte = (t) => <b style={{ color: T.ink, fontWeight: 700 }}>{t}</b>;

// ── Ilustrações ── (300px; em celular baixo encolhe, para o texto caber acima dos botões)────────────────────────────────────────────────────────────
function Ilustracao({ fundo, children, padding = 0 }) {
  return (
    <div aria-hidden="true" style={{ height: "min(300px, 38vh)", borderRadius: 28, background: fundo, display: "flex", alignItems: "center", justifyContent: "center", padding, boxSizing: "border-box", overflow: "hidden" }}>
      {children}
    </div>
  );
}

function IlustraFeito() {
  return (
    <Ilustracao fundo="#F2E4DC">
      <div style={{ width: "82%", maxWidth: 300, background: "#FFFFFF", borderRadius: 18, boxShadow: "0 6px 20px rgba(31,26,23,.10)", padding: "16px 16px 18px", fontFamily: FONTE }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: T.ink }}>Movimento</div>
        <div style={{ fontSize: 15, color: T.inkSoft, marginTop: 4 }}>Meta: 60 min de academia</div>
        <div style={{ marginTop: 14, height: 48, borderRadius: 14, background: T.primary, color: "#FFFFFF", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: ANEL }}>
          Feito hoje
        </div>
      </div>
    </Ilustracao>
  );
}

function IlustraMontanha() {
  const linhas = [["Segunda", 0], ["Meio da semana", 0.5], ["Semana cheia", 1]];
  return (
    <Ilustracao fundo="#F4EDE3" padding={16}>
      <div style={{ display: "grid", gap: 12, width: "100%" }}>
        {linhas.map(([rot, t]) => (
          <div key={rot} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <CumeMini t={t} largura={120} altura={72} />
            <span style={{ fontFamily: FONTE, fontSize: 16, fontWeight: 600, color: T.ink }}>{rot}</span>
          </div>
        ))}
      </div>
    </Ilustracao>
  );
}

function IlustraMinimo() {
  return (
    <Ilustracao fundo="#EEF0E4" padding={20}>
      <div style={{ width: "100%", borderRadius: 18, boxShadow: ANEL, pointerEvents: "none" }}>
        <div style={{ marginBottom: -16 }}>
          <DiaDificil ativo={false} onAtivar={() => {}} onDesfazer={() => {}} />
        </div>
      </div>
    </Ilustracao>
  );
}

// ── O passo a passo ──────────────────────────────────────────────────────────
// antiga: true para quem já usava o app (o passo 1 vira "O que mudou no app")
export function PassoAPasso({ antiga = false, onFechar }) {
  const [passo, setPasso] = useState(0);
  const [dir, setDir] = useState(1);
  const tituloRef = useRef(null);
  const toque = useRef(null);
  const PASSOS = [
    {
      titulo: antiga ? "O que mudou no app" : "Fez o seu hábito? Marque aqui.",
      texto: <>Na tela {forte("Hoje")} ficam os seus hábitos. Depois de fazer, toque no botão {forte("Feito hoje")}. Só isso.</>,
      ilustra: <IlustraFeito />,
    },
    {
      titulo: "Cada dia feito, você sobe a montanha",
      texto: <>No topo da tela Hoje, uma luz sobe a trilha até o seu {forte("auge")}. Toda segunda, uma nova subida começa. Sem cobrança, no seu ritmo.</>,
      ilustra: <IlustraMontanha />,
    },
    {
      titulo: "Dia difícil? Vale o mínimo.",
      texto: <>Nos dias pesados, troque as metas pelos seus {forte("mínimos")} com um toque. Aqui ninguém começa do zero.</>,
      ilustra: <IlustraMinimo />,
    },
  ];
  const ultimo = passo === PASSOS.length - 1;
  const fechar = () => { onFechar(); };
  const ir = (n) => { if (n < 0 || n >= PASSOS.length) return; setDir(n > passo ? 1 : -1); setPasso(n); };
  useEffect(() => { tituloRef.current?.focus(); }, [passo]);
  // arrastar com o dedo para os lados também troca de passo
  const inicio = (e) => { toque.current = e.touches?.[0]?.clientX ?? null; };
  const fim = (e) => {
    if (toque.current == null) return;
    const dx = (e.changedTouches?.[0]?.clientX ?? toque.current) - toque.current;
    toque.current = null;
    if (dx < -50) ultimo ? null : ir(passo + 1);
    if (dx > 50) ir(passo - 1);
  };
  const p = PASSOS[passo];
  const reduz = reduzMovimento();
  return (
    <div role="dialog" aria-modal="true" aria-label="Como funciona o app" onTouchStart={inicio} onTouchEnd={fim}
         style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#FBF7F1", fontFamily: FONTE, display: "flex", flexDirection: "column",
                  paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <style>{"@keyframes augeTourEntra{from{opacity:0;transform:translateX(var(--dx))}to{opacity:1;transform:translateX(0)}}"}</style>
      <div style={{ maxWidth: 520, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px 0 20px", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: T.inkSoft }}>Passo {passo + 1} de {PASSOS.length}</span>
          <button onClick={fechar} style={{ minHeight: 44, minWidth: 44, padding: "0 8px", background: "none", border: "none", fontFamily: FONTE, fontSize: 16, fontWeight: 600, color: T.primary, cursor: "pointer" }}>Pular</button>
        </div>
        <div style={{ display: "flex", gap: 6, padding: "0 20px", flexShrink: 0 }}>
          {PASSOS.map((_, i) => <span key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= passo ? T.primary : "#E6DCCF" }} />)}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 16px", minHeight: 0 }}>
          <div key={passo} style={{ "--dx": `${24 * dir}px`, animation: reduz ? "none" : "augeTourEntra .25s ease-out" }}>
            {p.ilustra}
            <h2 ref={tituloRef} tabIndex={-1} style={{ margin: "24px 0 10px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.2, color: T.ink, outline: "none" }}>{p.titulo}</h2>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, color: T.inkSoft }}>{p.texto}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 20px 16px", flexShrink: 0, background: "#FBF7F1" }}>
          {passo > 0 && (
            <button onClick={() => ir(passo - 1)}
              style={{ minHeight: 56, padding: "0 20px", borderRadius: 16, border: "1.5px solid #E6DCCF", background: "#FFFFFF", color: T.ink, fontFamily: FONTE, fontSize: 17, fontWeight: 600, cursor: "pointer" }}>
              Voltar
            </button>
          )}
          <button onClick={() => (ultimo ? fechar() : ir(passo + 1))}
            style={{ flex: 1, minHeight: 56, borderRadius: 16, border: "none", background: T.primary, color: "#FFFFFF", fontFamily: FONTE, fontSize: 17, fontWeight: 600, cursor: "pointer" }}>
            {ultimo ? "Começar" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dica fixa da tela Hoje ───────────────────────────────────────────────────
export function DicaHoje({ onEntendi }) {
  const [saindo, setSaindo] = useState(false);
  const linha = (n, conteudo) => (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 10 }}>
      <span style={{ width: 26, height: 26, borderRadius: 13, background: T.primary, color: "#FFFFFF", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: 16, lineHeight: 1.45, color: T.ink, paddingTop: 2 }}>{conteudo}</span>
    </div>
  );
  return (
    <div style={{ background: "#F2E4DC", borderRadius: 20, padding: "16px 16px 12px", marginTop: 16, fontFamily: FONTE,
                  opacity: saindo ? 0 : 1, transition: "opacity .25s ease" }}>
      <div style={{ fontSize: 17, fontWeight: 600, color: T.ink }}>Como usar a tela Hoje</div>
      {linha(1, "Faça o seu hábito no seu tempo.")}
      {linha(2, <>Toque em <b>Feito hoje</b>.</>)}
      {linha(3, "Sua luz sobe a trilha da montanha.")}
      {linha(4, <>Quando bater a preguiça, toque em <b>bateu a preguiça?</b>, no canto de baixo.</>)}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => { setSaindo(true); setTimeout(onEntendi, 250); }}
          style={{ minHeight: 44, padding: "0 10px", background: "none", border: "none", fontFamily: FONTE, fontSize: 16, fontWeight: 600, color: T.primary, cursor: "pointer" }}>
          Entendi
        </button>
      </div>
    </div>
  );
}
