// ─── TELAS DE ENTRADA (login, cadastro, recuperar senha) ─────────────────────
// Peças visuais só: quem usa (TelaAuth, no AugeApp.jsx) cuida dos dados.
// Mesma linguagem da tela Hoje e do painel "Editar": Inter, campos em caixa
// branca com borda visível, botão principal terracota com letra branca.
// Público 40+: campo de 54px, rótulo de 16px, nada abaixo de 15px, nada em
// peso 300, e toque mínimo de 48px em tudo que se clica.
import { useState } from "react";
import { T, FONTE } from "../tokens.js";

export function TituloEntrada({ titulo, subtitulo }) {
  return (
    <div style={{ fontFamily: FONTE, margin: "24px 0 28px", textAlign: "center" }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em", color: T.ink }}>{titulo}</h1>
      {subtitulo && <p style={{ margin: "6px 0 0", fontSize: 17, lineHeight: 1.45, color: T.inkSoft }}>{subtitulo}</p>}
    </div>
  );
}

const rotulo = { display: "block", fontFamily: FONTE, fontSize: 16, fontWeight: 600, color: T.ink, marginBottom: 8 };
const caixa = (foco) => ({
  display: "flex", alignItems: "center", minHeight: 54, borderRadius: 12, background: T.surface,
  border: `1.5px solid ${foco ? T.primary : T.lineForte}`, boxShadow: foco ? `0 0 0 3px ${T.primary}22` : "none",
  transition: "border-color .15s, box-shadow .15s",
});

// Campo com rótulo em cima. tipo="senha" ganha o botão "Mostrar".
export function CampoEntrada({ id, rotulo: texto, ajuda, tipo = "texto", valor, onMudar, onEnter, placeholder, autoComplete }) {
  const [foco, setFoco] = useState(false);
  const [ver, setVer] = useState(false);
  const senha = tipo === "senha";
  return (
    <label htmlFor={id} style={{ display: "block", marginBottom: 18 }}>
      <span style={rotulo}>{texto}</span>
      <div style={caixa(foco)}>
        <input
          id={id}
          type={senha ? (ver ? "text" : "password") : tipo === "email" ? "email" : "text"}
          inputMode={tipo === "email" ? "email" : undefined}
          autoCapitalize={tipo === "email" || senha ? "none" : "words"}
          autoCorrect="off"
          autoComplete={autoComplete}
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, height: 51, border: "none", outline: "none", background: "transparent",
                   padding: "0 14px", fontFamily: FONTE, fontSize: 17, color: T.ink, borderRadius: 12 }}
        />
        {senha && (
          <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? "Esconder senha" : "Mostrar senha"}
                  style={{ minWidth: 48, minHeight: 48, padding: "0 14px", border: "none", background: "none", cursor: "pointer",
                           fontFamily: FONTE, fontSize: 15, fontWeight: 600, color: T.primary }}>
            {ver ? "Esconder" : "Mostrar"}
          </button>
        )}
      </div>
      {ajuda && <span style={{ display: "block", marginTop: 6, fontFamily: FONTE, fontSize: 15, color: T.inkSoft }}>{ajuda}</span>}
    </label>
  );
}

export function BotaoEntrada({ children, onClick, carregando = false, contorno = false, style }) {
  return (
    <button type="button" className="aug-toque" onClick={carregando ? undefined : onClick} aria-busy={carregando || undefined}
            style={{ width: "100%", minHeight: 54, borderRadius: 14, cursor: carregando ? "default" : "pointer",
                     fontFamily: FONTE, fontSize: 17, fontWeight: 600,
                     ...(contorno
                       ? { background: T.surface, color: T.ink, border: `1.5px solid ${T.line}` }
                       : { background: T.primary, color: T.onColor, border: "none", opacity: carregando ? 0.8 : 1 }),
                     ...style }}>
      {children}
    </button>
  );
}

// Link de texto com área de toque de 48px
export function LinkEntrada({ children, onClick, style }) {
  return (
    <button type="button" onClick={onClick}
            style={{ minHeight: 48, padding: "0 4px", border: "none", background: "none", cursor: "pointer",
                     fontFamily: FONTE, fontSize: 16, fontWeight: 600, color: T.primary,
                     textDecoration: "underline", textUnderlineOffset: 3, ...style }}>
      {children}
    </button>
  );
}

// tom: "erro" (bege rosado, texto escuro — nunca vermelho gritando) · "ok"
export function AvisoEntrada({ tom = "erro", titulo, children }) {
  const erro = tom === "erro";
  return (
    <div role={erro ? "alert" : "status"}
         style={{ fontFamily: FONTE, background: erro ? T.blush : T.surfaceSoft, borderRadius: 14, padding: "14px 16px",
                  border: `1px solid ${erro ? T.primary + "40" : T.line}`, marginBottom: 18 }}>
      {titulo && <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{titulo}</div>}
      <div style={{ fontSize: 16, lineHeight: 1.5, color: T.ink }}>{children}</div>
    </div>
  );
}

// Caixinha de aceite com área de toque grande
export function AceiteEntrada({ marcado, onMudar, children }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 22 }}>
      <button type="button" role="checkbox" aria-checked={marcado} aria-label="Aceito os termos de uso e a política de privacidade" onClick={() => onMudar(!marcado)}
              style={{ width: 48, height: 48, margin: "-11px -11px 0 -11px", border: "none", background: "none", cursor: "pointer",
                       display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, border: `2px solid ${marcado ? T.primary : T.lineForte}`,
                       background: marcado ? T.primary : T.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {marcado && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
        </span>
      </button>
      <div style={{ fontFamily: FONTE, fontSize: 16, lineHeight: 1.5, color: T.ink }}>{children}</div>
    </div>
  );
}
