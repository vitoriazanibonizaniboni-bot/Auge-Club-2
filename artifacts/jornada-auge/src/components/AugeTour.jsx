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
export function PassoAPasso({ antiga = false, onFechar, passos = null, rotulo = "Como funciona o app" }) {
  const [passo, setPasso] = useState(0);
  const [dir, setDir] = useState(1);
  const tituloRef = useRef(null);
  const toque = useRef(null);
  const PASSOS = passos || [
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
    <div role="dialog" aria-modal="true" aria-label={rotulo} onTouchStart={inicio} onTouchEnd={fim}
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

// ── Passo a passo de cada aba (primeira vez que ela abre a aba) ──────────────
// Mesmo formato do passo a passo da Hoje: ilustração, título, texto e "Próximo".
const Cartao = ({ children, estilo }) => (
  <div style={{ width: "86%", maxWidth: 300, background: "#FFFFFF", borderRadius: 18, boxShadow: "0 6px 20px rgba(31,26,23,.10)", padding: 16, fontFamily: FONTE, boxSizing: "border-box", ...estilo }}>{children}</div>
);
const Botaozinho = ({ children, cor = T.primary, texto = "#FFFFFF", anel = true, borda }) => (
  <div style={{ height: 46, borderRadius: 14, background: cor, color: texto, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: anel ? ANEL : "none", border: borda }}>{children}</div>
);
const Coracao = ({ cheio, tam = 26 }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill={cheio ? T.primary : "none"} stroke={T.primary} strokeWidth="1.9" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.4 4.8 6.8 4.8c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.3 3.4 4.1 6.5-1.8 4.6-9.3 9.2-9.3 9.2z" /></svg>
);

export const PASSOS_ABA = {
  trajetoria: [
    {
      titulo: "As suas 12 semanas",
      texto: <>A linha mostra em que {forte("semana da Jornada")} você está. Cada semana, um passo a mais.</>,
      ilustra: (
        <Ilustracao fundo="#F4EDE3">
          <svg width="86%" viewBox="0 0 380 158" fill="none" aria-hidden="true">
            <path d="M 35 126 C 110 142 272 46 350 38" stroke="#C4A882" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="350" cy="38" r="5" fill="#C4A882" />
            <circle cx="236" cy="78" r="12" fill={T.primary} style={{ filter: "drop-shadow(0 0 6px rgba(181,86,60,.45))" }} />
            <text x="236" y="56" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="20" fill={T.ink}>S9</text>
          </svg>
        </Ilustracao>
      ),
    },
    {
      titulo: "Cada hábito no seu mês",
      texto: <>Veja quantos dias você fez cada hábito {forte("neste mês")}. Toque num hábito para ver o {forte("calendário")} dele.</>,
      ilustra: (
        <Ilustracao fundo="#F2E4DC">
          <Cartao estilo={{ boxShadow: ANEL }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: T.ink }}>Movimento</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#7E6038", marginTop: 2 }}>11 dias em outubro</div>
              </div>
              <span style={{ fontSize: 24, color: T.inkSoft }}>›</span>
            </div>
          </Cartao>
        </Ilustracao>
      ),
    },
  ],
  mural: [
    {
      titulo: "Mostre o que você fez por você",
      texto: <>Poste uma {forte("foto")} do seu hábito feito. Cada vitória pequena conta.</>,
      ilustra: (
        <Ilustracao fundo="#F2E4DC">
          <Cartao estilo={{ textAlign: "center" }}>
            <div style={{ fontSize: 30 }}>📸</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, margin: "6px 0 12px" }}>O que você fez por você hoje?</div>
            <Botaozinho>Postar</Botaozinho>
          </Cartao>
        </Ilustracao>
      ),
    },
    {
      titulo: "Torça pelas colegas",
      texto: <>{forte("Curta")} e {forte("comente")} as vitórias das colegas da sua turma.</>,
      ilustra: (
        <Ilustracao fundo="#F4EDE3">
          <Cartao>
            <div style={{ height: 110, borderRadius: 12, background: "linear-gradient(135deg,#D8B79C,#B5563C)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 16, fontWeight: 600, color: T.ink }}>
              <span style={{ borderRadius: 999, boxShadow: ANEL, display: "flex", padding: 2 }}><Coracao cheio tam={24} /></span> Curtir
              <span style={{ marginLeft: 16, color: T.inkSoft }}>Comentar</span>
            </div>
          </Cartao>
        </Ilustracao>
      ),
    },
    {
      titulo: "Ou guarde só para você",
      texto: <>Ao postar, escolha {forte("Só para mim")} se quiser que ninguém mais veja.</>,
      ilustra: (
        <Ilustracao fundo="#EEF0E4">
          <Cartao>
            <div style={{ display: "grid", gap: 10 }}>
              <Botaozinho cor="#FFFFFF" texto={T.ink} anel={false} borda="1.5px solid #E6DCCF">Público</Botaozinho>
              <Botaozinho cor="#F2E4DC" texto={T.ink} borda="1.5px solid #D8B79C">Só para mim</Botaozinho>
            </div>
          </Cartao>
        </Ilustracao>
      ),
    },
  ],
  meumapa: [
    {
      titulo: "Quem você quer ser",
      texto: <>Aqui fica a sua {forte("Âncora")}, a frase que lembra a mulher que você está se tornando.</>,
      ilustra: (
        <Ilustracao fundo="#F4EDE3">
          <div style={{ width: "86%", maxWidth: 300, background: "#F2E4DC", borderRadius: 20, padding: "16px 18px", fontFamily: FONTE, boxShadow: ANEL }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>Minha âncora</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: T.ink, lineHeight: 1.4, marginTop: 6 }}>"Eu sou a mulher que cuida de si sem pedir licença."</div>
          </div>
        </Ilustracao>
      ),
    },
    {
      titulo: "O seu mapa completo",
      texto: <>A {forte("Roda AUGE")}, os seus {forte("mínimos")} e os {forte("Espaços de escrita")}, com os seus Porquês e a Carta para o Futuro.</>,
      ilustra: (
        <Ilustracao fundo="#F2E4DC">
          <div style={{ display: "grid", gap: 10, width: "86%", maxWidth: 300 }}>
            {["Roda AUGE", "Seus mínimos", "Espaços de escrita"].map((t) => (
              <div key={t} style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px", fontFamily: FONTE, fontSize: 16, fontWeight: 600, color: T.ink, display: "flex", justifyContent: "space-between" }}>
                {t}<span style={{ color: T.inkSoft }}>›</span>
              </div>
            ))}
          </div>
        </Ilustracao>
      ),
    },
    {
      titulo: "Perfil e configurações",
      texto: <>O {forte("círculo com a sua inicial")}, no alto da tela, abre o seu Perfil, as notificações e a saída da conta.</>,
      ilustra: (
        <Ilustracao fundo="#EEF0E4">
          <span style={{ width: 88, height: 88, borderRadius: 44, background: "#F2E4DC", color: T.primary, fontFamily: FONTE, fontSize: 36, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: ANEL }}>
            {/* no app aparece a inicial de cada aluna; aqui, um ícone de pessoa */}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          </span>
        </Ilustracao>
      ),
    },
  ],
  conteudo: [
    {
      titulo: "Encontre o que precisa",
      texto: <>{forte("Busque")} por aula, meditação ou podcast, ou use os {forte("filtros")} logo abaixo.</>,
      ilustra: (
        <Ilustracao fundo="#F4EDE3">
          <div style={{ width: "86%", maxWidth: 300, height: 50, borderRadius: 16, background: "#FFFFFF", border: "1px solid #E6DCCF", boxShadow: ANEL, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", fontFamily: FONTE, fontSize: 16, color: "#8A7A6E" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A7A6E" strokeWidth="1.9" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            Buscar aulas, meditações...
          </div>
        </Ilustracao>
      ),
    },
    {
      titulo: "Guarde nas Favoritas",
      texto: <>Toque no {forte("coração")} de um conteúdo para encontrá-lo depois em {forte("Favoritas")}.</>,
      ilustra: (
        <Ilustracao fundo="#F2E4DC">
          <Cartao>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 52, height: 52, borderRadius: 14, background: "#6E5A8A", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: T.ink }}>Respiração para dormir</span>
              <span style={{ borderRadius: 999, boxShadow: ANEL, display: "flex", padding: 4 }}><Coracao cheio /></span>
            </div>
          </Cartao>
        </Ilustracao>
      ),
    },
    {
      titulo: "Marque o que já viu",
      texto: <>Depois de assistir, toque em {forte("Marcar como assistido")}. Assim você sabe por onde continuar.</>,
      ilustra: (
        <Ilustracao fundo="#EEF0E4">
          <Cartao>
            <Botaozinho cor={T.olive}>✓ Assistido</Botaozinho>
          </Cartao>
        </Ilustracao>
      ),
    },
  ],
};
export const ROTULO_ABA = { trajetoria: "Como usar a Trajetória", mural: "Como usar o Mural", meumapa: "Como usar o Meu Mapa", conteudo: "Como usar o Conteúdo" };
