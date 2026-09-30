// ─── PAINEL "EDITAR" E AVISOS DA TELA HOJE ───────────────────────────────────
// Painel que sobe de baixo para editar um hábito do método, um hábito pessoal
// ou criar um hábito novo. Só chama as funções que o app já tem; não guarda
// nada por conta própria.
import { useEffect, useRef, useState } from "react";
import { T, FONTE } from "../tokens.js";

const reduzMovimento = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ESTILOS = `
@keyframes augeSheetSobe{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes augeFade{from{opacity:0}to{opacity:1}}
@keyframes augeAvisoSobe{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`;

// Com o teclado aberto, o celular encolhe a área visível. O painel acompanha
// essa área para o botão "Salvar mudanças" nunca ficar escondido atrás do teclado.
function useAreaVisivel() {
  const ler = () => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return { altura: typeof window !== "undefined" ? window.innerHeight : 800, baixo: 0 };
    return { altura: vv.height, baixo: Math.max(0, window.innerHeight - vv.height - vv.offsetTop) };
  };
  const [area, setArea] = useState(ler);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const f = () => setArea(ler());
    vv.addEventListener("resize", f);
    vv.addEventListener("scroll", f);
    return () => { vv.removeEventListener("resize", f); vv.removeEventListener("scroll", f); };
  }, []);
  return area;
}

const rotulo = { display: "block", fontSize: 16, fontWeight: 600, color: T.ink, marginBottom: 8 };
const campo = {
  display: "block", width: "100%", boxSizing: "border-box", minHeight: 52, borderRadius: 12,
  border: "1.5px solid #D9CCBC", background: "#FFFFFF", padding: "0 14px", fontFamily: FONTE, fontSize: 17, color: T.ink,
};
const apoio = { fontSize: 15, color: T.inkSoft, lineHeight: 1.45 };
const botaoPrincipal = (ativo = true) => ({
  width: "100%", minHeight: 54, borderRadius: 14, border: "none", background: T.primary, color: "#FFFFFF",
  fontFamily: FONTE, fontSize: 17, fontWeight: 600, cursor: ativo ? "pointer" : "default", opacity: ativo ? 1 : 0.55,
});
const botaoContorno = {
  width: "100%", minHeight: 54, borderRadius: 14, border: "1.5px solid #E6DCCF", background: "#FFFFFF", color: T.ink,
  fontFamily: FONTE, fontSize: 17, fontWeight: 600, cursor: "pointer",
};

function Vezes({ valor, onMudar }) {
  const bolinha = { width: 52, height: 52, borderRadius: 26, border: "1.5px solid #D9CCBC", background: "#FFFFFF", color: T.ink, fontSize: 24, fontFamily: FONTE, cursor: "pointer", flexShrink: 0 };
  return (
    <div>
      <span style={rotulo} id="vezes-rotulo">Quantas vezes por semana?</span>
      <div role="group" aria-labelledby="vezes-rotulo" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button type="button" aria-label="Menos uma vez" disabled={valor <= 1} onClick={() => onMudar(Math.max(1, valor - 1))} style={{ ...bolinha, opacity: valor <= 1 ? 0.4 : 1 }}>−</button>
        <span aria-live="polite" style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 600, color: T.ink }}>{valor} {valor === 1 ? "vez" : "vezes"}</span>
        <button type="button" aria-label="Mais uma vez" disabled={valor >= 7} onClick={() => onMudar(Math.min(7, valor + 1))} style={{ ...bolinha, opacity: valor >= 7 ? 0.4 : 1 }}>+</button>
      </div>
    </div>
  );
}

// modo: "metodo" | "pessoal" | "criar"
// inicial: { nome, meta, vezes, minimo }
// onSalvar(valores) e onTirar() devolvem uma Promise<boolean> (true = salvou)
export function PainelEditar({ modo, inicial = {}, onSalvar, onTirar, onFechar, focarMinimo = false }) {
  const [nome, setNome] = useState(inicial.nome || "");
  const [meta, setMeta] = useState(inicial.meta || "");
  const [vezes, setVezes] = useState(inicial.vezes || 3);
  const [minimo, setMinimo] = useState(inicial.minimo || "");
  const [confirmarTirar, setConfirmarTirar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const tituloRef = useRef(null);
  const minimoRef = useRef(null);
  const corpoRef = useRef(null);
  const area = useAreaVisivel();
  const origem = useRef(typeof document !== "undefined" ? document.activeElement : null);

  const titulo = confirmarTirar ? "Tirar hábito da lista" : modo === "criar" ? "Criar um hábito meu" : `Editar ${inicial.nome || ""}`;

  // foco no título ao abrir (e ao trocar para a confirmação); volta ao botão "Editar" ao fechar
  // ("Definir meu mínimo" abre já no campo do mínimo)
  useEffect(() => {
    if (focarMinimo && !confirmarTirar && minimoRef.current) { const el = minimoRef.current; setTimeout(() => { el.focus(); el.scrollIntoView({ block: "center" }); }, 280); }
    else tituloRef.current?.focus();
  }, [confirmarTirar]);
  useEffect(() => () => { try { origem.current?.focus?.(); } catch {} }, []);
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape" && !salvando) onFechar(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [salvando, onFechar]);

  // campo com foco: rola até ele e deixa o botão de salvar à vista
  const aoFocar = (e) => { const el = e.target; setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300); };

  const podeSalvar = !salvando && (modo === "metodo" || nome.trim().length > 0);
  const salvar = async () => {
    if (!podeSalvar) return;
    setSalvando(true);
    const ok = await onSalvar({ nome: nome.trim(), meta: meta.trim(), vezes, minimo: minimo.trim() });
    setSalvando(false);
    if (ok) onFechar();
  };
  const tirar = async () => {
    setSalvando(true);
    const ok = await onTirar();
    setSalvando(false);
    if (ok) onFechar();
  };

  const reduz = reduzMovimento();
  return (
    <div onClick={() => !salvando && onFechar()}
         style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(31,26,23,.45)", fontFamily: FONTE,
                  animation: "augeFade .25s ease-out" }}>
      <style>{ESTILOS}</style>
      <div role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}
           style={{ position: "absolute", left: 0, right: 0, bottom: area.baixo, maxWidth: 520, margin: "0 auto",
                    maxHeight: Math.round(area.altura * 0.9), display: "flex", flexDirection: "column",
                    background: "#FFFFFF", borderRadius: "24px 24px 0 0", boxShadow: "0 -8px 30px rgba(31,26,23,.18)",
                    animation: reduz ? "augeFade .25s ease-out" : "augeSheetSobe .25s ease-out" }}>
        <div ref={corpoRef} style={{ overflowY: "auto", padding: "12px 20px 28px", WebkitOverflowScrolling: "touch" }}>
          <div aria-hidden="true" style={{ width: 40, height: 5, borderRadius: 3, background: "#E6DCCF", margin: "0 auto 16px" }} />
          <h2 ref={tituloRef} tabIndex={-1} style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700, color: T.ink, lineHeight: 1.2, outline: "none" }}>{titulo}</h2>

          {confirmarTirar ? (
            <>
              <p style={{ margin: "0 0 24px", fontSize: 17, lineHeight: 1.5, color: T.ink }}>
                Tirar <b>{inicial.nome}</b> da sua lista? O histórico fica guardado.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <button onClick={tirar} disabled={salvando} style={botaoPrincipal(!salvando)}>{salvando ? "Salvando…" : "Sim, tirar da lista"}</button>
                <button onClick={() => setConfirmarTirar(false)} disabled={salvando} style={botaoContorno}>Não, manter</button>
              </div>
            </>
          ) : (
            <>
              {modo === "metodo" && (
                <div style={{ background: "#F4EDE3", borderRadius: 14, padding: "12px 14px", marginBottom: 20, ...apoio, color: T.ink }}>
                  Este é um hábito do método AUGE. Você pode ajustar a sua meta e o seu mínimo.
                </div>
              )}

              <div style={{ display: "grid", gap: 20 }}>
                {modo !== "metodo" && (
                  <label style={{ display: "block" }}>
                    <span style={rotulo}>Nome do hábito</span>
                    {/* 25 caracteres: o nome entra no lembrete das 19h e nome comprido é cortado */}
                    <input value={nome} onChange={(e) => setNome(e.target.value)} onFocus={aoFocar} maxLength={25} placeholder="ex: Água" style={campo} />
                  </label>
                )}
                <label style={{ display: "block" }}>
                  <span style={rotulo}>Sua meta</span>
                  <input value={meta} onChange={(e) => setMeta(e.target.value)} onFocus={aoFocar} maxLength={60}
                         placeholder={modo === "metodo" ? "ex: 20 minutos de caminhada" : "ex: 2 litros por dia"} style={campo} />
                </label>
                <Vezes valor={vezes} onMudar={setVezes} />
                {modo === "metodo" && (
                  <label style={{ display: "block" }}>
                    <span style={rotulo}>Seu mínimo para dias difíceis</span>
                    <span style={{ ...apoio, display: "block", margin: "-2px 0 8px" }}>Bem menor que a meta. É o que você faz mesmo num dia pesado.</span>
                    <input ref={minimoRef} value={minimo} onChange={(e) => setMinimo(e.target.value)} onFocus={aoFocar} maxLength={60}
                           placeholder="ex: 5 minutos" style={campo} />
                  </label>
                )}
              </div>

              {modo !== "criar" && (
                <p style={{ ...apoio, margin: "20px 0 0" }}>As mudanças valem a partir de hoje. O que você já fez nesta semana continua contando.</p>
              )}

              <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                <button onClick={salvar} disabled={!podeSalvar} style={botaoPrincipal(podeSalvar)}>
                  {salvando ? "Salvando…" : modo === "criar" ? "Criar hábito" : "Salvar mudanças"}
                </button>
                <button onClick={onFechar} disabled={salvando} style={botaoContorno}>Cancelar</button>
              </div>

              {modo === "pessoal" && onTirar && (
                <button onClick={() => setConfirmarTirar(true)}
                        style={{ display: "block", margin: "18px auto 0", minHeight: 44, background: "none", border: "none", fontFamily: FONTE,
                                 fontSize: 16, fontWeight: 600, color: T.primary, textDecoration: "underline", cursor: "pointer" }}>
                  Tirar este hábito da lista
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Botão "Editar" do cartão
export function BotaoEditar({ nome, onClick }) {
  return (
    <button onClick={onClick} aria-label={`Editar ${nome}`}
            style={{ minWidth: 44, minHeight: 44, borderRadius: 12, border: "1px solid #E6DCCF", background: "#FFFFFF",
                     color: T.inkSoft, fontFamily: FONTE, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6,
                     padding: "0 10px", cursor: "pointer", flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" />
      </svg>
      {/* em celular estreito fica só o lápis: o nome do hábito não cabia ao lado */}
      <span className="auge-editar-txt">Editar</span>
      <style>{"@media (max-width: 359px){.auge-editar-txt{display:none}}"}</style>
    </button>
  );
}

// Aviso da tela Hoje: acima da barra de baixo, um por vez
export function AvisoHoje({ aviso }) {
  if (!aviso) return null;
  return (
    <div role="status" key={aviso.id}
         style={{ position: "fixed", left: 20, right: 20, bottom: 96, zIndex: 900, maxWidth: 480, margin: "0 auto",
                  background: T.ink, color: "#FFFFFF", fontFamily: FONTE, fontSize: 16, lineHeight: 1.4,
                  borderRadius: 16, padding: "14px 16px", boxShadow: "0 8px 24px rgba(31,26,23,.25)",
                  animation: "augeAvisoSobe .25s ease-out" }}>
      <style>{ESTILOS}</style>
      {aviso.msg}
    </div>
  );
}
