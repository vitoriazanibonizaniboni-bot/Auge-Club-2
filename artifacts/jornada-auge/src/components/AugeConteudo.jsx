// ─── CONTEÚDO: busca, destaques, filtros e favoritos ──────────────────────────
// Peças da aba Conteúdo. Os dados continuam vindo da tabela "videos"; aqui só
// se monta a tela. Favoritos ficam no celular (localStorage "auge_favoritos").
import { useEffect, useRef, useState } from "react";
import { T, FONTE } from "../tokens.js";

// Cores e nomes de cada tipo (cat.id da aba Conteúdo)
export const TIPOS = {
  aulas: { nome: "Aula", chip: "Aulas", cor: "#9A4B36", midia: "video" },
  meditacoes: { nome: "Meditação", chip: "Meditações", cor: "#6E5A8A", midia: "video" },
  yoga: { nome: "Yoga", chip: "Yoga", cor: "#5E6340", midia: "video" },
  podcast: { nome: "Podcast", chip: "Podcast", cor: "#3F6E73", midia: "audio" },
  curadoria: { nome: "Indicação", chip: "Indicações", cor: "#7A6140", midia: "leitura" },
};
// ordem dos chips de tipo
export const ORDEM_CHIPS = ["meditacoes", "yoga", "aulas", "podcast", "curadoria"];

// "Nuvem", "NUVEM" e "nuvém" viram a mesma coisa
export const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
// "62 min" → 62 (sem número fica no fim da fila)
export const minutos = (dur) => { const m = /(\d+)/.exec(String(dur || "")); return m ? +m[1] : 9999; };

// ── Favoritos ────────────────────────────────────────────────────────────────
const CHAVE_FAV = "auge_favoritos";
export function useFavoritos() {
  const [ids, setIds] = useState(() => {
    try { const v = JSON.parse(localStorage.getItem(CHAVE_FAV) || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
  });
  const alternar = (id) => {
    const chave = String(id);
    setIds((atual) => {
      const novo = atual.includes(chave) ? atual.filter((x) => x !== chave) : [...atual, chave];
      try { localStorage.setItem(CHAVE_FAV, JSON.stringify(novo)); } catch {} // se falhar, vale só nesta sessão
      return novo;
    });
  };
  return { favoritos: ids, ehFavorito: (id) => ids.includes(String(id)), alternar };
}

const ESTILOS = `
@keyframes augePulo{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
.auge-sem-barra{scrollbar-width:none}
.auge-sem-barra::-webkit-scrollbar{display:none}
`;

// ── Ícones ───────────────────────────────────────────────────────────────────
const Svg = ({ children, tam = 22, cor = "currentColor", larg = 1.9, preench = "none" }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill={preench} stroke={cor} strokeWidth={larg} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
export const IconeMidia = ({ midia, cor = "#FFFFFF", tam = 22 }) =>
  midia === "audio" ? (
    <Svg cor={cor} tam={tam}><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></Svg>
  ) : midia === "leitura" ? (
    <Svg cor={cor} tam={tam}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></Svg>
  ) : (
    <Svg cor={cor} tam={tam} preench={cor} larg={1}><path d="M8 5.5v13l10.5-6.5z" /></Svg>
  );

export function Coracao({ ativo, onClick, fundo = false }) {
  const [pulo, setPulo] = useState(0);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setPulo((p) => p + 1); onClick(); }}
      aria-label={ativo ? "Tirar dos favoritos" : "Salvar nos favoritos"}
      aria-pressed={ativo}
      style={{ width: 44, height: 44, flexShrink: 0, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
               background: fundo ? "rgba(255,255,255,.92)" : "none", borderRadius: 22, padding: 0 }}>
      <span key={pulo} style={{ display: "flex", animation: pulo ? "augePulo .2s ease-out" : "none" }}>
        <Svg cor={T.primary} preench={ativo ? T.primary : "none"} larg={1.9}>
          <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.4 4.8 6.8 4.8c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.3 3.4 4.1 6.5-1.8 4.6-9.3 9.2-9.3 9.2z" />
        </Svg>
      </span>
    </button>
  );
}

// ── Busca ────────────────────────────────────────────────────────────────────
export function BuscaConteudo({ onBuscar }) {
  const [texto, setTexto] = useState("");
  useEffect(() => { const id = setTimeout(() => onBuscar(texto), 200); return () => clearTimeout(id); }, [texto]);
  return (
    <div style={{ position: "relative", margin: "0 20px 18px" }}>
      <span style={{ position: "absolute", left: 14, top: 0, bottom: 0, display: "flex", alignItems: "center", color: "#8A7A6E", pointerEvents: "none" }}>
        <Svg tam={20}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>
      </span>
      <input
        type="search" value={texto} onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar aulas, meditações, podcasts..." aria-label="Buscar conteúdo"
        style={{ width: "100%", boxSizing: "border-box", height: 50, borderRadius: 16, background: "#FFFFFF", border: "1px solid #E6DCCF",
                 padding: "0 48px 0 44px", fontFamily: FONTE, fontSize: 16, color: T.ink, WebkitAppearance: "none", appearance: "none" }} />
      {texto && (
        <button onClick={() => { setTexto(""); onBuscar(""); }} aria-label="Limpar busca"
          style={{ position: "absolute", right: 3, top: 3, width: 44, height: 44, border: "none", background: "none", cursor: "pointer", fontSize: 24, color: T.inkSoft, fontFamily: FONTE }}>×</button>
      )}
      <style>{"input[type=search]::-webkit-search-cancel-button{display:none}"}</style>
    </div>
  );
}

// ── Destaques ────────────────────────────────────────────────────────────────
// itens: [{ etiqueta, item }] — item = { id, titulo, sub, dur, cat }
export function Destaques({ itens, onAbrir }) {
  const trilho = useRef(null);
  const [ativo, setAtivo] = useState(0);
  const aoRolar = () => {
    const el = trilho.current; if (!el) return;
    const filhos = [...el.children];
    const centro = el.scrollLeft + el.clientWidth / 2;
    let melhor = 0, dist = Infinity;
    filhos.forEach((f, i) => { const d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - centro); if (d < dist) { dist = d; melhor = i; } });
    setAtivo(melhor);
  };
  if (!itens.length) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <style>{ESTILOS}</style>
      <div ref={trilho} onScroll={aoRolar} className="auge-sem-barra"
           style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", padding: "0 20px", scrollPaddingLeft: 20, WebkitOverflowScrolling: "touch" }}>
        {itens.map(({ etiqueta, item, capa }) => (
          <CartaoDestaque key={etiqueta} etiqueta={etiqueta} item={item} capa={capa} onAbrir={onAbrir} />
        ))}
      </div>
      {itens.length > 1 && (
        <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {itens.map((_, i) => (
            <span key={i} style={{ width: i === ativo ? 18 : 6, height: 6, borderRadius: 3, background: i === ativo ? T.primary : "#D8B79C", transition: "width .2s ease" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// Destaque = só a capa do YouTube (pedido da Vitória, 30/09). Se a capa não
// carregar, cai no cartão colorido com o título, para nunca ficar vazio.
function CartaoDestaque({ etiqueta, item, capa, onAbrir }) {
  const [semCapa, setSemCapa] = useState(!capa);
  const tipo = TIPOS[item.cat] || TIPOS.aulas;
  const verbo = tipo.midia === "audio" ? "Ouvir" : tipo.midia === "leitura" ? "Ler" : "Assistir";
  const base = { flexShrink: 0, width: "min(300px, 85vw)", aspectRatio: "16 / 9", boxSizing: "border-box", scrollSnapAlign: "start", borderRadius: 22,
                 border: "none", cursor: "pointer", overflow: "hidden", padding: 0, position: "relative", fontFamily: FONTE };
  if (!semCapa) {
    return (
      <button onClick={() => onAbrir(item)} aria-label={`${etiqueta}: ${item.titulo}`} style={{ ...base, background: tipo.cor }}>
        <img src={capa} alt="" onError={() => setSemCapa(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </button>
    );
  }
  return (
    <button onClick={() => onAbrir(item)} aria-label={`${etiqueta}: ${item.titulo}`}
      style={{ ...base, padding: 16, background: tipo.cor, textAlign: "left", display: "flex", flexDirection: "column", color: "#FFFFFF" }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#FBF3E8" }}>{etiqueta}</span>
      <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.titulo}</span>
      <span style={{ marginTop: "auto", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, background: "#FBF3E8", color: T.ink, borderRadius: 999, padding: "5px 12px", fontSize: 14, fontWeight: 600 }}>
        <IconeMidia midia={tipo.midia} cor={T.ink} tam={14} />
        {verbo}{tipo.midia !== "leitura" && item.dur ? ` · ${item.dur}` : ""}
      </span>
    </button>
  );
}

// ── Filtros ──────────────────────────────────────────────────────────────────
// opcoes: [{ id, rotulo }]
export function Filtros({ opcoes, ativo, onEscolher }) {
  return (
    <div className="auge-sem-barra" role="group" aria-label="Filtrar conteúdo"
         style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 20px", marginBottom: 18, WebkitOverflowScrolling: "touch" }}>
      <style>{ESTILOS}</style>
      {opcoes.map((o) => {
        const on = o.id === ativo;
        return (
          <button key={o.id} onClick={() => onEscolher(o.id)} aria-pressed={on}
            style={{ flexShrink: 0, height: 40, borderRadius: 20, padding: "0 16px", fontFamily: FONTE, fontSize: 15, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                     background: on ? "#3A2320" : "#FFFFFF", color: on ? "#FFFFFF" : T.ink, border: on ? "1.5px solid #3A2320" : "1.5px solid #E6DCCF" }}>
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}

// ── Lista vertical ───────────────────────────────────────────────────────────
export function ListaConteudo({ titulo, itens, vazio, onAbrir, ehFavorito, alternarFavorito, jaVisto }) {
  return (
    <div style={{ padding: "0 20px" }}>
      <style>{ESTILOS}</style>
      {titulo && <div style={{ fontFamily: FONTE, fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 10 }}>{titulo}</div>}
      {itens.length === 0 ? (
        <div style={{ border: "1.5px dashed #D8B79C", borderRadius: 16, padding: "24px 18px", textAlign: "center", fontFamily: FONTE, fontSize: 16, color: T.ink, lineHeight: 1.5 }}>{vazio}</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {itens.map((item) => {
            const tipo = TIPOS[item.cat] || TIPOS.aulas;
            const visto = jaVisto(item.id);
            return (
              <div key={`${item.cat}-${item.id}`}
                   style={{ display: "flex", alignItems: "center", gap: 4, background: "#FFFFFF", border: "1px solid #E6DCCF", borderRadius: 16, padding: "10px 6px 10px 10px" }}>
                {/* o item abre o conteúdo; o coração fica ao lado, como botão separado */}
                <button onClick={() => onAbrir(item)}
                        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: FONTE }}>
                <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 14, background: tipo.cor, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconeMidia midia={tipo.midia} />
                </span>
                <span style={{ flex: 1, minWidth: 0, fontFamily: FONTE }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>{item.titulo}</span>
                  <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 14, color: T.inkSoft }}>{tipo.nome}{tipo.midia !== "leitura" && item.dur ? ` · ${item.dur}` : ""}</span>
                    {visto && <span style={{ fontSize: 13, fontWeight: 600, color: T.olive, background: "#EEF0E4", borderRadius: 8, padding: "1px 8px" }}>✓ Visto</span>}
                  </span>
                </span>
                </button>
                <Coracao ativo={ehFavorito(item.id)} onClick={() => alternarFavorito(item.id)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
