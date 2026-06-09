import { useState, useRef, useCallback, useEffect } from "react";
import { requestPermission, scheduleAll, clearAll } from "./notifications.js";
import { supabase } from "./supabase.js";

// ─── BRAND KIT ────────────────────────────────────────────────────────────────
const C = {
  creme: "#FAF6EE",
  linho: "#F0E9DA",
  branco: "#FFFFFF",
  obs: "#1C1A17",
  obs2: "#2E2825",
  mid: "#5A4B43",
  lt: "#9C8880",
  ouro: "#C4A882",
  ouroDk: "#A8865A",
  ouroLt: "#EAD8B8",
  blush: "#E2B9A8",
  terra: "#7E5344",
  atencao: "#A32D2D",
  dev: "#854F0B",
  augeZ: "#0F6E56",
};
const FS = "'Cormorant Garamond', Georgia, serif";
const FB = "'Inter', sans-serif";

// ─── TELAS ────────────────────────────────────────────────────────────────────
const S = {
  SPLASH: "splash",
  LEGAL: "legal",
  LOGIN: "login",
  // Abas principais
  HOME: "home", // checkin + calendário
  FEED: "feed", // feed da comunidade
  JOR: "jor", // jornada (restrita)
  CT: "ct", // conteúdo
  PF: "pf", // perfil
  // Subpáginas Feed
  NOVO: "novo",
  VOZ: "voz",
  // Subpáginas Conexões (dentro do Feed)
  CX: "cx",
  MATCH: "match",
  CHAT: "chat",
  // Subpáginas Jornada
  RODA: "roda",
  RET: "ret",
  CAL: "cal",
  ESC: "esc",
  EM: "em",
  // Diagnóstico
  DIAG: "diag",
  // Onboarding — setup de hábitos
  HABSETUP: "habsetup",
  // Painel da Mentora
  ADMIN: "admin",
};

const ABA_ORIGEM = {
  [S.HOME]: S.HOME,
  [S.FEED]: S.FEED,
  [S.NOVO]: S.FEED,
  [S.VOZ]: S.FEED,
  [S.CX]: S.FEED,
  [S.MATCH]: S.FEED,
  [S.CHAT]: S.FEED,
  [S.JOR]: S.JOR,
  [S.RODA]: S.JOR,
  [S.RET]: S.JOR,
  [S.CAL]: S.HOME,
  [S.ESC]: S.JOR,
  [S.EM]: S.JOR,
  [S.CT]: S.CT,
  [S.PF]: S.PF,
};

// ─── DADOS ────────────────────────────────────────────────────────────────────
const HAB = {
  1: [{ id: 1, t: "Fiz meu movimento hoje" }],
  2: [
    { id: 1, t: "Fiz meu movimento" },
    { id: 2, t: "Não pulei nenhuma refeição" },
    { id: 3, t: "Bebi 1,5L de água" },
    { id: 4, t: "Proteína em 2+ refeições" },
  ],
  3: [
    { id: 1, t: "Fiz meu movimento" },
    { id: 2, t: "Não pulei nenhuma refeição" },
    { id: 3, t: "Bebi 1,5L de água" },
    { id: 4, t: "Proteína em 2+ refeições" },
    { id: 5, t: "Tive um momento só meu" },
    { id: 6, t: "Respeitei meu horário de dormir" },
  ],
};

const PERFIS_CX = [
  {
    id: 1,
    nome: "Mariana Costa",
    ini: "MC",
    cor: "#8B4A6B",
    idade: 52,
    cidade: "São Paulo",
    bio: "Pilates e caminhada. Busco parceira de manhã!",
    hab: ["Pilates", "Caminhada"],
    ok: true,
    compat: 92,
    msgs: [],
  },
  {
    id: 2,
    nome: "Cecília Alves",
    ini: "CA",
    cor: "#3A6B5C",
    idade: 60,
    cidade: "Curitiba",
    bio: "Musculação 4x semana. Energia total!",
    hab: ["Musculação", "Funcional"],
    ok: true,
    compat: 85,
    msgs: [],
  },
  {
    id: 3,
    nome: "Lúcia Mendes",
    ini: "LM",
    cor: "#5C4A8B",
    idade: 56,
    cidade: "Florianópolis",
    bio: "Amo nadar e estar perto do mar.",
    hab: ["Natação", "Caminhada"],
    ok: false,
    compat: 78,
    msgs: [],
  },
];

const FEED0 = [
  {
    id: 1,
    aut: "Mariana Costa",
    ini: "MC",
    cor: "#8B4A6B",
    fundo: "#2A2030",
    tit: "Sentei pra ler 15 min",
    desc: "Em vez de scrollar antes de dormir. Primeira vez em semanas que a noite foi minha.",
    tempo: "há 1h",
    publica: true,
    cur: ["CA"],
    com: [{ q: "CA", t: "Comigo também 💛" }],
  },
  {
    id: 2,
    aut: "Cecília Alves",
    ini: "CA",
    cor: "#3A6B5C",
    fundo: "#1E2E28",
    tit: "Almocei sentada, sem pressa",
    desc: "Sem tela. Primeira vez na semana. Parece pouco, mas é tudo.",
    tempo: "há 3h",
    publica: true,
    cur: [],
    com: [],
  },
  {
    id: 3,
    aut: "Você",
    ini: "RF",
    cor: C.ouroDk,
    fundo: "#1E252E",
    tit: "Voltei depois de 3 dias",
    desc: "Caminhei 10 min. Conta.",
    tempo: "há 6h",
    publica: true,
    cur: ["MC", "CA"],
    com: [],
  },
];

const RODA_Q = [
  {
    id: 1,
    dim: "Energia",
    tipo: "f",
    q: "Acordo com disposição e energia para começar o dia.",
  },
  {
    id: 2,
    dim: "Energia",
    tipo: "f",
    q: "Tenho energia suficiente para cumprir minhas obrigações sem me sentir esgotada no fim do dia.",
  },
  {
    id: 3,
    dim: "Energia",
    tipo: "f",
    q: "Me movimento ou pratico alguma atividade física durante a semana.",
  },
  {
    id: 4,
    dim: "Energia",
    tipo: "f",
    q: "Durmo e acordo em horários regulares.",
  },
  {
    id: 5,
    dim: "Energia",
    tipo: "f",
    q: "Consigo descansar de verdade quando preciso, sem culpa ou ansiedade.",
  },
  {
    id: 6,
    dim: "Consciência",
    tipo: "c",
    q: "Sei identificar o que me drena energia e o que me renova.",
  },
  {
    id: 7,
    dim: "Consciência",
    tipo: "c",
    q: "Conheço meus padrões de sabotagem: o que me faz desistir quando começo algo.",
  },
  {
    id: 8,
    dim: "Consciência",
    tipo: "c",
    q: "Consigo nomear o que quero para os próximos anos da minha vida.",
  },
  {
    id: 9,
    dim: "Consciência",
    tipo: "c",
    q: "Me percebo mudando com o tempo e aceito isso sem tanto sofrimento.",
  },
  {
    id: 10,
    dim: "Consciência",
    tipo: "c",
    q: "Consigo diferenciar o que é meu do que são expectativas dos outros sobre mim.",
  },
  {
    id: 11,
    dim: "Organização",
    tipo: "f",
    q: "Sei quais são minhas prioridades da semana antes de ela começar.",
  },
  {
    id: 12,
    dim: "Organização",
    tipo: "f",
    q: "Cumpro o que me comprometo a fazer por mim mesma.",
  },
  {
    id: 13,
    dim: "Organização",
    tipo: "f",
    q: "Tenho ao menos um momento na semana dedicado exclusivamente a mim.",
  },
  {
    id: 14,
    dim: "Organização",
    tipo: "f",
    q: "Quando a rotina desmorona, consigo retomar sem esperar o momento perfeito.",
  },
  {
    id: 15,
    dim: "Organização",
    tipo: "f",
    q: "Distribuo minhas tarefas de forma que não me sobrecarregue num único dia.",
  },
  {
    id: 16,
    dim: "Autocuidado",
    tipo: "f",
    q: "Faço refeições com qualidade, sem pular nenhuma ao longo do dia.",
  },
  {
    id: 17,
    dim: "Autocuidado",
    tipo: "f",
    q: "Bebo água com regularidade durante o dia.",
  },
  {
    id: 18,
    dim: "Autocuidado",
    tipo: "f",
    q: "Tenho algum ritual de cuidado pessoal que faço por mim, não por obrigação.",
  },
  {
    id: 19,
    dim: "Autocuidado",
    tipo: "f",
    q: "Vou a consultas médicas e exames de rotina sem precisar ser lembrada.",
  },
  {
    id: 20,
    dim: "Autocuidado",
    tipo: "f",
    q: "Dedico tempo ao que me dá prazer fora das obrigações do trabalho e da família.",
  },
  {
    id: 21,
    dim: "Protagonismo",
    tipo: "c",
    q: "Sinto que tenho controle sobre as escolhas que definem minha vida.",
  },
  {
    id: 22,
    dim: "Protagonismo",
    tipo: "c",
    q: "Quando algo não está bem, busco ativamente mudar em vez de esperar.",
  },
  {
    id: 23,
    dim: "Protagonismo",
    tipo: "c",
    q: "Me permito colocar minhas necessidades como prioridade sem me sentir egoísta.",
  },
  {
    id: 24,
    dim: "Protagonismo",
    tipo: "c",
    q: "Acredito que o melhor da minha vida ainda está por vir.",
  },
  {
    id: 25,
    dim: "Protagonismo",
    tipo: "c",
    q: "Tomo decisões sobre minha saúde e bem-estar sem depender da aprovação de outros.",
  },
];
const DIMS = [
  "Energia",
  "Consciência",
  "Organização",
  "Autocuidado",
  "Protagonismo",
];
const OFREQ = [
  { l: "Nunca", v: 0 },
  { l: "Às vezes", v: 3.33 },
  { l: "Quase sempre", v: 6.67 },
  { l: "Sempre", v: 10 },
];
const OCONC = [
  { l: "Discordo totalmente", v: 0 },
  { l: "Discordo", v: 3.33 },
  { l: "Concordo", v: 6.67 },
  { l: "Concordo totalmente", v: 10 },
];
const CAL_D = {
  1: "f",
  2: "f",
  3: "p",
  4: "f",
  5: "f",
  6: "v",
  7: "f",
  8: "f",
  9: "f",
  10: "p",
  11: "f",
  12: "f",
  13: "k",
  14: "f",
  15: "v",
  16: "f",
  17: "f",
  18: "p",
  19: "f",
  20: "f",
  21: "*",
  22: "f",
  23: "f",
  24: "v",
  25: "f",
  26: "h",
};

const DIAG_Q = [
  {
    id: 1,
    q: "Quando estabeleço uma meta e erro uma vez, costumo:",
    opts: [
      "Recomeçar do zero na semana seguinte",
      "Continuar do ponto onde parei",
      "Desistir completamente",
      "Reduzir a meta e manter o ritmo",
    ],
  },
  {
    id: 2,
    q: "Minha relação com rotinas é:",
    opts: [
      "Amo rotinas, me sinto perdida sem elas",
      "Prefiro flexibilidade total",
      "Começo bem mas tenho dificuldade em manter",
      "Funciona por períodos, depois abandono",
    ],
  },
  {
    id: 3,
    q: "Quando não estou com motivação para algo saudável:",
    opts: [
      "Espero a vontade aparecer",
      "Faço mesmo sem vontade, ainda que menos",
      "Compenso depois com mais intensidade",
      "Busco alguém para me apoiar",
    ],
  },
  {
    id: 4,
    q: "Meu maior desafio com hábitos é:",
    opts: [
      "Começar",
      "Manter consistência",
      "Retomar após uma pausa",
      "Não me cobrar demais",
    ],
  },
  {
    id: 5,
    q: "Diante de um imprevisto que muda minha rotina:",
    opts: [
      "Fico ansiosa e busco uma alternativa",
      "Aceito que o dia foi perdido",
      "Faço uma versão reduzida do que planejei",
      "Ajusto na semana seguinte",
    ],
  },
  {
    id: 6,
    q: "Quando sinto que não estou conseguindo fazer tudo como planejei:",
    opts: [
      "Me cobro muito e fico desmotivada",
      "Ajusto o plano sem me culpar",
      "Paro tudo e recomeço depois",
      "Peço ajuda ou busco apoio",
    ],
  },
  {
    id: 7,
    q: "Quando dedico tempo para mim mesma, eu:",
    opts: [
      "Me sinto culpada — parece egoísmo",
      "Aproveito sem culpa, sei que preciso",
      "Consigo, mas preciso me convencer primeiro",
      "Raramente consigo — sempre tem outra prioridade",
    ],
  },
  {
    id: 8,
    q: "Em qual momento do dia você tem mais energia e autonomia?",
    opts: [
      "Manhã cedo, antes de tudo começar",
      "Durante o dia, entre os compromissos",
      "Final da tarde ou noite",
      "Varia muito — não tenho um padrão",
    ],
  },
  {
    id: 9,
    q: "Quando preciso manter um hábito por conta própria (sem grupo ou parceira):",
    opts: [
      "Consigo bem, prefiro seguir no meu ritmo",
      "É difícil, me sinto mais motivada em grupo",
      "Começo, mas preciso de lembretes externos",
      "Depende do hábito — alguns consigo, outros não",
    ],
  },
  {
    id: 10,
    q: "O que mais te motivaria a permanecer consistente nas próximas 12 semanas?",
    opts: [
      "Ver resultados concretos no meu corpo e saúde",
      "Sentir que estou cuidando de mim de verdade",
      "Fazer parte de uma comunidade que me apoia",
      "Provar para mim mesma que consigo ser consistente",
    ],
  },
];

const MEDALHAS = [
  { id: "momentum", icon: "🥇", nome: "Largada de Momentum", cor: C.ouro },
  { id: "retomada", icon: "🛡️", nome: "Mestre da Retomada", cor: C.ouroDk },
  {
    id: "protagonista",
    icon: "👑",
    nome: "Protagonista Consistente",
    cor: C.ouroLt,
  },
];

// ─── SYNC SUPABASE (fire-and-forget, pega userId da sessão cacheada) ──────────
const syncDB = (table, data, options = {}) => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user) return;
    supabase
      .from(table)
      .upsert({ user_id: session.user.id, ...data }, options)
      .then(() => {});
  });
};
const syncInsert = (table, data) => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user) return;
    supabase
      .from(table)
      .insert({ user_id: session.user.id, ...data })
      .then(() => {});
  });
};

// ─── IA ───────────────────────────────────────────────────────────────────────
const iaCache = new Map();
const callISA = async (msg) => {
  if (iaCache.has(msg)) return iaCache.get(msg);
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}api/isa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    const d = await r.json();
    const t =
      d.text || d.error || "Não consegui processar agora. Tente em instantes!";
    iaCache.set(msg, t);
    return t;
  } catch {
    return "Estou com dificuldade de conexão. Tente em instantes! 🌿";
  }
};

// ─── LOCAL STORAGE HOOK ───────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  const set = (v) => {
    setVal((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  return [val, set];
}

// ─── LOGO SVG (brand kit oficial) ────────────────────────────────────────────
function Logo({ width = 200, fundo = "escuro" }) {
  const textoAuge = fundo === "escuro" ? "#F0E9DA" : "#1C1A17";
  const textoClube = fundo === "escuro" ? "#6B5E52" : "#9A8C7E";
  const arco = fundo === "escuro" ? "#C4A882" : "#C4A882";
  const tag = "#C4A882";
  const h = width * (158 / 380);
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 380 158"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", margin: "0 auto" }}
    >
      <path
        d="M 35 126 C 110 142 272 46 350 38"
        stroke={arco}
        strokeWidth="0.55"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="350" cy="38" r="1.5" fill={arco} />
      <text
        x="190"
        y="34"
        textAnchor="middle"
        fontFamily="'Inter',sans-serif"
        fontWeight="300"
        fontSize="10"
        letterSpacing="7"
        fill={textoClube}
      >
        CLUBE DO
      </text>
      <text
        x="190"
        y="110"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond',Georgia,serif"
        fontWeight="300"
        fontSize="80"
        letterSpacing="18"
        fill={textoAuge}
      >
        AUGE
      </text>
      <text
        x="190"
        y="144"
        textAnchor="middle"
        fontFamily="'Inter',sans-serif"
        fontWeight="300"
        fontSize="7"
        letterSpacing="4.5"
        fill={tag}
      >
        MÉTODO · MOVIMENTO · 40+
      </text>
    </svg>
  );
}

// ─── ÍCONES NAV ───────────────────────────────────────────────────────────────
const Ico = {
  home: (c) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  feed: (c) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  ),
  jor: (c) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  ct: (c) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  cx: (c) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  pf: (c) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
function Grain({ children, style = {} }) {
  return (
    <div style={{ position: "relative", minHeight: "100%", ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: C.obs,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function Phone({ children }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0D0D14",
        fontFamily: FB,
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          background: C.obs,
          borderRadius: 50,
          overflow: "hidden",
          position: "relative",
          boxShadow:
            "0 0 0 10px #0D0D14,0 0 0 12px #1a1a28,0 40px 80px rgba(0,0,0,.8)",
          display: "flex",
          flexDirection: "column",
        }}
      >

        {children}
      </div>
    </div>
  );
}
function Rolar({ children }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
      {children}
    </div>
  );
}
function Brinde({ msg }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        left: "50%",
        zIndex: 300,
        transform: "translateX(-50%)",
        background: C.obs2,
        color: C.ouro,
        padding: "10px 20px",
        borderRadius: 20,
        fontSize: 13,
        fontFamily: FS,
        fontStyle: "italic",
        boxShadow: "0 8px 24px rgba(0,0,0,.5)",
        whiteSpace: "nowrap",
        border: `1px solid ${C.ouro}44`,
        animation: "toastIn .3s ease",
      }}
    >
      {msg}
    </div>
  );
}
function Av({ ini, cor, sz = 40 }) {
  return (
    <div
      style={{
        width: sz,
        height: sz,
        borderRadius: "50%",
        flexShrink: 0,
        background: cor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.branco,
        fontWeight: 400,
        fontSize: sz * 0.32,
        fontFamily: FB,
      }}
    >
      {ini}
    </div>
  );
}
function BtnPill({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: C.ouroLt,
        border: "none",
        borderRadius: 50,
        padding: "16px",
        fontFamily: FB,
        fontWeight: 400,
        fontSize: 15,
        color: C.obs2,
        cursor: "pointer",
        letterSpacing: "0.06em",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
function BtnOut({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "transparent",
        border: `1px solid ${C.ouro}55`,
        borderRadius: 50,
        padding: "15px",
        fontFamily: FB,
        fontWeight: 300,
        fontSize: 14,
        color: C.ouro,
        cursor: "pointer",
        letterSpacing: "0.06em",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
function Cab({ titulo, voltar, acao }) {
  return (
    <div
      style={{
        background: C.obs,
        padding: "12px 18px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${C.ouro}15`,
      }}
    >
      {voltar ? (
        <button
          onClick={voltar}
          style={{
            background: "none",
            border: "none",
            color: C.lt,
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 13,
            cursor: "pointer",
            width: 60,
          }}
        >
          ← Voltar
        </button>
      ) : (
        <div style={{ width: 60 }} />
      )}
      <div
        style={{
          fontFamily: FS,
          fontSize: 17,
          fontWeight: 300,
          letterSpacing: "0.12em",
          color: C.linho,
          textAlign: "center",
        }}
      >
        {titulo}
      </div>
      <div style={{ width: 60, display: "flex", justifyContent: "flex-end" }}>
        {acao || null}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0];

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const loadedRef = useRef(false);
  const [lgpdOk, setLgpdOk] = useState(() => {
    try {
      return localStorage.getItem("auge_lgpd") === "true";
    } catch {
      return false;
    }
  });
  const [diagOk, setDiagOk] = useState(false);
  // Helper: marcar diagOk persistindo também por userId para cross-device sem depender de Supabase
  const markDiagOk = (userId) => {
    setDiagOk(true);
    if (userId) {
      try { localStorage.setItem("auge_diagOk_" + userId, "1"); } catch {}
    }
  };
  const checkDiagOkLocal = (userId) => {
    try { return localStorage.getItem("auge_diagOk_" + userId) === "1"; } catch { return false; }
  };
  const [tela, setTela] = useState(S.HOME);

  // Feed
  const [feed, setFeed] = useState(FEED0);

  // Checkin / Hábitos — chave diária: reseta automaticamente no dia seguinte
  const [habF, setHabF] = useLocalStorage(`auge_habF_${TODAY}`, {});
  const [chips, setChips] = useLocalStorage(`auge_chips_${TODAY}`, []);
  const [ckOk, setCkOk] = useLocalStorage(`auge_ckOk_${TODAY}`, false);
  const [notas, setNotas] = useLocalStorage(`auge_notas_${TODAY}`, "");

  // Roda AUGE
  const [rodaR, setRodaR] = useState({});
  const [rodaI, setRodaI] = useState(0);
  const [rodaResultados, setRodaResultados] = useState([]); // resultados salvos no Supabase

  // Conexões
  const [matches, setMatches] = useState([]);
  const [ci, setCi] = useState(0);
  const [sw, setSw] = useState(null);
  const [selM, setSelM] = useState(null);

  // Jornada — persistidos entre sessões
  const [anc, setAnc] = useLocalStorage(
    "auge_anc",
    "Eu sou a mulher que volta.",
  );
  const [kitMin, setKitMin] = useLocalStorage("auge_kitMin", "");
  const [kitApoio, setKitApoio] = useLocalStorage("auge_kitApoio", "");
  const [escT, setEscT] = useState("vitorias");
  const [vit, setVit] = useLocalStorage("auge_vit", []);
  const [historico, setHist] = useLocalStorage("auge_historico", {});
  // Hábitos angulares personalizados — persistidos entre sessões
  const [habAngulares, setHabAngulares] = useLocalStorage(
    "auge_habAngulares",
    [],
  );
  // Data de cadastro para cálculo S6/S12 da Roda
  const [dataCadastro, setDataCadastro] = useState(null);
  const [retomadas, setRet] = useLocalStorage("auge_retomadas", 0);
  const [carta, setCarta] = useLocalStorage("auge_carta", null);
  const [pq1, setPq1] = useState("");
  const [pq2, setPq2] = useState("");
  const [pq3, setPq3] = useState("");
  const [notifStatus, setNotifStatus] = useLocalStorage(
    "auge_notif",
    "pending",
  ); // "pending"|"granted"|"denied"|"dismissed"

  const [toast, setToast] = useState(null);
  const [mentoria, setMentoria] = useState({
    data: "A definir",
    semana: "",
    duracao: "75 min",
    zoom: "",
  });
  const [videos, setVideos] = useState([]);
  const postando = useRef(false);

  // Dados de onboarding — nome e e-mail persistidos entre sessões
  const [usuario, setUsuario] = useLocalStorage("auge_usuario", null);

  const sem = dataCadastro
    ? Math.min(
        12,
        Math.max(
          1,
          Math.ceil(
            (Date.now() - dataCadastro.getTime()) / (7 * 24 * 60 * 60 * 1000),
          ),
        ),
      )
    : 1;
  const mes = sem <= 4 ? 1 : sem <= 8 ? 2 : 3;
  const hDia = habAngulares.length > 0 ? habAngulares : HAB[mes];
  const feitos = hDia.filter((h) => habF[h.id]).length;

  const salvarHabitos = async (habs) => {
    setHabAngulares(habs);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const uid = session.user.id;
    supabase.from("habitos_angulares").upsert({
      user_id: uid,
      hab1: habs[0]?.t || null,
      hab2: habs[1]?.t || null,
      hab3: habs[2]?.t || null,
    }, { onConflict: "user_id" }).then(() => {});
    supabase.from("profiles").upsert({
      id: uid,
      habito_1: habs[0]?.t || null,
      habito_2: habs[1]?.t || null,
      habito_3: habs[2]?.t || null,
    }, { onConflict: "id" }).then(() => {});
  };

  const ir = (t) => setTela(t);
  const tk = (m) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };
  const back = () => ir(ABA_ORIGEM[tela] || S.HOME);

  // ── Carrega todos os dados da aluna do Supabase após autenticação ────────────
  const loadUserData = async (userId) => {
    try {
    // Supabase é a fonte de verdade — resetar estado local antes de popular
    setHist({});
    setVit([]);
    setCarta(null);
    setAnc("Eu sou a mulher que volta.");
    setKitMin("");
    setKitApoio("");
    setHabAngulares([]);
    setPq1("");
    setPq2("");
    setPq3("");

    const [
      profileRes,
      checkinsRes,
      kitRes,
      ancRes,
      vitRes,
      cartaRes,
      porquesRes,
      diagRes,
      habsAngRes,
      rodaRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("checkins").select("*").eq("user_id", userId),
      supabase
        .from("kit_emergencia")
        .select("*")
        .eq("user_id", userId)
        .single(),
      supabase.from("ancora").select("*").eq("user_id", userId).single(),
      supabase.from("vitorias").select("*").eq("user_id", userId),
      supabase.from("carta_futuro").select("*").eq("user_id", userId).single(),
      supabase.from("porques").select("*").eq("user_id", userId).single(),
      supabase.from("diagnostico").select("user_id").eq("user_id", userId).single(),
      supabase.from("habitos_angulares").select("*").eq("user_id", userId).single(),
      supabase.from("roda_auge").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    // habitos_angulares tem prioridade sobre profiles.habito_1/2/3
    if (habsAngRes?.data) {
      const ha = habsAngRes.data;
      const habs = [ha.hab1, ha.hab2, ha.hab3]
        .filter(Boolean)
        .map((t, i) => ({ id: `ha${i + 1}`, t }));
      if (habs.length) setHabAngulares(habs);
    }

    if (rodaRes?.data?.length) {
      setRodaResultados(rodaRes.data);
    }

    // diagOk: determinar ANTES de setar profileLoaded para evitar flash de diagnóstico
    const diagDone = !!(diagRes.data) || checkDiagOkLocal(userId);

    if (profileRes.data) {
      const p = profileRes.data;
      setPerfil(p.plano || "jornada");
      setUsuario({ nome: p.nome || "", email: p.email || "" });
      setLgpdOk(!!p.lgpd_aceito);
      if (p.data_cadastro) setDataCadastro(new Date(p.data_cadastro));
      // Carregar hábitos angulares de profiles.habito_1/2/3 (fallback)
      const habsP = [p.habito_1, p.habito_2, p.habito_3]
        .filter(Boolean)
        .map((t, i) => ({ id: `ha${i + 1}`, t }));
      if (habsP.length) setHabAngulares(habsP);
      if (p.avatar_url) {
        try {
          localStorage.setItem("auge_foto", p.avatar_url);
        } catch {}
      }
      if (p.radar_cidade) {
        try { localStorage.setItem("auge_pref_cidade", p.radar_cidade); } catch {}
      }
      if (p.radar_interesses?.length) {
        try {
          localStorage.setItem("auge_pref_sels", JSON.stringify(p.radar_interesses));
          localStorage.setItem("auge_pref_salvo", "1");
        } catch {}
      }
      // Marcar diagOk ANTES de setProfileLoaded — garante que o effect vê diagOk=true
      if (diagDone) markDiagOk(userId);
      setProfileLoaded(true);
      loadedRef.current = true;
      // Cache local do perfil para evitar tela errada se Supabase falhar
      try {
        localStorage.setItem("auge_perfil_plano", p.plano || "jornada");
        if (p.data_cadastro) localStorage.setItem("auge_perfil_datacad", p.data_cadastro);
      } catch {}
    } else {
      // Tentar recuperar do cache local
      const cachedPlano = (() => { try { return localStorage.getItem("auge_perfil_plano"); } catch { return null; } })();
      const cachedDataCad = (() => { try { return localStorage.getItem("auge_perfil_datacad"); } catch { return null; } })();
      if (cachedPlano) {
        setPerfil(cachedPlano);
        if (cachedDataCad) setDataCadastro(new Date(cachedDataCad));
      } else {
        setPerfil("jornada");
      }
      if (diagDone) markDiagOk(userId);
      setProfileLoaded(true);
      loadedRef.current = true;
      // Perfil não existe ainda — usar metadata do auth como fallback
      const { data: { session: _s } } = await supabase.auth.getSession();
      if (_s?.user) {
        setUsuario({
          nome: _s.user.user_metadata?.nome || "",
          email: _s.user.email || "",
        });
      }
    }

    if (checkinsRes.data?.length) {
      const hist = {};
      for (const c of checkinsRes.data) {
        hist[c.data] = {
          feitos: c.total_feitos,
          total: c.total,
          retomada: c.retomada,
        };
      }
      setHist(hist);
      // Sincronizar ckOk com o checkin de hoje vindo do Supabase
      const hoje = new Date().toISOString().split("T")[0];
      if (hist[hoje] && (hist[hoje].feitos > 0 || hist[hoje].retomada)) {
        setCkOk(true);
      }
    }

    if (kitRes.data && !kitRes.error) {
      setKitMin(kitRes.data.min_viavel || "");
      setKitApoio(kitRes.data.onde_apoio || "");
    }

    if (ancRes.data && !ancRes.error && ancRes.data.texto) {
      setAnc(ancRes.data.texto);
    }

    if (vitRes.data?.length) {
      setVit(
        vitRes.data.map((v) => ({ sem: v.sem, texto: v.texto, data: v.data })),
      );
    }

    if (cartaRes.data && !cartaRes.error && cartaRes.data.texto) {
      const d = new Date(cartaRes.data.data_escrita);
      const ds = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
      setCarta({ texto: cartaRes.data.texto, data: ds });
    }

    if (porquesRes.data && !porquesRes.error) {
      setPq1(porquesRes.data.p1 || "");
      setPq2(porquesRes.data.p2 || "");
      setPq3(porquesRes.data.p3 || "");
    }

    // Carregar posts públicos + posts privados da própria aluna
    const [feedPublicoRes, feedPrivadoRes, configRes] = await Promise.all([
      supabase
        .from("feed")
        .select("id, autor_nome, autor_ini, autor_cor, titulo, descricao, img_url, publica, curtidas, comentarios, created_at, user_id")
        .eq("publica", true)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("feed")
        .select("id, autor_nome, autor_ini, autor_cor, titulo, descricao, img_url, publica, curtidas, comentarios, created_at, user_id")
        .eq("user_id", userId)
        .eq("publica", false)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("config").select("*"),
    ]);

    const mapPost = (p) => ({
      id: p.id,
      aut: p.autor_nome,
      ini: p.autor_ini,
      cor: p.autor_cor,
      fundo: "#1E252E",
      tit: p.titulo,
      desc: p.descricao,
      imgSrc: p.img_url || null,
      tempo: formatTempo(p.created_at),
      publica: p.publica,
      cur: p.curtidas || [],
      com: p.comentarios || [],
      dbId: p.id,
      userId: p.user_id,
    });

    const postsPublicos = feedPublicoRes.data?.map(mapPost) || [];
    const postsPrivados = feedPrivadoRes.data?.map(mapPost) || [];
    const todosIds = new Set(postsPublicos.map((p) => p.id));
    const privadosUnicos = postsPrivados.filter((p) => !todosIds.has(p.id));
    const postsReais = [...postsPublicos, ...privadosUnicos].sort(
      (a, b) => new Date(b.tempo) - new Date(a.tempo)
    );

    setFeed(postsReais.length > 0 ? [...postsReais, ...FEED0] : [...FEED0]);

    // Carregar configurações (mentoria)
    if (configRes.data?.length) {
      const cfg = Object.fromEntries(configRes.data.map((c) => [c.id, c.valor]));
      setMentoria({
        data: cfg.mentoria_data || "A definir",
        semana: cfg.mentoria_semana || "",
        duracao: cfg.mentoria_duracao || "75 min",
        zoom: cfg.mentoria_zoom || "",
      });
    }

    // Carregar vídeos do Supabase
    const videosRes = await supabase
      .from("videos")
      .select("*")
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false });

    if (videosRes.data?.length) {
      setVideos(videosRes.data);
    }
    } catch (e) {
      console.error("loadUserData error:", e);
    }
  };

  const formatTempo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min}min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;
    const d = Math.floor(h / 24);
    return `há ${d}d`;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setPerfil(null);
    setUsuario(null);
    setLgpdOk(false);
    setHist({});
    setVit([]);
    setCarta(null);
    setAnc("Eu sou a mulher que volta.");
    setKitMin("");
    setKitApoio("");
    setHabAngulares([]);
    setPq1("");
    setPq2("");
    setPq3("");
    setTela(S.HOME);
  };

  const doSwipe = (dir) => {
    const p = PERFIS_CX[ci];
    setSw(dir);
    setTimeout(() => {
      setSw(null);
      if (dir === "right") {
        setMatches((m) => [...m, { ...p, msgs: [] }]);
        tk(`Conexão com ${p.nome.split(" ")[0]}! 💛`);
      }
      setCi((i) => i + 1);
    }, 380);
  };

  const postTreino = async (entry) => {
    if (postando.current) return;
    postando.current = true;
    try {
    const ini = usuario?.nome
      ? usuario.nome.trim().split(/\s+/).slice(0, 2).map((n) => n[0].toUpperCase()).join("")
      : "?";
    let imgUrl = null;

    // Upload da imagem se post público e tem foto
    if (entry.publica !== false && entry.imgSrc && entry.imgFile) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const f = entry.imgFile;
        const ext = f.name.split(".").pop();
        const path = `${session.user.id}/${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage
          .from("posts")
          .upload(path, f, { contentType: f.type });
        if (!error) {
          const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
          imgUrl = urlData?.publicUrl || null;
        }
      }
    }

    const novoPost = {
      id: Date.now(),
      aut: usuario?.nome || "Você",
      ini,
      cor: C.ouroDk,
      fundo: "#1E252E",
      ...entry,
      imgSrc: imgUrl || entry.imgSrc,
      tempo: "agora",
      cur: [],
      com: [],
      userId: authUser?.id || null,
    };
    setFeed((f) => [novoPost, ...f]);

    // Salva no Supabase (público ou privado)
    {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: inserted, error: insErr } = await supabase.from("feed").insert({
          user_id: session.user.id,
          autor_nome: usuario?.nome || "Aluna",
          autor_ini: ini,
          autor_cor: C.ouroDk,
          titulo: entry.tit || "",
          descricao: entry.desc || "",
          publica: entry.publica !== false,
          img_url: imgUrl,
        }).select("id").single();
        if (!insErr && inserted) {
          // Atualiza post local com dbId real — evita duplicata no próximo fetch
          setFeed((f) => f.map((p) =>
            p.id === novoPost.id ? { ...p, dbId: inserted.id } : p
          ));
        }
      }
    }
    ir(S.FEED);
    } finally {
      postando.current = false;
    }
  };

  const calcRoda = () =>
    Object.fromEntries(
      DIMS.map((d) => {
        const ps = RODA_Q.filter((p) => p.dim === d);
        const vs = ps
          .map((p) => rodaR[p.id])
          .filter((v) => v !== null && v !== undefined);
        return [
          d,
          vs.length
            ? +(vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(1)
            : null,
        ];
      }),
    );
  const zc = (n) =>
    n === null ? C.lt : n < 4 ? C.atencao : n < 7 ? C.dev : C.augeZ;
  const zl = (n) =>
    n === null ? "—" : n < 4 ? "Atenção" : n < 7 ? "Desenvolvimento" : "Auge";

  // Pontos e medalhas
  const pontos = Object.values(historico).reduce(
    (t, d) =>
      t +
      d.feitos * 5 +
      (d.feitos === d.total && d.total > 0 ? 5 : 0) +
      (d.retomada ? 15 : 0),
    0,
  );
  const diasC = Object.values(historico).filter(
    (d) => d.feitos > 0 || d.retomada,
  ).length;
  const vals = Object.values(historico);
  let seq = 0,
    maxSeq = 0;
  vals.forEach((d) => {
    if (d.feitos > 0 || d.retomada) {
      seq++;
      maxSeq = Math.max(maxSeq, seq);
    } else seq = 0;
  });

  // Streak atual (dias consecutivos até hoje) e dias sem treino
  const _sortedKeys = Object.keys(historico).sort();
  const _ativo = (k) => historico[k]?.feitos > 0 || historico[k]?.retomada;
  let streakAtual = 0;
  {
    const d = new Date(TODAY);
    if (_ativo(TODAY)) {
      streakAtual = 1;
      d.setDate(d.getDate() - 1);
    } else d.setDate(d.getDate() - 1);
    while (true) {
      const k = d.toISOString().split("T")[0];
      if (!_ativo(k)) break;
      streakAtual++;
      d.setDate(d.getDate() - 1);
    }
  }
  let diasSemTreino = 0;
  {
    const d = new Date(TODAY);
    if (!_ativo(TODAY)) {
      if (!_sortedKeys.some(_ativo)) {
        diasSemTreino = -1; // nunca treinou — exibir mensagem de boas-vindas
      } else {
        d.setDate(d.getDate() - 1);
        while (true) {
          const k = d.toISOString().split("T")[0];
          if (_ativo(k) || diasSemTreino > 60) break;
          diasSemTreino++;
          d.setDate(d.getDate() - 1);
        }
      }
    }
  }
  const medC = [
    ...(maxSeq >= 3 ? ["momentum"] : []),
    ...(retomadas >= 3 ? ["retomada"] : []),
    ...(diasC >= 21 ? ["protagonista"] : []),
  ];

  // ── Deep link: abre tela/aba via ?open= (vem das notificações)
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("open");
    if (!param) return;
    // Limpa o param da URL sem recarregar
    const clean = window.location.pathname;
    window.history.replaceState({}, "", clean);
    if (param === "retomada") {
      ir(S.RET);
    }
    if (param === "escritas-vitorias") {
      setEscT("vitorias");
      ir(S.ESC);
    }
    if (param === "home") {
      ir(S.HOME);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reagenda notificações sempre que diasSemTreino muda (ou permissão é concedida)
  useEffect(() => {
    if (perfil === "jornada" && notifStatus === "granted") {
      scheduleAll(diasSemTreino < 0 ? 0 : diasSemTreino);
    }
    if (notifStatus !== "granted") {
      clearAll();
    }
  }, [diasSemTreino, notifStatus, perfil]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sessão Supabase: verifica sessão existente e escuta mudanças ──────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        loadUserData(session.user.id).finally(() => setLoadingAuth(false));
      } else {
        setLoadingAuth(false);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setAuthUser(session.user);
        loadUserData(session.user.id);
      }
      else if (event === "SIGNED_OUT") {
        setAuthUser(null);
        setPerfil(null);
        setProfileLoaded(false);
        setUsuario(null);
        try { localStorage.removeItem("auge_perfil_plano"); localStorage.removeItem("auge_perfil_datacad"); } catch {}
      }
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Onboarding obrigatório: Diagnóstico → Setup de hábitos ────────────────
  useEffect(() => {
    // Só dispara depois de loadUserData completar (loadedRef garante que diagOk já foi setado)
    if (!loadedRef.current) return;
    if (!authUser) return;
    if (perfil !== "jornada") return; // admin, pendente, comunidade nunca veem o diagnóstico
    if (diagOk) return;
    setTela(S.DIAG);
  }, [perfil, diagOk, authUser, profileLoaded]);

  const ctx = {
    perfil,
    ir,
    back,
    tk,
    feed,
    setFeed,
    habF,
    setHabF,
    chips,
    setChips,
    ckOk,
    setCkOk,
    notas,
    setNotas,
    rodaR,
    setRodaR,
    rodaI,
    setRodaI,
    rodaResultados,
    matches,
    setMatches,
    ci,
    sw,
    doSwipe,
    selM,
    setSelM,
    anc,
    setAnc,
    kitMin,
    setKitMin,
    kitApoio,
    setKitApoio,
    escT,
    setEscT,
    vit,
    setVit,
    historico,
    setHist,
    retomadas,
    setRet,
    sem,
    mes,
    hDia,
    feitos,
    postTreino,
    calcRoda,
    zc,
    zl,
    pontos,
    medC,
    habAngulares,
    setHabAngulares,
    dataCadastro,
    usuario,
    setUsuario,
    streakAtual,
    diasSemTreino,
    carta,
    setCarta,
    notifStatus,
    setNotifStatus,
    pq1,
    setPq1,
    pq2,
    setPq2,
    pq3,
    setPq3,
    authUserId: authUser?.id,
    logout,
    mentoria,
    videos,
    recarregarPerfil: () => loadUserData(authUser?.id),
  };

  const SEM_NAV = [S.SPLASH, S.LEGAL, S.LOGIN, S.DIAG, S.HABSETUP, S.ADMIN, S.VOZ, S.CHAT, S.RODA];

  // Aguardando verificação de sessão Supabase
  if (loadingAuth)
    return (
      <Phone>
        <Grain
          style={{
            minHeight: 760,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <Logo width={140} fundo="escuro" />
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 13,
              color: `rgba(255,255,255,.82)`,
              animation: "pulse 1.5s ease-in-out infinite",
              letterSpacing: "0.2em",
            }}
          >
            carregando...
          </div>
        </Grain>
        <Estilos />
      </Phone>
    );

  // Não autenticada → tela de login / cadastro
  if (!authUser)
    return (
      <Phone>
        <Rolar>
          <TelaAuth
            onAuth={async (user) => {
              setAuthUser(user);
              await loadUserData(user.id);
            }}
          />
        </Rolar>
        <Estilos />
      </Phone>
    );

  // Diagnóstico de Sabotadores (primeiro acesso Jornada)
  if (tela === S.DIAG)
    return (
      <Phone>
        <Rolar>
          <Diagnostico
            onConcluir={(respostas) => {
              supabase.auth.getSession().then(({ data: { session } }) => {
                markDiagOk(session?.user?.id);
                if (!session?.user) return;
                supabase.from("diagnostico").upsert({
                  user_id: session.user.id,
                  p1: respostas[1] || null,
                  p2: respostas[2] || null,
                  p3: respostas[3] || null,
                  p4: respostas[4] || null,
                  p5: respostas[5] || null,
                  p6: respostas[6] || null,
                  p7: respostas[7] || null,
                  p8: respostas[8] || null,
                  p9: respostas[9] || null,
                  p10: respostas[10] || null,
                }, { onConflict: "user_id" }).then(() => {});
              });
              // Após diagnóstico → setup de hábitos se ainda não definidos
              if (habAngulares.length === 0) ir(S.HABSETUP);
              else ir(S.HOME);
            }}
          />
        </Rolar>
        <Estilos />
      </Phone>
    );

  // Setup de hábitos (após diagnóstico, primeiro acesso)
  if (tela === S.HABSETUP)
    return (
      <Phone>
        <Rolar>
          <Grain style={{ minHeight: 760, padding: "40px 26px 48px", animation: "fadeUp .4s ease" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 32 }}>
              <Logo width={120} fundo="escuro" />
              <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 9, color: C.ouro, letterSpacing: "0.4em", textTransform: "uppercase" }}>
                Primeiro acesso
              </div>
            </div>
            <DefinirHabitos
              onSalvar={(habs) => {
                setHabAngulares(habs);
                salvarHabitos(habs);
                ir(S.HOME);
              }}
            />
          </Grain>
        </Rolar>
        <Estilos />
      </Phone>
    );

  const renderTela = () => {
    switch (tela) {
      case S.LOGIN:
        return <Home {...ctx} />;
      case S.HOME:
        return <Home {...ctx} />;
      case S.FEED:
        return <Feed {...ctx} />;
      case S.NOVO:
        return <Novo {...ctx} />;
      case S.VOZ:
        return <Voz {...ctx} />;
      case S.CX:
        return <Cx {...ctx} />;
      case S.MATCH:
        return selM ? <MatchDet {...ctx} /> : <Cx {...ctx} />;
      case S.CHAT:
        return selM ? <Chat {...ctx} /> : <Cx {...ctx} />;
      case S.JOR:
        return <Jornada {...ctx} />;
      case S.RODA:
        return <Roda {...ctx} />;
      case S.RET:
        return <Retomada {...ctx} />;
      case S.CAL:
        return <Calendario {...ctx} />;
      case S.ESC:
        return <Escritas {...ctx} />;
      case S.EM:
        return <Emergencia {...ctx} />;
      case S.CT:
        return <Conteudo {...ctx} />;
      case S.PF:
        return (
          <Perfil
            {...ctx}
            habAngulares={habAngulares}
            setHabAngulares={setHabAngulares}
          />
        );
      case S.ADMIN:
        return <PainelMentora ir={ir} />;
      default:
        return <Home {...ctx} />;
    }
  };

  return (
    <Phone>
      {toast && <Brinde msg={toast} />}
      <Rolar>{renderTela()}</Rolar>
      {!SEM_NAV.includes(tela) && (
        <NavBar
          tela={tela}
          ir={ir}
          mc={matches.length}
          perfil={perfil}
          ckOk={ckOk}
        />
      )}
      <Estilos />
    </Phone>
  );
}

function Estilos() {
  return (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{display:none;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    @keyframes swR{to{transform:translateX(130%) rotate(15deg);opacity:0}}
    @keyframes swL{to{transform:translateX(-130%) rotate(-15deg);opacity:0}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes wave{0%,100%{height:5px}50%{height:26px}}
    input:focus,textarea:focus{outline:none;}
    input{caret-color:#C4A882;}
    textarea{caret-color:#C4A882;}
    button:active{opacity:.75;}
  `}</style>
  );
}

// ─── NAV BAR ──────────────────────────────────────────────────────────────────
function NavBar({ tela, ir, mc, perfil, ckOk }) {
  const aba = ABA_ORIGEM[tela] || S.HOME;
  const tabs = [
    { id: S.HOME, label: "Início", icon: Ico.home },
    { id: S.FEED, label: "Mural", icon: Ico.feed, badge: !ckOk ? 1 : 0 },
    { id: S.JOR, label: "Jornada", icon: Ico.jor },
    { id: S.CT, label: "Conteúdo", icon: Ico.ct },
    { id: S.PF, label: "Perfil", icon: Ico.pf },
  ];
  // Nota: Jornada aparece para todos — Comunidade vê vitrine, Jornada vê conteúdo
  return (
    <div
      style={{
        background: C.obs,
        borderTop: `1px solid ${C.ouro}15`,
        display: "flex",
        padding: "10px 0 16px",
      }}
    >
      {tabs.map((t) => (
        <div
          key={t.id}
          onClick={() => ir(t.id)}
          style={{
            flex: 1,
            textAlign: "center",
            cursor: "pointer",
            position: "relative",
          }}
        >
          {t.badge > 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: "22%",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: C.terra,
                border: `1.5px solid ${C.obs}`,
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            {t.icon(aba === t.id ? C.ouro : C.lt)}
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 10,
                color: aba === t.id ? C.ouro : C.lt,
                transition: "color .2s",
              }}
            >
              {t.label}
            </div>
          </div>
          {aba === t.id && (
            <div
              style={{
                width: 18,
                height: 1.5,
                background: C.ouro,
                margin: "3px auto 0",
                borderRadius: 100,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────
function Splash({ ir }) {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    w: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 1,
    op: 0.08 + ((i * 37) % 100) / 400,
    l: ((i * 67 + 13) % 90) + 5,
    t: ((i * 43 + 7) % 90) + 5,
  }));
  return (
    <Grain
      style={{
        minHeight: 760,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "0 32px 52px",
      }}
    >
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: s.w,
            height: s.w,
            borderRadius: "50%",
            background: C.ouro,
            opacity: s.op,
            left: `${s.l}%`,
            top: `${s.t}%`,
            boxShadow: i % 5 === 0 ? `0 0 3px ${C.ouro}66` : undefined,
          }}
        />
      ))}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          paddingTop: 60,
        }}
      >
        <Logo width={240} fundo="escuro" />
        <div
          style={{
            width: 1,
            height: 36,
            background: C.ouro,
            opacity: 0.25,
            marginTop: 8,
          }}
        />
        <div
          style={{
            fontFamily: FS,
            fontStyle: "italic",
            fontSize: 16,
            fontWeight: 300,
            color: `${C.linho}66`,
            lineHeight: 1.6,
            textAlign: "center",
            maxWidth: 240,
            marginTop: 4,
          }}
        >
          "O auge não é o que você foi. É o que você está construindo."
        </div>
      </div>
      <BtnPill onClick={ir}>Entrar no app</BtnPill>
    </Grain>
  );
}

// ─── AVISO LEGAL ──────────────────────────────────────────────────────────────
function AvisoLegal({ onAceitar }) {
  const [rolado, setRolado] = useState(false);
  const [aceito, setAceito] = useState(false);
  return (
    <Grain
      style={{
        minHeight: 760,
        display: "flex",
        flexDirection: "column",
        padding: "40px 26px 48px",
        animation: "fadeUp .4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <Logo width={140} fundo="escuro" />
      </div>
      <div
        style={{
          fontFamily: FB,
          fontWeight: 300,
          fontSize: 11,
          color: C.ouro,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Aviso Legal e Termos
      </div>
      <div
        onScroll={(e) => {
          const el = e.target;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10)
            setRolado(true);
        }}
        style={{
          flex: 1,
          overflowY: "auto",
          background: "rgba(255,255,255,.04)",
          border: `1px solid ${C.ouro}18`,
          borderRadius: 12,
          padding: "18px",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 13,
            color: `rgba(255,255,255,.82)`,
            lineHeight: 1.8,
          }}
        >
          <p style={{ marginBottom: 12 }}>
            Este aplicativo é um{" "}
            <b style={{ color: `rgba(255,255,255,.88)` }}>
              programa de desenvolvimento de hábitos e estilo de vida
            </b>
            . Não substitui consulta médica, acompanhamento clínico individual,
            avaliação de exames ou prescrição de medicamentos de qualquer
            natureza.
          </p>
          <p style={{ marginBottom: 12 }}>
            A formação médica da facilitadora, Dra. Isadora Zaniboni, informa a
            profundidade do conteúdo — não caracteriza ato médico. A tríade
            diagnóstica (anamnese, exame físico e conduta clínica) não está
            presente neste programa.
          </p>
          <p style={{ marginBottom: 12 }}>
            Se você possui condições de saúde que requerem acompanhamento
            médico, a participação é complementar ao seu tratamento — nunca
            substituta.
          </p>
          <p style={{ marginBottom: 12 }}>
            Seus dados de hábitos, monitoramento emocional e respostas da Roda
            AUGE são tratados como dados pessoais sensíveis, armazenados com
            segurança e nunca compartilhados com terceiros, conforme a LGPD (Lei
            13.709/2018).
          </p>
          <p>
            Você pode solicitar a exclusão definitiva de todos os seus dados a
            qualquer momento através do suporte.
          </p>
        </div>
      </div>
      <div
        onClick={() => setAceito((a) => !a)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `1.5px solid ${aceito ? C.ouro : C.ouro + "44"}`,
            background: aceito ? `${C.ouro}22` : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {aceito && <span style={{ color: C.ouro, fontSize: 14 }}>✓</span>}
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 13,
            color: `rgba(255,255,255,.45)`,
            lineHeight: 1.5,
          }}
        >
          Li e aceito os termos acima
        </div>
      </div>
      <BtnPill
        onClick={() => aceito && onAceitar()}
        style={{ opacity: aceito ? 1 : 0.4 }}
      >
        Continuar
      </BtnPill>
      {!rolado && (
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: `rgba(255,255,255,.45)`,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Role para baixo para ler os termos
        </div>
      )}
    </Grain>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({ onConcluir }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const ok = nome.trim().length >= 2 && emailOk;
  const salvar = () => {
    if (!ok) return;
    onConcluir({ nome: nome.trim(), email: email.trim().toLowerCase() });
  };
  return (
    <Grain
      style={{
        minHeight: 760,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px 56px",
        animation: "fadeUp .4s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <Logo width={300} fundo="escuro" />
      </div>
      <div
        style={{
          fontFamily: FS,
          fontSize: 24,
          fontWeight: 300,
          color: C.linho,
          marginTop: 24,
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        Bem-vinda
      </div>
      <div
        style={{
          fontFamily: FB,
          fontWeight: 300,
          fontSize: 13,
          color: `rgba(255,255,255,.92)`,
          marginBottom: 40,
          textAlign: "center",
          lineHeight: 1.65,
        }}
      >
        Para começar, me diz seu nome e e-mail.
      </div>

      <div style={{ width: "100%", marginBottom: 28 }}>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: `rgba(255,255,255,.45)`,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Nome
        </div>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como você se chama?"
          onKeyDown={(e) =>
            e.key === "Enter" && document.getElementById("ob-email")?.focus()
          }
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${nome.trim().length >= 2 ? C.ouro + "66" : "rgba(255,255,255,.45)"}`,
            color: C.branco,
            fontFamily: FS,
            fontSize: 17,
            fontWeight: 300,
            padding: "8px 0",
          }}
        />
      </div>

      <div style={{ width: "100%", marginBottom: 40 }}>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: `rgba(255,255,255,.45)`,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          E-mail
        </div>
        <input
          id="ob-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          onKeyDown={(e) => e.key === "Enter" && salvar()}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${emailOk ? C.ouro + "66" : "rgba(255,255,255,.45)"}`,
            color: C.branco,
            fontFamily: FS,
            fontSize: 17,
            fontWeight: 300,
            padding: "8px 0",
          }}
        />
      </div>

      <BtnPill onClick={salvar} style={{ opacity: ok ? 1 : 0.4 }}>
        Começar minha jornada
      </BtnPill>

      <div
        style={{
          fontFamily: FB,
          fontWeight: 300,
          fontSize: 11,
          color: `rgba(255,255,255,.18)`,
          marginTop: 20,
          textAlign: "center",
          lineHeight: 1.7,
        }}
      >
        Seus dados ficam guardados apenas neste dispositivo.
      </div>
    </Grain>
  );
}

// ─── MODAL TERMOS DE USO ──────────────────────────────────────────────────────
const TEXTO_TERMOS = `Este aplicativo é um programa de desenvolvimento de hábitos e estilo de vida. Não substitui consulta médica, acompanhamento clínico individual, avaliação de exames ou prescrição de medicamentos de qualquer natureza. A formação médica da facilitadora, Dra. Isadora Zaniboni, informa a profundidade do conteúdo — não caracteriza ato médico. A tríade diagnóstica (anamnese, exame físico e conduta clínica) não está presente neste programa. Se você possui condições de saúde que requerem acompanhamento médico, a participação é complementar ao seu tratamento — nunca substituta. Seus dados de hábitos, monitoramento emocional e respostas da Roda AUGE são tratados como dados pessoais sensíveis, armazenados com segurança e nunca compartilhados com terceiros, conforme a LGPD (Lei 13.709/2018). Você pode solicitar a exclusão definitiva de todos os seus dados a qualquer momento através do suporte.`;

function ModalTermos({ onAceitar, onFechar }) {
  const [chegouAoFim, setChegouAoFim] = useState(false);
  const [marcou, setMarcou] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const restante = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (restante < 24) setChegouAoFim(true);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,.72)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#18141C",
          borderRadius: "20px 20px 0 0",
          border: `1px solid ${C.ouro}20`,
          paddingBottom: "env(safe-area-inset-bottom)",
          animation: "fadeUp .3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${C.ouro}12`,
          }}
        >
          <div
            style={{
              fontFamily: FS,
              fontSize: 17,
              fontWeight: 300,
              letterSpacing: "0.08em",
              color: C.linho,
            }}
          >
            Termos de Uso
          </div>
          <button
            onClick={onFechar}
            style={{
              background: "none",
              border: "none",
              color: `rgba(255,255,255,.88)`,
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            overflowY: "auto",
            maxHeight: 260,
            padding: "18px 20px",
            lineHeight: 1.8,
          }}
        >
          <p
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 13,
              color: `rgba(255,255,255,.82)`,
              margin: 0,
            }}
          >
            {TEXTO_TERMOS}
          </p>
          <div style={{ height: 40 }} />
        </div>
        {!chegouAoFim && (
          <div style={{ textAlign: "center", paddingBottom: 6 }}>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 10,
                color: `rgba(255,255,255,.28)`,
                letterSpacing: "0.15em",
              }}
            >
              role para baixo para continuar ↓
            </div>
          </div>
        )}
        <div
          style={{
            padding: "12px 20px 20px",
            borderTop: `1px solid ${C.ouro}10`,
          }}
        >
          <div
            onClick={() => chegouAoFim && setMarcou((v) => !v)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: 16,
              cursor: chegouAoFim ? "pointer" : "default",
              opacity: chegouAoFim ? 1 : 0.45,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: `1.5px solid ${marcou ? C.ouro : "rgba(255,255,255,.88)"}`,
                background: marcou ? `${C.ouro}22` : "transparent",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              {marcou && <span style={{ color: C.ouro, fontSize: 11 }}>✓</span>}
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 12,
                color: `rgba(255,255,255,.82)`,
                lineHeight: 1.5,
              }}
            >
              Li e aceito os termos de uso e a política de privacidade
            </div>
          </div>
          <BtnPill
            onClick={() => marcou && onAceitar()}
            style={{ opacity: marcou ? 1 : 0.35, fontSize: 13 }}
          >
            Confirmar e continuar
          </BtnPill>
        </div>
      </div>
    </div>
  );
}

function TelaAuth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lgpd, setLgpd] = useState(false);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [showTermos, setShowTermos] = useState(false);
  const [leuTermos, setLeuTermos] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

  const mapErro = (msg) => {
    if (!msg) return null;
    if (msg.includes("Invalid login credentials"))
      return "E-mail ou senha incorretos. Tente novamente.";
    if (
      msg.includes("already registered") ||
      msg.includes("already been registered")
    )
      return "Já existe uma conta com este e-mail. Faça login.";
    if (msg.includes("Password should be at least"))
      return "A senha deve ter pelo menos 6 caracteres.";
    if (msg.includes("Email not confirmed"))
      return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
    return "Ocorreu um erro. Tente novamente.";
  };

  const handleLogin = async () => {
    if (!email.trim() || !senha) return;
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    setLoading(false);
    if (error) {
      setErro(mapErro(error.message));
      return;
    }
    onAuth(data.user);
  };

  const handleCadastro = async () => {
    if (!nome.trim() || !email.trim() || senha.length < 6 || !lgpd) return;
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha,
      options: { data: { nome: nome.trim() } },
    });
    setLoading(false);
    if (error) {
      setErro(mapErro(error.message));
      return;
    }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        plano: "jornada",
        lgpd_aceito: true,
        lgpd_data: new Date().toISOString(),
        data_cadastro: new Date().toISOString(),
      });
      if (data.session) {
        onAuth(data.user);
      } else {
        setAguardandoConfirmacao(true);
      }
    }
  };

  const handleEsqueci = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    setEnviado(true);
  };

  const inp = {
    background: "transparent",
    border: "none",
    borderBottom: `1px solid rgba(255,255,255,.82)`,
    color: C.branco,
    fontFamily: FB,
    fontWeight: 300,
    fontSize: 16,
    padding: "8px 0",
    width: "100%",
    outline: "none",
  };
  const lbl = {
    fontFamily: FB,
    fontWeight: 300,
    fontSize: 12,
    color: `rgba(255,255,255,.45)`,
    marginBottom: 7,
  };

  if (mode === "esqueci")
    return (
      <Grain
        style={{
          minHeight: 760,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          animation: "fadeUp .4s ease",
        }}
      >
        <Logo width={220} fundo="escuro" />
        <div
          style={{
            fontFamily: FS,
            fontSize: 20,
            fontWeight: 300,
            color: C.linho,
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          Recuperar senha
        </div>
        {enviado ? (
          <div
            style={{
              background: `${C.augeZ}14`,
              border: `1px solid ${C.augeZ}33`,
              borderRadius: 10,
              padding: "18px 16px",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📩</div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 13,
                color: `rgba(255,255,255,.92)`,
                lineHeight: 1.7,
              }}
            >
              Link enviado para <strong>{email}</strong>.<br />
              Verifique sua caixa de entrada.
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", marginTop: 32 }}>
            <div style={lbl}>E-mail da sua conta</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inp}
              placeholder="seu@email.com"
              onKeyDown={(e) => e.key === "Enter" && handleEsqueci()}
            />
            {erro && (
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 12,
                  color: "#f87171",
                  marginTop: 8,
                }}
              >
                {erro}
              </div>
            )}
            <BtnPill
              onClick={handleEsqueci}
              style={{
                marginTop: 28,
                opacity: loading || !email.trim() ? 0.45 : 1,
              }}
            >
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </BtnPill>
          </div>
        )}
        <button
          onClick={() => {
            setMode("login");
            setErro(null);
            setEnviado(false);
          }}
          style={{
            marginTop: 24,
            background: "none",
            border: "none",
            color: `rgba(255,255,255,.88)`,
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ← Voltar para o login
        </button>
      </Grain>
    );

  if (mode === "cadastro")
    return (
      <Grain
        style={{
          minHeight: 760,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 32px 48px",
          animation: "fadeUp .4s ease",
        }}
      >
        <Logo width={220} fundo="escuro" />
        <div
          style={{
            fontFamily: FS,
            fontSize: 20,
            fontWeight: 300,
            color: C.linho,
            marginTop: 16,
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          Criar conta
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 12,
            color: `rgba(255,255,255,.88)`,
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          Bem-vinda ao Clube do Auge
        </div>
        {aguardandoConfirmacao && (
          <div
            style={{
              background: `${C.augeZ}14`,
              border: `1px solid ${C.augeZ}33`,
              borderRadius: 12,
              padding: "22px 18px",
              width: "100%",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>📩</div>
            <div
              style={{
                fontFamily: FS,
                fontStyle: "italic",
                fontSize: 16,
                color: `rgba(255,255,255,.88)`,
                lineHeight: 1.6,
                marginBottom: 8,
              }}
            >
              Confirme seu e-mail
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 12,
                color: `rgba(255,255,255,.45)`,
                lineHeight: 1.7,
              }}
            >
              Enviamos um link de confirmação para{" "}
              <strong style={{ color: `rgba(255,255,255,.88)` }}>{email}</strong>
              . Clique no link e depois faça login.
            </div>
            <button
              onClick={() => {
                setAguardandoConfirmacao(false);
                setMode("login");
              }}
              style={{
                marginTop: 16,
                background: "none",
                border: `1px solid ${C.ouro}33`,
                borderRadius: 20,
                padding: "6px 18px",
                color: C.ouro,
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Ir para o login
            </button>
          </div>
        )}
        <div style={{ width: "100%", marginBottom: 22 }}>
          <div style={lbl}>Seu nome</div>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como você se chama?"
            style={inp}
            onKeyDown={(e) =>
              e.key === "Enter" && document.getElementById("cad-email")?.focus()
            }
          />
        </div>
        <div style={{ width: "100%", marginBottom: 22 }}>
          <div style={lbl}>E-mail</div>
          <input
            id="cad-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={inp}
            onKeyDown={(e) =>
              e.key === "Enter" && document.getElementById("cad-senha")?.focus()
            }
          />
        </div>
        <div style={{ width: "100%", marginBottom: 24 }}>
          <div style={lbl}>Senha (mínimo 6 caracteres)</div>
          <input
            id="cad-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            style={inp}
            onKeyDown={(e) => e.key === "Enter" && handleCadastro()}
          />
        </div>
        {showTermos && (
          <ModalTermos
            onAceitar={() => {
              setLeuTermos(true);
              setLgpd(true);
              setShowTermos(false);
            }}
            onFechar={() => setShowTermos(false)}
          />
        )}
        <div
          style={{
            width: "100%",
            marginBottom: 28,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <div
            onClick={() => setLgpd((v) => !v)}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border: `1.5px solid ${lgpd ? C.ouro : "rgba(255,255,255,.92)"}`,
              background: lgpd ? `${C.ouro}22` : "transparent",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 1,
              cursor: "pointer",
            }}
          >
            {lgpd && <span style={{ color: C.ouro, fontSize: 11 }}>✓</span>}
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 12,
              color: `rgba(255,255,255,.4)`,
              lineHeight: 1.6,
            }}
          >
            Aceito os{" "}
            <span
              onClick={() => setShowTermos(true)}
              style={{
                color: C.ouro,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              termos de uso
            </span>{" "}
            e a política de privacidade. Meus dados serão usados apenas para
            personalizar minha experiência no app.
          </div>
        </div>
        {erro && (
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 12,
              color: "#f87171",
              marginBottom: 12,
              width: "100%",
            }}
          >
            {erro}
          </div>
        )}
        <BtnPill
          onClick={handleCadastro}
          style={{
            opacity:
              loading ||
              !nome.trim() ||
              !email.trim() ||
              senha.length < 6 ||
              !lgpd
                ? 0.45
                : 1,
          }}
        >
          {loading ? "Criando conta..." : "Criar minha conta"}
        </BtnPill>
        <button
          onClick={() => {
            setMode("login");
            setErro(null);
          }}
          style={{
            marginTop: 20,
            background: "none",
            border: "none",
            color: `rgba(255,255,255,.88)`,
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Já tenho conta → Entrar
        </button>
      </Grain>
    );

  return (
    <Grain
      style={{
        minHeight: 760,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px 48px",
        animation: "fadeUp .4s ease",
      }}
    >
      <Logo width={260} fundo="escuro" />
      <div
        style={{
          fontFamily: FS,
          fontSize: 22,
          fontWeight: 300,
          color: C.linho,
          marginTop: 20,
          marginBottom: 8,
          textAlign: "center",
        }}
        className="text-center"
      >
        Bem-vinda
      </div>
      <div
        style={{
          fontFamily: FB,
          fontWeight: 300,
          fontSize: 13,
          color: `rgba(255,255,255,.92)`,
          marginBottom: 40,
          textAlign: "center",
        }}
      >
        Entre com seu e-mail e senha
      </div>
      <div style={{ width: "100%", marginBottom: 28 }}>
        <div style={lbl}>E-mail</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          style={inp}
          onKeyDown={(e) =>
            e.key === "Enter" && document.getElementById("ln-senha")?.focus()
          }
        />
      </div>
      <div style={{ width: "100%", marginBottom: 28 }}>
        <div style={lbl}>Senha</div>
        <input
          id="ln-senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          style={inp}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
      </div>
      {erro && (
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 12,
            color: "#f87171",
            marginBottom: 12,
            width: "100%",
          }}
        >
          {erro}
        </div>
      )}
      <button
        onClick={() => {
          setMode("esqueci");
          setErro(null);
        }}
        style={{
          background: "none",
          border: "none",
          color: `rgba(255,255,255,.82)`,
          fontFamily: FB,
          fontWeight: 300,
          fontSize: 12,
          cursor: "pointer",
          marginBottom: 20,
          alignSelf: "flex-start",
        }}
      >
        Esqueceu sua senha?
      </button>
      <BtnPill
        onClick={handleLogin}
        style={{
          marginBottom: 14,
          opacity: loading || !email.trim() || !senha ? 0.45 : 1,
        }}
      >
        {loading ? "Entrando..." : "Entrar"}
      </BtnPill>
      <button
        onClick={() => {
          setMode("cadastro");
          setErro(null);
        }}
        style={{
          background: "none",
          border: "none",
          color: C.ouro,
          fontFamily: FB,
          fontWeight: 300,
          fontSize: 13,
          cursor: "pointer",
          letterSpacing: "0.05em",
        }}
      >
        Ainda não tenho conta → Criar cadastro
      </button>
    </Grain>
  );
}

// ─── DIAGNÓSTICO DE SABOTADORES ───────────────────────────────────────────────
function Diagnostico({ onConcluir }) {
  const [idx, setIdx] = useState(0);
  const [resp, setResp] = useState({});
  const q = DIAG_Q[idx];
  const escolher = (opt) => {
    const n = { ...resp, [q.id]: opt };
    setResp(n);
    if (idx < DIAG_Q.length - 1) setIdx((i) => i + 1);
    else onConcluir(n);
  };
  return (
    <Grain style={{ minHeight: 760, animation: "fadeUp .4s ease" }}>
      <div style={{ padding: "1.5rem 1.25rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginBottom: "1.5rem",
          }}
        >
          <Logo width={120} fundo="escuro" />
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: C.ouro,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
            }}
          >
            Diagnóstico de Perfil
          </div>
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 9,
            color: C.ouro,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}
        >
          Pergunta {idx + 1} de {DIAG_Q.length}
        </div>
        <div
          style={{
            height: 2,
            background: `rgba(255,255,255,.08)`,
            borderRadius: 100,
            marginBottom: "1.5rem",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              background: C.ouro,
              borderRadius: 100,
              width: `${((idx + 1) / DIAG_Q.length) * 100}%`,
              transition: "width .3s",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: FS,
            fontSize: 19,
            fontWeight: 300,
            color: `rgba(255,255,255,.97)`,
            lineHeight: 1.55,
            marginBottom: "2rem",
          }}
        >
          {q.q}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.opts.map((op, i) => (
            <button
              key={i}
              onClick={() => escolher(op)}
              style={{
                background: `rgba(255,255,255,.05)`,
                border: `1px solid ${C.ouro}18`,
                borderRadius: 10,
                padding: "14px 16px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: FB,
                fontSize: 14,
                color: `rgba(255,255,255,.88)`,
                lineHeight: 1.4,
              }}
            >
              {op}
            </button>
          ))}
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: `rgba(255,255,255,.45)`,
            textAlign: "center",
            marginTop: "1.5rem",
            lineHeight: 1.6,
          }}
        >
          Suas respostas são vistas apenas pela Dra. Isadora
        </div>
      </div>
    </Grain>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABA: INÍCIO — Checkin + Calendário (HOME ÚNICA)
// ═══════════════════════════════════════════════════════════════════

function DefinirHabitos({ onSalvar }) {
  const [h1, setH1] = useState("");
  const [h2, setH2] = useState("");
  const [h3, setH3] = useState("");
  const ok = h1.trim() && h2.trim() && h3.trim();
  const salvar = () => {
    if (!ok) return;
    onSalvar([
      { id: "ha1", t: h1.trim() },
      { id: "ha2", t: h2.trim() },
      { id: "ha3", t: h3.trim() },
    ]);
  };
  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      <div
        style={{
          fontFamily: FS,
          fontSize: 20,
          fontWeight: 300,
          color: "rgba(255,255,255,.97)",
          marginBottom: 6,
        }}
      >
        Seus hábitos angulares
      </div>
      <div
        style={{
          fontFamily: FB,
          fontWeight: 300,
          fontSize: 13,
          color: "rgba(255,255,255,.92)",
          lineHeight: 1.65,
          marginBottom: 22,
        }}
      >
        Defina os 3 hábitos que quer trabalhar. Pode editar depois no Perfil.
      </div>
      {[
        ["1º hábito", "Ex: Caminhar 30 minutos", h1, setH1],
        ["2º hábito", "Ex: Não pular nenhuma refeição", h2, setH2],
        ["3º hábito", "Ex: 10 minutos só para mim", h3, setH3],
      ].map(([lb, ex, v, s], i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              color: C.ouro,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {lb}
          </div>
          <input
            value={v}
            onChange={(e) => s(e.target.value)}
            placeholder={ex}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${v.trim() ? C.ouro + "66" : "rgba(255,255,255,.45)"}`,
              color: C.branco,
              fontFamily: FS,
              fontSize: 17,
              fontWeight: 300,
              padding: "8px 0",
            }}
          />
        </div>
      ))}
      <div
        style={{
          background: `${C.ouro}10`,
          border: `1px solid ${C.ouro}18`,
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: "rgba(255,255,255,.4)",
            lineHeight: 1.65,
          }}
        >
          Escreva hábitos pequenos e concretos — algo que consegue fazer mesmo
          nos dias difíceis.
        </div>
      </div>
      <BtnPill onClick={salvar} style={{ opacity: ok ? 1 : 0.4 }}>
        Salvar meus hábitos
      </BtnPill>
    </div>
  );
}

// ─── CARD DA DRA. ISADORA ─────────────────────────────────────────────────────
function IsaCard({ text, loading }) {
  return (
    <div
      style={{
        background: `rgba(255,255,255,.05)`,
        border: `1px solid ${C.ouro}28`,
        borderRadius: 12,
        padding: "16px 18px",
        marginTop: 16,
        animation: "fadeUp .4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Av ini="ISA" cor={C.ouroDk} sz={38} />
        <div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 500,
              fontSize: 13,
              color: `rgba(255,255,255,.97)`,
            }}
          >
            ISA — Inteligência do Clube do Auge
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              color: C.lt,
            }}
          >
            Criada com base no método da Dra. Isadora Zaniboni
          </div>
        </div>
      </div>
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 0",
          }}
        >
          <div
            style={{
              fontSize: 18,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            💭
          </div>
          <div
            style={{
              fontFamily: FS,
              fontStyle: "italic",
              fontSize: 13,
              color: `rgba(255,255,255,.92)`,
            }}
          >
            ISA está respondendo...
          </div>
        </div>
      ) : (
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 13,
            color: `rgba(255,255,255,.92)`,
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

function MotivBanner({ ckOk, streakAtual, diasSemTreino, ir }) {
  let icon, titulo, sub, cor, bg, onClick;
  if (ckOk) {
    if (streakAtual >= 7) {
      icon = "🔥";
      titulo = `${streakAtual} dias em sequência!`;
      sub = "Você está imparável. Continue assim.";
      cor = "#F97316";
      bg = "rgba(249,115,22,.1)";
    } else if (streakAtual >= 3) {
      icon = "🔥";
      titulo = `${streakAtual} dias seguidos!`;
      sub = "Sua sequência está crescendo. Não pare.";
      cor = "#F97316";
      bg = "rgba(249,115,22,.1)";
    } else {
      icon = "✨";
      titulo = "Checkin feito!";
      sub = "Você apareceu hoje. Isso é tudo.";
      cor = C.ouro;
      bg = `${C.ouro}12`;
    }
  } else if (diasSemTreino === -1) {
    icon = "🌟";
    titulo = "Comece hoje!";
    sub = "Registre seu primeiro check-in e inicie sua sequência.";
    cor = C.ouro;
    bg = `${C.ouro}12`;
    onClick = () => ir(S.HOME);
  } else if (diasSemTreino === 0) {
    icon = "⚡";
    titulo = "Ainda falta o checkin de hoje";
    sub = "Você registrou ontem — não quebre agora!";
    cor = "#F97316";
    bg = "rgba(249,115,22,.1)";
  } else if (diasSemTreino <= 2) {
    icon = "🌱";
    titulo = { 1: "1 dia sem registrar", 2: "2 dias sem registrar" }[
      diasSemTreino
    ];
    sub = "Sua sequência está esperando por você.";
    cor = "#F97316";
    bg = "rgba(249,115,22,.1)";
  } else if (diasSemTreino <= 6) {
    icon = "⚠️";
    titulo =
      { 3: "3 dias", 4: "4 dias", 5: "5 dias", 6: "6 dias" }[diasSemTreino] +
      " sem registrar";
    sub = "Não desista agora — cada dia conta!";
    cor = "#EF4444";
    bg = "rgba(239,68,68,.1)";
  } else {
    icon = "🕯️";
    titulo =
      { diasSemTreino }[diasSemTreino] || `${diasSemTreino} dias` + " afastada";
    titulo = `${diasSemTreino} dias sem registrar`;
    sub = "Sua chama ainda está lá. Volte hoje.";
    cor = "#EF4444";
    bg = "rgba(239,68,68,.08)";
  }
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${cor}22`,
        borderRadius: 12,
        padding: "13px 16px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div
          style={{ fontFamily: FB, fontWeight: 500, fontSize: 13, color: cor }}
        >
          {titulo}
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: `rgba(255,255,255,.4)`,
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      </div>
      {streakAtual > 0 && ckOk && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{ fontFamily: FS, fontSize: 22, color: cor, lineHeight: 1 }}
          >
            {streakAtual}
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: `rgba(255,255,255,.88)`,
              letterSpacing: "0.1em",
            }}
          >
            DIAS
          </div>
        </div>
      )}
    </div>
  );
}

function Home({
  perfil,
  sem,
  mes,
  hDia,
  feitos,
  habF,
  setHabF,
  chips,
  setChips,
  ckOk,
  setCkOk,
  notas,
  setNotas,
  anc,
  historico,
  setHist,
  retomadas,
  setRet,
  pontos,
  medC,
  ir,
  tk,
  habAngulares,
  setHabAngulares,
  usuario,
  streakAtual,
  diasSemTreino,
  carta,
  dataCadastro,
  notifStatus,
  setNotifStatus,
  setEscT,
  mentoria,
  pq1,
  pq2,
  pq3,
}) {
  const [passo, setPasso] = useState(0); // 0=aguardando 1=chips 2=habitos 3=nota 4=feito
  const CHIPS = [
    { id: "cansada", e: "😮‍💨", l: "Cansada" },
    { id: "ansiosa", e: "🌀", l: "Ansiosa" },
    { id: "energizada", e: "🔋", l: "Energizada" },
    { id: "forte", e: "⚡", l: "Forte" },
    { id: "progredindo", e: "📈", l: "Progredindo" },
  ];
  const total = hDia.length;
  const pct = total ? Math.round((feitos / total) * 100) : 0;
  const toggle = (id) =>
    setChips((c) =>
      c.includes(id) ? c.filter((x) => x !== id) : [...c.slice(-1), id],
    );

  const [isaRes, setIsaRes] = useState(null);
  const [isaLoad, setIsaLoad] = useState(false);

  const salvar = async () => {
    const hoje = new Date().toISOString().split("T")[0];
    setHist((h) => ({ ...h, [hoje]: { feitos, total, retomada: false } }));
    setCkOk(true);
    tk(
      pct === 100
        ? "Dia completo! +" + (feitos * 5 + 5) + " pontos 🏆"
        : "Checkin salvo. Você apareceu hoje 💖",
    );
    syncDB(
      "checkins",
      {
        data: hoje,
        hab_feitos: hDia.filter((h) => habF[h.id]).map((h) => h.t),
        hab_nao_feitos: hDia.filter((h) => !habF[h.id]).map((h) => h.t),
        total_feitos: feitos,
        total,
        percentual: total ? Math.round((feitos / total) * 100) : 0,
        chips,
        nota: notas.trim() || null,
        retomada: false,
      },
      { onConflict: "user_id,data" },
    );
    setPasso(4);
    setIsaLoad(true);
    const habNomes = hDia.filter((h) => habF[h.id]).map((h) => h.t);
    const naoFezNomes = hDia.filter((h) => !habF[h.id]).map((h) => h.t);
    const chipsTxt =
      chips.length > 0 ? chips.join(", ") : "não registrou estado emocional";
    const notaTxt = notas.trim()
      ? `"${notas.trim()}"`
      : "não registrou nota hoje";
    const hora = new Date().getHours();
    const periodo = hora >= 5 && hora < 12 ? "manhã" : hora >= 12 && hora < 18 ? "tarde" : "noite";
    const nomeAluna = usuario?.nome ? usuario.nome.split(" ")[0] : null;
    const porques = [pq1, pq2, pq3].filter(Boolean);
    const msg = [
      `A aluna acabou de completar o check-in do dia (período: ${periodo}).`,
      nomeAluna ? `Nome dela: ${nomeAluna}.` : null,
      `Hábitos feitos: ${habNomes.length > 0 ? habNomes.join(", ") : "nenhum"}.`,
      `Hábitos não feitos: ${naoFezNomes.length > 0 ? naoFezNomes.join(", ") : "nenhum"}.`,
      `Total: ${feitos} de ${total} hábitos (${pct}%).`,
      `Como ela se sentiu: ${chipsTxt}.`,
      `Nota/microdiário: ${notaTxt}.`,
      streakAtual > 1 ? `Sequência atual: ${streakAtual} dias seguidos.` : null,
      porques.length > 0 ? `Os porquês dela (por que quer mudar): ${porques.join(" / ")}.` : null,
      `Personalize sua resposta considerando TUDO isso. Se ela escreveu algo no microdiário, mencione diretamente. Se marcou Cansada mas fez os hábitos, celebre a coragem. Se fez parcial, acolha sem dramatizar. Se tiver porquês, conecte a resposta a eles quando fizer sentido.`,
    ].filter(Boolean).join("\n");
    const resp = await callISA(msg);
    setIsaRes(resp);
    setIsaLoad(false);
  };

  // Calendário mensal
  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const rdCor = (d) => {
    const t = CAL_D[d];
    if (t === "f") return { bg: C.ouro, tc: C.obs, bo: "none" };
    if (t === "p")
      return { bg: `${C.ouroLt}33`, tc: C.ouroDk, bo: `1.5px solid ${C.ouro}` };
    if (t === "k") return { bg: `${C.blush}44`, tc: C.blush, bo: "none" };
    if (t === "*") return { bg: C.ouro, tc: C.obs, bo: "none", ex: "★" };
    if (t === "h")
      return { bg: C.ouroDk, tc: C.branco, bo: `2px solid ${C.ouro}` };
    return {
      bg: "transparent",
      tc: `rgba(255,255,255,.45)`,
      bo: `1px solid ${C.ouro}12`,
    };
  };

  return (
    <div style={{ animation: "fadeUp .35s ease" }}>
      {/* Header com logo */}
      <div
        style={{
          background: C.obs,
          padding: "12px 18px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${C.ouro}15`,
          position: "relative",
        }}
      >
        {Array.from({ length: 18 }, (_, i) => ({
          w: i % 4 === 0 ? 2 : 1,
          op: 0.06 + ((i * 31) % 60) / 1000,
          l: ((i * 59 + 11) % 96) + 2,
          t: ((i * 41 + 5) % 90) + 5,
        })).map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: s.w,
              height: s.w,
              borderRadius: "50%",
              background: C.ouro,
              opacity: s.op,
              left: `${s.l}%`,
              top: `${s.t}%`,
            }}
          />
        ))}
        <Logo width={160} fundo="escuro" />
        {perfil === "jornada" && (
          <button
            onClick={() => ir(S.EM)}
            style={{
              background: `${C.blush}22`,
              border: `1px solid ${C.blush}44`,
              borderRadius: 20,
              padding: "5px 10px",
              color: C.blush,
              fontFamily: FB,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            SOS
          </button>
        )}
        {perfil !== "jornada" && <div style={{ width: 40 }} />}
      </div>

      <Grain style={{ padding: "18px 18px 24px" }}>
        {/* Saudação */}
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 10,
            color: C.ouro,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          BOM DIA
          {usuario?.nome ? `, ${usuario.nome.split(" ")[0].toUpperCase()}` : ""}{" "}
          ☀️
        </div>
        <div
          style={{
            fontFamily: FS,
            fontStyle: "italic",
            fontSize: 13,
            color: `rgba(240,233,218,.45)`,
            lineHeight: 1.5,
            marginBottom: 16,
            borderLeft: `1px solid ${C.ouro}33`,
            paddingLeft: 10,
          }}
        >
          "{anc}"
        </div>

        {/* Banner boas-vindas para quem nunca fez checkin */}
        {diasSemTreino === -1 && !ckOk && (
          <div style={{
            background: `${C.ouro}10`,
            border: `1px solid ${C.ouro}28`,
            borderRadius: 12,
            padding: "16px 18px",
            marginBottom: 16,
            animation: "fadeUp .4s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Av ini="ISA" cor={C.ouroDk} sz={34} />
              <div style={{ fontFamily: FB, fontWeight: 500, fontSize: 12, color: `rgba(255,255,255,.97)` }}>
                Dra. Isadora Zaniboni
              </div>
            </div>
            <div style={{ fontFamily: FS, fontStyle: "italic", fontSize: 15, color: C.ouro, lineHeight: 1.6 }}>
              "Olá, {usuario?.nome?.split(" ")[0] || "bem-vinda"}! Que bom te ter aqui. Vamos começar pelo checkin?"
            </div>
          </div>
        )}

        {/* Banner motivacional estilo Duolingo */}
        {diasSemTreino !== -1 && (
          <MotivBanner
            ckOk={ckOk}
            streakAtual={streakAtual}
            diasSemTreino={diasSemTreino}
            ir={ir}
          />
        )}
        {diasSemTreino === -1 && ckOk && (
          <MotivBanner
            ckOk={ckOk}
            streakAtual={streakAtual}
            diasSemTreino={diasSemTreino}
            ir={ir}
          />
        )}

        {/* Banner carta semana 12 */}
        {carta && sem >= 12 && (
          <div
            style={{
              background: `${C.ouro}12`,
              border: `1px solid ${C.ouro}44`,
              borderRadius: 12,
              padding: "16px 16px 14px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: FB,
                fontWeight: 400,
                fontSize: 13,
                color: C.ouro,
                marginBottom: 4,
              }}
            >
              Você tem uma carta esperando por você ✉️
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.45)`,
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              escrita por você mesma na Semana 1
            </div>
            <button
              onClick={() => {
                setEscT("carta");
                ir(S.ESC);
              }}
              style={{
                background: C.ouro,
                border: "none",
                borderRadius: 50,
                padding: "10px",
                width: "100%",
                fontFamily: FB,
                fontWeight: 400,
                fontSize: 13,
                color: C.obs2,
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              Abrir minha carta →
            </button>
          </div>
        )}

        {/* Micro-card Protocolo de Retomada (quando >24h sem registro, só Jornada) */}
        {perfil === "jornada" && diasSemTreino >= 1 && passo === 0 && (
          <div
            style={{
              background: `${C.blush}12`,
              border: `1px solid ${C.blush}33`,
              borderRadius: 10,
              padding: "13px 15px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 13,
                color: C.blush,
                lineHeight: 1.5,
                marginBottom: 10,
              }}
            >
              Faz {diasSemTreino} dia{diasSemTreino !== 1 ? "s" : ""} sem
              registro. Amanhã vira o limite. Quer voltar agora?
            </div>
            <button
              onClick={() => ir(S.RET)}
              style={{
                background: C.blush,
                border: "none",
                borderRadius: 50,
                padding: "10px",
                width: "100%",
                fontFamily: FB,
                fontWeight: 400,
                fontSize: 13,
                color: C.obs2,
                cursor: "pointer",
              }}
            >
              Estou voltando agora →
            </button>
          </div>
        )}

        {/* Card de permissão de notificações (Jornada, primeira vez) */}
        {perfil === "jornada" &&
          notifStatus === "pending" &&
          "Notification" in window &&
          Notification.permission !== "denied" && (
            <div
              style={{
                background: `${C.ouro}0A`,
                border: `1px solid ${C.ouro}22`,
                borderRadius: 10,
                padding: "14px 15px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 400,
                    fontSize: 12,
                    color: C.ouro,
                  }}
                >
                  🔔 Lembretes do método
                </div>
                <button
                  onClick={() => setNotifStatus("dismissed")}
                  style={{
                    background: "none",
                    border: "none",
                    color: `rgba(255,255,255,.45)`,
                    fontSize: 16,
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 12,
                  color: `rgba(255,255,255,.4)`,
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                Ative para receber os 3 gatilhos do método: Regra dos 2 Dias,
                Ritual de Sexta e Reforço do 1%.
              </div>
              <button
                onClick={async () => {
                  const r = await requestPermission();
                  if (r === "granted") {
                    setNotifStatus("granted");
                  } else {
                    setNotifStatus(r === "denied" ? "denied" : "dismissed");
                  }
                }}
                style={{
                  background: C.ouro,
                  border: "none",
                  borderRadius: 50,
                  padding: "10px",
                  width: "100%",
                  fontFamily: FB,
                  fontWeight: 400,
                  fontSize: 12,
                  color: C.obs2,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                Ativar lembretes
              </button>
            </div>
          )}

        {/* Checkin */}
        {passo === 0 && (
          <div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 9,
                color: C.ouro,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              {ckOk ? "✓ Checkin feito hoje" : "Checkin do dia"}
            </div>
            {!ckOk ? (
              <button
                onClick={() => setPasso(1)}
                style={{
                  width: "100%",
                  background: `${C.ouro}15`,
                  border: `1px solid ${C.ouro}33`,
                  borderRadius: 12,
                  padding: "18px",
                  cursor: "pointer",
                  textAlign: "left",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    fontFamily: FS,
                    fontSize: 18,
                    fontWeight: 300,
                    color: C.ouro,
                    marginBottom: 4,
                  }}
                >
                  Como você chegou hoje?
                </div>
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 12,
                    color: `rgba(255,255,255,.92)`,
                  }}
                >
                  Toque para registrar seus hábitos
                </div>
                <div
                  style={{
                    marginTop: 14,
                    background: C.ouroLt,
                    borderRadius: 50,
                    padding: "11px",
                    textAlign: "center",
                    fontFamily: FB,
                    fontWeight: 400,
                    fontSize: 13,
                    color: C.obs2,
                  }}
                >
                  Fazer checkin
                </div>
              </button>
            ) : (
              <div
                style={{
                  background: `${C.ouro}12`,
                  border: `1px solid ${C.ouro}22`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 18,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontFamily: FS, fontSize: 16, color: C.ouro }}>
                  {feitos} de {total} hábitos · {pct}%
                </div>
                <button
                  onClick={() => setPasso(1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: `rgba(255,255,255,.88)`,
                    fontFamily: FB,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  editar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Passo 1 — definir hábitos (primeiro uso) ou chips */}
        {passo === 1 && habAngulares.length === 0 && (
          <DefinirHabitos
            onSalvar={(habs) => {
              setHabAngulares(habs);
              // Persiste imediatamente em profiles para não perder no reload
              supabase.auth.getSession().then(({ data: { session } }) => {
                if (!session?.user) return;
                supabase.from("profiles").update({
                  habito_1: habs[0]?.t || null,
                  habito_2: habs[1]?.t || null,
                  habito_3: habs[2]?.t || null,
                }).eq("id", session.user.id).then(() => {});
              });
              setPasso(1);
            }}
          />
        )}

        {passo === 1 && habAngulares.length > 0 && (
          <div>
            <div
              style={{
                fontFamily: FS,
                fontSize: 22,
                fontWeight: 300,
                color: `rgba(255,255,255,.97)`,
                marginBottom: 18,
              }}
            >
              Hábitos de hoje
            </div>
            {hDia.map((h) => (
              <div
                key={h.id}
                onClick={() => setHabF((hb) => ({ ...hb, [h.id]: !hb[h.id] }))}
                style={{
                  background: habF[h.id]
                    ? `${C.ouro}18`
                    : `rgba(255,255,255,.04)`,
                  border: `1px solid ${habF[h.id] ? C.ouro + "44" : C.ouro + "12"}`,
                  borderRadius: 10,
                  padding: "15px 14px",
                  marginBottom: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    flexShrink: 0,
                    border: `1.5px solid ${habF[h.id] ? C.ouro : `rgba(255,255,255,.45)`}`,
                    background: habF[h.id] ? C.ouro : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.obs,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {habF[h.id] && "✓"}
                </div>
                <div
                  style={{
                    fontFamily: FS,
                    fontSize: 17,
                    fontWeight: 300,
                    color: habF[h.id] ? C.ouro : `rgba(255,255,255,.92)`,
                  }}
                >
                  {h.t}
                </div>
              </div>
            ))}
            <div
              style={{
                background: `${C.ouro}10`,
                borderRadius: 8,
                padding: "10px 12px",
                marginTop: 6,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  fontFamily: FS,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: C.ouro,
                }}
              >
                {feitos} de {total} · {pct}%
              </div>
            </div>
            <BtnPill onClick={() => setPasso(2)}>Continuar</BtnPill>
          </div>
        )}

        {/* Passo 2 — chips emocionais (horizontal) */}
        {passo === 2 && (
          <div>
            <div
              style={{
                fontFamily: FS,
                fontSize: 22,
                fontWeight: 300,
                color: `rgba(255,255,255,.97)`,
                marginBottom: 6,
              }}
            >
              Como você chegou hoje?
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 12,
                color: `rgba(255,255,255,.92)`,
                marginBottom: 20,
              }}
            >
              Selecione até 2
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              {CHIPS.map((c) => {
                const s = chips.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    style={{
                      background: s ? `${C.ouro}22` : `rgba(255,255,255,.05)`,
                      border: `1px solid ${s ? C.ouro + "55" : C.ouro + "15"}`,
                      borderRadius: 50,
                      padding: "8px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{c.e}</span>
                    <span
                      style={{
                        fontFamily: FB,
                        fontWeight: 300,
                        fontSize: 12,
                        color: s ? C.ouro : `rgba(255,255,255,.4)`,
                      }}
                    >
                      {c.l}
                    </span>
                  </button>
                );
              })}
            </div>
            <BtnPill
              onClick={() => chips.length > 0 && setPasso(3)}
              style={{ opacity: chips.length > 0 ? 1 : 0.4 }}
            >
              Continuar
            </BtnPill>
          </div>
        )}

        {/* Passo 3 — nota */}
        {passo === 3 && (
          <div>
            <div
              style={{
                fontFamily: FS,
                fontSize: 22,
                fontWeight: 300,
                color: `rgba(255,255,255,.97)`,
                marginBottom: 6,
              }}
            >
              Quer registrar algo?
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 12,
                color: `rgba(255,255,255,.92)`,
                marginBottom: 18,
              }}
            >
              Sempre opcional
            </div>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="O que você quer lembrar desse dia?"
              style={{
                width: "100%",
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}18`,
                borderRadius: 10,
                padding: "13px",
                fontSize: 14,
                fontFamily: FS,
                color: `rgba(255,255,255,.88)`,
                resize: "none",
                height: 120,
                lineHeight: 1.7,
              }}
            />
            <BtnPill onClick={salvar} style={{ marginTop: 16 }}>
              Salvar checkin
            </BtnPill>
            <button
              onClick={salvar}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: `rgba(255,255,255,.82)`,
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 12,
                cursor: "pointer",
                marginTop: 10,
              }}
            >
              Pular e salvar
            </button>
          </div>
        )}

        {/* Passo 4 — fechamento */}
        {passo === 4 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: FS,
                  fontStyle: "italic",
                  fontSize: 56,
                  color: C.ouro,
                  marginBottom: 10,
                }}
              >
                {pct}%
              </div>
              <div
                style={{
                  fontFamily: FS,
                  fontSize: 18,
                  fontWeight: 300,
                  color: `rgba(255,255,255,.92)`,
                  lineHeight: 1.4,
                  marginBottom: 8,
                }}
              >
                {pct === 100
                  ? "Dia completo."
                  : pct >= 50
                    ? "Mais da metade. Isso conta."
                    : "Qualquer passo é progresso."}
              </div>
              {perfil === "jornada" && (
                <div
                  style={{
                    background: `${C.ouro}12`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginTop: 4,
                    display: "inline-block",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FB,
                      fontWeight: 300,
                      fontSize: 11,
                      color: C.ouro,
                    }}
                  >
                    +{feitos * 5 + (pct === 100 ? 5 : 0)} pontos AUGE
                  </div>
                </div>
              )}
            </div>
            <IsaCard text={isaRes} loading={isaLoad} />
            <button
              onClick={() => setPasso(0)}
              style={{
                background: "none",
                border: "none",
                color: `rgba(255,255,255,.88)`,
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 12,
                cursor: "pointer",
                marginTop: 14,
                display: "block",
                width: "100%",
              }}
            >
              ← Voltar ao início
            </button>
          </div>
        )}

        {/* Botão Ver meu progresso */}
        <button
          onClick={() => ir(S.CAL)}
          style={{
            width: "100%",
            background: "transparent",
            border: `1px solid ${C.ouro}22`,
            borderRadius: 50,
            padding: "13px 18px",
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 12,
            color: `rgba(255,255,255,.45)`,
            cursor: "pointer",
            letterSpacing: "0.06em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginTop: passo === 0 ? 0 : 16,
            marginBottom: 8,
          }}
        >
          <span>📅</span>
          <span>Ver meu progresso</span>
          <span style={{ color: C.ouro, fontSize: 16 }}>›</span>
        </button>

      </Grain>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABA: FEED — posts públicos e privados
// ═══════════════════════════════════════════════════════════════════
function Feed({ feed, setFeed, ir, authUserId }) {
  const [open, setOpen] = useState(null);
  const [txt, setTxt] = useState("");
  const [filtro, setFiltro] = useState("todas"); // "todas" | "minhas"
  const curtir = (id) => {
    setFeed((f) =>
      f.map((p) => {
        if (p.id !== id) return p;
        const userId = authUserId || "RF";
        const j = p.cur.includes(userId);
        const newCur = j ? p.cur.filter((x) => x !== userId) : [...p.cur, userId];
        // Salva curtida no Supabase se for post real (UUID)
        if (p.dbId) {
          supabase.from("feed").update({ curtidas: newCur }).eq("id", p.dbId).then(() => {});
        }
        return { ...p, cur: newCur };
      }),
    );
  };
  const comentar = (id) => {
    if (!txt.trim()) return;
    setFeed((f) =>
      f.map((p) => {
        if (p.id !== id) return p;
        const newCom = [...p.com, { q: "Você", t: txt }];
        // Salva comentário no Supabase se for post real
        if (p.dbId) {
          supabase.from("feed").update({ comentarios: newCom }).eq("id", p.dbId).then(() => {});
        }
        return { ...p, com: newCom };
      }),
    );
    setTxt("");
  };
  const deletar = (id) => {
    const post = feed.find((p) => p.id === id);
    if (!post) return;
    setFeed((f) => f.filter((p) => p.id !== id));
    if (post.dbId) {
      supabase.from("feed").delete().eq("id", post.dbId).then(() => {});
    }
  };
  // Feed: filtra por visibilidade e filtro ativo
  const visiveis = feed
    .filter((p) => p.publica || p.userId === authUserId || p.aut === "Você")
    .filter((p) => filtro === "minhas" ? (p.userId === authUserId || p.aut === "Você") : true);
  return (
    <div style={{ animation: "fadeUp .35s ease" }}>
      <div
        style={{
          background: C.obs,
          padding: "12px 18px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${C.ouro}15`,
        }}
      >
        <div style={{ width: 40 }} />
        <Logo width={100} fundo="escuro" />
        <div style={{ width: 40 }} />
      </div>
      {/* Filtro Todas / Minhas */}
      <div style={{ background: C.obs, padding: "0 16px 12px", display: "flex", gap: 8, justifyContent: "center", borderBottom: `1px solid ${C.ouro}10` }}>
        {[["todas", "Todas"], ["minhas", "Minhas"]].map(([id, label]) => (
          <button key={id} onClick={() => setFiltro(id)} style={{ background: filtro === id ? `${C.ouro}22` : `rgba(255,255,255,.04)`, border: `1px solid ${filtro === id ? C.ouro + "55" : C.ouro + "12"}`, borderRadius: 50, padding: "6px 16px", fontFamily: FB, fontWeight: 300, fontSize: 12, color: filtro === id ? C.ouro : `rgba(255,255,255,.4)`, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>
      <Grain style={{ padding: "14px 14px 8px" }}>
        {/* Botão registrar */}
        <div
          onClick={() => ir(S.NOVO)}
          style={{
            background: `rgba(255,255,255,.04)`,
            border: `1px solid ${C.ouro}15`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 10,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: FS,
              fontStyle: "italic",
              fontSize: 15,
              color: `rgba(255,255,255,.92)`,
            }}
          >
            O que você fez por você hoje?
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 11,
              color: C.ouro,
              letterSpacing: "0.1em",
            }}
          >
            + POSTAR
          </div>
        </div>

        {/* Card Conexões */}
        <div
          onClick={() => ir(S.CX)}
          style={{
            background: `${C.ouro}08`,
            border: `1px solid ${C.ouro}22`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: `${C.ouro}18`,
              border: `1px solid ${C.ouro}33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            💛
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FS,
                fontSize: 16,
                fontWeight: 300,
                color: `rgba(255,255,255,.97)`,
              }}
            >
              Encontre mulheres como você
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.92)`,
                marginTop: 3,
              }}
            >
              Radar de Amigas
            </div>
          </div>
          <div style={{ fontFamily: FB, fontSize: 18, color: C.ouro }}>›</div>
        </div>

        {visiveis.map((p) => {
          const cu = p.cur.includes("RF");
          const ab = open === p.id;
          return (
            <div
              key={p.id}
              style={{
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}15`,
                borderRadius: 12,
                marginBottom: 14,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 178,
                  background: p.fundo,
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                {p.imgSrc && (
                  <img
                    src={p.imgSrc}
                    alt=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top,rgba(0,0,0,.65),transparent 55%)",
                  }}
                />
                {!p.publica && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: `rgba(0,0,0,.5)`,
                      borderRadius: 20,
                      padding: "3px 9px",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 10 }}>🔒</span>
                    <span
                      style={{
                        fontFamily: FB,
                        fontSize: 9,
                        color: `rgba(255,255,255,.92)`,
                      }}
                    >
                      Só você
                    </span>
                  </div>
                )}
                <div
                  style={{
                    position: "relative",
                    padding: "0 14px 12px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      color: C.branco,
                      fontFamily: FS,
                      fontSize: 19,
                      fontWeight: 300,
                    }}
                  >
                    {p.tit}
                  </div>
                  <div
                    style={{
                      color: `rgba(255,255,255,.92)`,
                      fontSize: 11,
                      fontFamily: FB,
                      fontWeight: 300,
                      marginTop: 2,
                    }}
                  >
                    {p.tempo}
                  </div>
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginBottom: 8,
                  }}
                >
                  <Av ini={p.ini} cor={p.cor} sz={32} />
                  <div
                    style={{
                      fontFamily: FB,
                      fontWeight: 500,
                      fontSize: 13,
                      color: `rgba(255,255,255,.95)`,
                    }}
                  >
                    {p.aut}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontFamily: FB,
                    fontWeight: 300,
                    color: `rgba(255,255,255,.82)`,
                    lineHeight: 1.65,
                    marginBottom: 10,
                  }}
                >
                  {p.desc}
                </div>
                <div
                  style={{
                    display: "flex",
                    borderTop: `1px solid ${C.ouro}12`,
                    paddingTop: 9,
                  }}
                >
                  <button
                    onClick={() => curtir(p.id)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: cu ? C.ouro : `rgba(255,255,255,.92)`,
                      fontFamily: FB,
                      fontWeight: 300,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      padding: "5px 0",
                    }}
                  >
                    {cu ? "💛 Me identifico" : "💛 Te entendo"}
                    {p.cur.length > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: `rgba(255,255,255,.28)`,
                          marginLeft: 4,
                        }}
                      >
                        {p.cur.length} se identificaram
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setOpen(ab ? null : p.id)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      color: `rgba(255,255,255,.92)`,
                      fontFamily: FB,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      padding: "5px 0",
                    }}
                  >
                    💬<span style={{ fontSize: 12 }}>{p.com.length}</span>
                  </button>
                  {(p.userId === authUserId || p.aut === "Você") && (
                    <button
                      onClick={() => { if (window.confirm("Excluir esta publicação?")) deletar(p.id); }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        color: `rgba(255,255,255,.25)`,
                        padding: "5px 8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                {ab && (
                  <div
                    style={{
                      marginTop: 10,
                      borderTop: `1px solid ${C.ouro}12`,
                      paddingTop: 10,
                    }}
                  >
                    {p.com.map((c, i) => (
                      <div
                        key={i}
                        style={{ display: "flex", gap: 7, marginBottom: 8 }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: C.ouroDk,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: C.branco,
                            fontSize: 10,
                            fontFamily: FB,
                            flexShrink: 0,
                          }}
                        >
                          {c.q.slice(0, 2).toUpperCase()}
                        </div>
                        <div
                          style={{
                            background: `rgba(255,255,255,.06)`,
                            borderRadius: 10,
                            padding: "6px 10px",
                            fontSize: 13,
                            fontFamily: FB,
                            color: `rgba(255,255,255,.82)`,
                            flex: 1,
                          }}
                        >
                          {c.t}
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 7, marginTop: 4 }}>
                      <input
                        value={txt}
                        onChange={(e) => setTxt(e.target.value)}
                        placeholder="Escreva um comentário..."
                        style={{
                          flex: 1,
                          background: `rgba(255,255,255,.06)`,
                          border: "none",
                          borderRadius: 20,
                          padding: "8px 12px",
                          fontSize: 13,
                          fontFamily: FB,
                          color: C.branco,
                        }}
                      />
                      <button
                        onClick={() => comentar(p.id)}
                        style={{
                          background: `${C.obs2}`,
                          border: `1px solid ${C.ouro}33`,
                          borderRadius: "50%",
                          width: 36,
                          height: 36,
                          cursor: "pointer",
                          color: C.ouro,
                          fontSize: 16,
                        }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Grain>
    </div>
  );
}

// Novo post — micro-ação comportamental ou de mentalidade
function Novo({ back, postTreino }) {
  const [tit, setTit] = useState("");
  const [cap, setCap] = useState("");
  const [foto, setFoto] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [publica, setPublica] = useState(true);
  const ref = useRef();
  const ok = tit.trim().length > 0;
  const SUGESTOES = [
    "Sentei pra ler 15 min em vez de ficar no celular",
    "Almocei sentada, sem pressa",
    "Voltei depois de dias parada",
    "Fiz algo só pra mim hoje, sem culpa",
    "Bebi água antes do café da manhã",
    "Dormi antes da meia-noite",
    "Outros",
  ];
  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      <Cab titulo="Compartilhar no Mural" voltar={back} />
      <Grain style={{ padding: "20px 20px 36px" }}>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: C.lt,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          O que você fez por você hoje?
        </div>
        <textarea
          value={tit}
          onChange={(e) => setTit(e.target.value)}
          placeholder="Uma linha é o suficiente."
          style={{
            width: "100%",
            background: `rgba(255,255,255,.04)`,
            border: `1px solid ${C.ouro}25`,
            borderRadius: 10,
            padding: "13px 14px",
            fontSize: 15,
            fontFamily: FS,
            fontStyle: "italic",
            color: `rgba(255,255,255,.92)`,
            resize: "none",
            height: 72,
            lineHeight: 1.6,
            marginBottom: 12,
          }}
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 7,
            marginBottom: 18,
          }}
        >
          {SUGESTOES.map((s) => (
            <button
              key={s}
              onClick={() => s === "Outros" ? setTit("") : setTit(s)}
              style={{
                background: s === "Outros"
                  ? `rgba(255,255,255,.04)`
                  : tit === s ? `${C.ouro}18` : `rgba(255,255,255,.04)`,
                color: s === "Outros" ? `rgba(255,255,255,.55)` : tit === s ? C.ouro : `rgba(255,255,255,.45)`,
                border: `1px solid ${s !== "Outros" && tit === s ? C.ouro + "40" : C.ouro + "12"}`,
                borderRadius: 50,
                padding: "7px 13px",
                fontSize: 12,
                fontFamily: FB,
                fontWeight: 300,
                cursor: "pointer",
                fontStyle: s === "Outros" ? "normal" : "italic",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: C.lt,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Quer acrescentar algo? (opcional)
        </div>
        <textarea
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          placeholder="Conta mais para as amigas..."
          style={{
            width: "100%",
            background: `rgba(255,255,255,.04)`,
            border: `1px solid ${C.ouro}18`,
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 14,
            fontFamily: FB,
            color: C.branco,
            resize: "none",
            height: 72,
            lineHeight: 1.65,
            marginBottom: 16,
          }}
        />
        <div
          onClick={() => ref.current?.click()}
          style={{
            height: 100,
            borderRadius: 10,
            border: `1.5px dashed ${C.ouro}25`,
            background: `rgba(255,255,255,.03)`,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginBottom: 18,
          }}
        >
          {foto ? (
            <img
              src={foto}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>📷</div>
              <div
                style={{
                  fontSize: 12,
                  fontFamily: FB,
                  fontWeight: 300,
                  color: C.lt,
                  marginTop: 5,
                }}
              >
                Foto opcional
              </div>
            </div>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files[0];
            if (!f) return;
            setFotoFile(f);
            const r = new FileReader();
            r.onload = (ev) => setFoto(ev.target.result);
            r.readAsDataURL(f);
          }}
        />
        {/* Visibilidade */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 11,
              color: C.lt,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Visibilidade
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setPublica(true)}
              style={{
                flex: 1,
                background: publica ? `${C.ouro}22` : `rgba(255,255,255,.04)`,
                border: `1px solid ${publica ? C.ouro + "55" : C.ouro + "15"}`,
                borderRadius: 8,
                padding: "11px",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>🌍</div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 11,
                  color: publica ? C.ouro : `rgba(255,255,255,.92)`,
                }}
              >
                Público
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 9,
                  color: `rgba(255,255,255,.45)`,
                  marginTop: 2,
                }}
              >
                Toda a comunidade vê
              </div>
            </button>
            <button
              onClick={() => setPublica(false)}
              style={{
                flex: 1,
                background: !publica ? `${C.ouro}22` : `rgba(255,255,255,.04)`,
                border: `1px solid ${!publica ? C.ouro + "55" : C.ouro + "15"}`,
                borderRadius: 8,
                padding: "11px",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>🔒</div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 11,
                  color: !publica ? C.ouro : `rgba(255,255,255,.92)`,
                }}
              >
                Só para mim
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 9,
                  color: `rgba(255,255,255,.45)`,
                  marginTop: 2,
                }}
              >
                Só você vê
              </div>
            </button>
          </div>
        </div>
        <BtnPill
          onClick={() =>
            ok &&
            postTreino({
              fundo: "#1E252E",
              tit: tit.trim(),
              desc: cap.trim(),
              publica,
              imgSrc: foto,
              imgFile: fotoFile,
            })
          }
          style={{ opacity: ok ? 1 : 0.4 }}
        >
          {publica ? "Publicar no Mural" : "Salvar para mim"}
        </BtnPill>
      </Grain>
    </div>
  );
}

// Voz com IA (só Dra. Isadora)
function Voz({ back, postTreino, tk }) {
  const [fase, setFase] = useState("idle");
  const [tr, setTr] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(false);
  const rRef = useRef(null);
  const iniciar = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setErr(true);
      return;
    }
    const r = new SR();
    r.lang = "pt-BR";
    r.continuous = false;
    r.interimResults = true;
    r.onstart = () => setFase("ouvindo");
    r.onresult = (e) =>
      setTr(
        Array.from(e.results)
          .map((r) => r[0].transcript)
          .join(""),
      );
    r.onend = () => {
      if (tr) proc(tr);
      else setFase("idle");
    };
    r.onerror = () => {
      setFase("idle");
      setErr(true);
    };
    rRef.current = r;
    r.start();
  }, [tr]);
  const parar = () => {
    rRef.current?.stop();
  };
  const proc = async (texto) => {
    setFase("proc");
    setRes({ texto });
    setFase("resultado");
  };
  const demo = async () => {
    const t = "Corri 5 quilômetros hoje de manhã, levei 35 minutos";
    setTr(t);
    await proc(t);
  };
  const [publica, setPublica] = useState(true);
  return (
    <Grain style={{ minHeight: 760, animation: "fadeUp .4s ease" }}>
      <Cab titulo="Registrar por voz" voltar={back} />
      <div style={{ padding: "28px 22px" }}>
        {fase === "idle" && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}18`,
                borderRadius: 12,
                padding: "20px 18px",
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 13,
                  color: `rgba(255,255,255,.4)`,
                  marginBottom: 12,
                  lineHeight: 1.6,
                }}
              >
                Toque no microfone e conte o que você fez por você hoje:
              </div>
              {[
                "Sentei pra ler 15 min em vez de scrollar",
                "Almocei sentada, sem pressa, sem tela",
                "Voltei depois de dias parada. Contou.",
              ].map((ex, i) => (
                <div
                  key={i}
                  style={{
                    background: `rgba(255,255,255,.04)`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 7,
                    fontSize: 12,
                    fontFamily: FS,
                    fontStyle: "italic",
                    color: `rgba(255,255,255,.92)`,
                    textAlign: "left",
                  }}
                >
                  "{ex}"
                </div>
              ))}
            </div>
            <div
              onClick={iniciar}
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: `radial-gradient(circle,${C.ouro}20,${C.ouro}06)`,
                border: `1px solid ${C.ouro}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                margin: "0 auto 12px",
                fontSize: 38,
              }}
            >
              🎤
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 13,
                color: `rgba(255,255,255,.92)`,
              }}
            >
              Toque para falar
            </div>
            {err && (
              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: FB,
                    color: C.lt,
                    marginBottom: 10,
                  }}
                >
                  Microfone não disponível
                </div>
                <button
                  onClick={demo}
                  style={{
                    background: `${C.terra}88`,
                    border: "none",
                    borderRadius: 50,
                    padding: "10px 22px",
                    color: C.branco,
                    fontSize: 13,
                    fontFamily: FB,
                    cursor: "pointer",
                  }}
                >
                  ▶ Ver demo com IA
                </button>
              </div>
            )}
          </div>
        )}
        {fase === "ouvindo" && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}33`,
                borderRadius: 12,
                padding: "22px",
                marginBottom: 22,
                minHeight: 100,
              }}
            >
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 10,
                  color: C.ouro,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Ouvindo...
              </div>
              <div
                style={{
                  fontFamily: FS,
                  fontSize: 16,
                  color: tr ? `rgba(255,255,255,.95)` : `rgba(255,255,255,.88)`,
                  fontStyle: tr ? "normal" : "italic",
                  lineHeight: 1.6,
                }}
              >
                {tr || "Fale agora..."}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 5,
                marginBottom: 24,
                alignItems: "center",
                height: 32,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    background: C.ouro,
                    borderRadius: 100,
                    animation: `wave 1s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
              ))}
            </div>
            <button
              onClick={parar}
              style={{
                background: `${C.terra}88`,
                border: "none",
                borderRadius: 50,
                padding: "13px 36px",
                color: C.branco,
                fontSize: 15,
                fontFamily: FB,
                cursor: "pointer",
              }}
            >
              ⏹ Parar
            </button>
          </div>
        )}
        {fase === "proc" && (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <div
              style={{
                fontSize: 48,
                marginBottom: 16,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              🧠
            </div>
            <div
              style={{
                fontFamily: FS,
                fontSize: 18,
                color: `rgba(255,255,255,.88)`,
                marginBottom: 6,
              }}
            >
              Processando...
            </div>
          </div>
        )}
        {fase === "resultado" && res && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div
              style={{
                background: `rgba(255,255,255,.05)`,
                border: `1px solid ${C.ouro}25`,
                borderRadius: 12,
                padding: "13px 15px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 9,
                  color: C.ouro,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                Registro salvo
              </div>
              <div
                style={{
                  fontFamily: FS,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: `rgba(255,255,255,.92)`,
                }}
              >
                "{res.texto}"
              </div>
            </div>
            <div
              style={{
                background: `rgba(255,255,255,.05)`,
                border: `1px solid ${C.ouro}25`,
                borderRadius: 12,
                padding: "18px",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <Av ini="ISA" cor={C.ouroDk} sz={40} />
                <div>
                  <div
                    style={{
                      fontFamily: FB,
                      fontWeight: 500,
                      fontSize: 13,
                      color: `rgba(255,255,255,.97)`,
                    }}
                  >
                    ISA — Inteligência do Clube do Auge
                  </div>
                  <div
                    style={{
                      fontFamily: FB,
                      fontWeight: 300,
                      fontSize: 11,
                      color: C.lt,
                    }}
                  >
                    Criada com base no método da Dra. Isadora Zaniboni
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 14,
                  color: `rgba(255,255,255,.92)`,
                  lineHeight: 1.75,
                }}
              >
                {res.isa}
              </div>
            </div>
            {/* Visibilidade */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setPublica(true)}
                style={{
                  flex: 1,
                  background: publica ? `${C.ouro}22` : `rgba(255,255,255,.04)`,
                  border: `1px solid ${publica ? C.ouro + "44" : C.ouro + "12"}`,
                  borderRadius: 8,
                  padding: "10px 8px",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 11,
                    color: publica ? C.ouro : `rgba(255,255,255,.88)`,
                  }}
                >
                  🌍 Público
                </div>
              </button>
              <button
                onClick={() => setPublica(false)}
                style={{
                  flex: 1,
                  background: !publica
                    ? `${C.ouro}22`
                    : `rgba(255,255,255,.04)`,
                  border: `1px solid ${!publica ? C.ouro + "44" : C.ouro + "12"}`,
                  borderRadius: 8,
                  padding: "10px 8px",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 11,
                    color: !publica ? C.ouro : `rgba(255,255,255,.88)`,
                  }}
                >
                  🔒 Só para mim
                </div>
              </button>
            </div>
            <BtnPill
              onClick={() => {
                postTreino({
                  fundo: "#1E252E",
                  tit: "Registro",
                  desc: res.texto,
                  publica,
                });
                tk("Registro salvo! 💖");
              }}
            >
              ✅ {publica ? "Registrar no Mural" : "Salvar para mim"}
            </BtnPill>
            <button
              onClick={() => {
                setFase("idle");
                setTr("");
                setRes(null);
              }}
              style={{
                width: "100%",
                background: "none",
                border: `1px solid ${C.ouro}18`,
                borderRadius: 50,
                padding: "12px",
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 12,
                color: C.lt,
                cursor: "pointer",
                marginTop: 10,
              }}
            >
              🎤 Registrar outro movimento
            </button>
          </div>
        )}
      </div>
    </Grain>
  );
}

// ─── CONEXÕES (dentro do Feed) ────────────────────────────────────────────────
function Cx({
  matches,
  setMatches,
  ci,
  sw,
  doSwipe,
  selM,
  setSelM,
  ir,
  back,
  tk,
}) {
  const p = PERFIS_CX[ci];
  return (
    <div style={{ animation: "fadeUp .35s ease" }}>
      <Cab titulo="Conexões" voltar={back} />
      <Grain style={{ padding: "18px 16px 8px" }}>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 12,
            color: `rgba(255,255,255,.92)`,
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          Encontre mulheres como você
        </div>
        {p ? (
          <>
            <div
              style={{
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}18`,
                borderRadius: 14,
                overflow: "hidden",
                marginBottom: 14,
                animation:
                  sw === "right"
                    ? "swR .38s ease forwards"
                    : sw === "left"
                      ? "swL .38s ease forwards"
                      : "none",
              }}
            >
              <div
                style={{
                  height: 218,
                  background: p.cor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: 58,
                    fontFamily: FS,
                    fontWeight: 300,
                    color: `rgba(255,255,255,.18)`,
                  }}
                >
                  {p.ini}
                </div>
                {p.ok && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: `rgba(15,110,86,.8)`,
                      borderRadius: 20,
                      padding: "4px 10px",
                    }}
                  >
                    <span
                      style={{ color: C.branco, fontSize: 11, fontWeight: 500 }}
                    >
                      ✓ Verificada
                    </span>
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: `rgba(0,0,0,.5)`,
                    borderRadius: 20,
                    padding: "4px 10px",
                  }}
                >
                  <span
                    style={{ color: C.branco, fontSize: 11, fontWeight: 500 }}
                  >
                    💛 {p.compat}%
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background:
                      "linear-gradient(to top,rgba(0,0,0,.7),transparent)",
                    padding: "18px 16px 14px",
                  }}
                >
                  <div
                    style={{
                      color: C.branco,
                      fontFamily: FS,
                      fontSize: 21,
                      fontWeight: 300,
                    }}
                  >
                    {p.nome}
                  </div>
                  <div
                    style={{
                      color: `rgba(255,255,255,.92)`,
                      fontSize: 12,
                      fontFamily: FB,
                      fontWeight: 300,
                    }}
                  >
                    {p.idade} anos · {p.cidade}
                  </div>
                </div>
              </div>
              <div style={{ padding: "14px 16px 16px" }}>
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 13,
                    color: `rgba(255,255,255,.82)`,
                    lineHeight: 1.7,
                    marginBottom: 10,
                  }}
                >
                  {p.bio}
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {p.hab.map((h) => (
                    <span
                      key={h}
                      style={{
                        background: `${C.ouro}15`,
                        borderRadius: 20,
                        padding: "4px 11px",
                        fontSize: 11,
                        fontFamily: FB,
                        fontWeight: 300,
                        color: C.ouro,
                        border: `1px solid ${C.ouro}30`,
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => doSwipe("left")}
                style={{
                  flex: 1,
                  padding: "15px",
                  borderRadius: 50,
                  background: `rgba(255,255,255,.04)`,
                  border: `1px solid ${C.ouro}18`,
                  color: `rgba(255,255,255,.4)`,
                  fontSize: 14,
                  fontFamily: FB,
                  fontWeight: 300,
                  cursor: "pointer",
                }}
              >
                Passar →
              </button>
              <button
                onClick={() => doSwipe("right")}
                style={{
                  flex: 1,
                  padding: "15px",
                  borderRadius: 50,
                  background: `linear-gradient(135deg,${C.ouro}28,${C.ouro}12)`,
                  border: `1px solid ${C.ouro}55`,
                  color: C.ouro,
                  fontSize: 14,
                  fontFamily: FB,
                  fontWeight: 300,
                  cursor: "pointer",
                }}
              >
                💛 Quero me conectar
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              background: `rgba(255,255,255,.04)`,
              border: `1px solid ${C.ouro}15`,
              borderRadius: 12,
              padding: "44px 22px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: FS,
                fontSize: 20,
                color: `rgba(255,255,255,.82)`,
                marginBottom: 8,
              }}
            >
              Por hoje é só!
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 13,
                color: `rgba(255,255,255,.88)`,
                lineHeight: 1.6,
              }}
            >
              Novas mulheres aparecem toda semana
            </div>
          </div>
        )}
        {matches.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 9,
                color: C.ouro,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Suas conexões ({matches.length})
            </div>
            {matches.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setSelM(m);
                  ir(S.MATCH);
                }}
                style={{
                  background: `rgba(255,255,255,.04)`,
                  border: `1px solid ${C.ouro}15`,
                  borderRadius: 12,
                  padding: "13px 15px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <Av ini={m.ini} cor={m.cor} sz={42} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: FB,
                      fontWeight: 500,
                      fontSize: 14,
                      color: `rgba(255,255,255,.95)`,
                    }}
                  >
                    {m.nome}
                  </div>
                  <div
                    style={{
                      fontFamily: FB,
                      fontWeight: 300,
                      fontSize: 11,
                      color: `rgba(255,255,255,.88)`,
                      marginTop: 2,
                    }}
                  >
                    Toque para enviar mensagem
                  </div>
                </div>
                <span style={{ color: `rgba(255,255,255,.45)`, fontSize: 17 }}>
                  ›
                </span>
              </div>
            ))}
          </div>
        )}
      </Grain>
    </div>
  );
}

function MatchDet({ selM, setSelM, ir, back }) {
  const m = selM;
  const [matched, setMatched] = useState(false);
  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      <div
        style={{
          background: m.cor,
          padding: "52px 20px 26px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <button
          onClick={back}
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            background: `rgba(255,255,255,.15)`,
            border: "none",
            borderRadius: 20,
            padding: "7px 13px",
            color: C.branco,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: FB,
          }}
        >
          ← Voltar
        </button>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: `rgba(255,255,255,.45)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FS,
            fontSize: 28,
            color: C.branco,
            margin: "0 auto 10px",
          }}
        >
          {m.ini}
        </div>
        <div
          style={{
            fontFamily: FS,
            fontSize: 22,
            fontWeight: 300,
            color: C.branco,
          }}
        >
          {m.nome}
        </div>
        <div
          style={{
            color: `rgba(255,255,255,.88)`,
            fontSize: 13,
            fontFamily: FB,
            fontWeight: 300,
            marginTop: 3,
          }}
        >
          {m.idade} anos · {m.cidade}
        </div>
        {m.ok && (
          <div
            style={{
              display: "inline-block",
              background: `rgba(255,255,255,.15)`,
              borderRadius: 20,
              padding: "4px 13px",
              marginTop: 10,
              color: C.branco,
              fontSize: 11,
              fontFamily: FB,
            }}
          >
            ✓ Verificada
          </div>
        )}
      </div>
      <Grain style={{ padding: "20px 20px 36px" }}>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 13,
            color: `rgba(255,255,255,.82)`,
            lineHeight: 1.7,
            marginBottom: 14,
          }}
        >
          {m.bio}
        </div>
        <div
          style={{
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          {m.hab.map((h) => (
            <span
              key={h}
              style={{
                background: `${C.ouro}15`,
                borderRadius: 20,
                padding: "5px 12px",
                fontSize: 12,
                fontFamily: FB,
                color: C.ouro,
                border: `1px solid ${C.ouro}30`,
              }}
            >
              {h}
            </span>
          ))}
        </div>
        <BtnPill onClick={() => ir(S.CHAT)} style={{ marginBottom: 10 }}>
          💬 Enviar mensagem
        </BtnPill>
      </Grain>
    </div>
  );
}

function Chat({ selM, setMatches, back }) {
  const m = selM;
  const [msgs, setMsgs] = useState(m.msgs || []);
  const [txt, setTxt] = useState("");
  const bot = useRef();
  const SUGE = [
    "Oi! Vi que você também curte pilates 🌸",
    "Que horários têm mais energia pra você?",
    "Topa conversar essa semana?",
    "Topa um café esta semana?",
  ];
  const enviar = () => {
    if (!txt.trim()) return;
    const n = { de: "RF", texto: txt.trim(), hora: "agora" };
    setMsgs((ms) => [...ms, n]);
    setMatches((ms) =>
      ms.map((mm) =>
        mm.id === m.id ? { ...mm, msgs: [...(mm.msgs || []), n] } : mm,
      ),
    );
    setTxt("");
    setTimeout(() => {
      const rs = [
        "Que ótimo! Eu também adoro me mover cedo ☀️",
        "Vamos combinar! Qual horário você prefere?",
        "Perfeito! Manda seu contato e a gente acerta 💛",
      ];
      setMsgs((ms) => [
        ...ms,
        {
          de: m.ini,
          texto: rs[Math.floor(Math.random() * rs.length)],
          hora: "agora",
        },
      ]);
    }, 1200);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        animation: "fadeUp .35s ease",
      }}
    >
      <div
        style={{
          background: C.obs,
          padding: "12px 15px 14px",
          display: "flex",
          alignItems: "center",
          gap: 11,
          borderBottom: `1px solid ${C.ouro}15`,
        }}
      >
        <button
          onClick={back}
          style={{
            background: "none",
            border: "none",
            color: `rgba(255,255,255,.92)`,
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ←
        </button>
        <Av ini={m.ini} cor={m.cor} sz={36} />
        <div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 500,
              fontSize: 13,
              color: `rgba(255,255,255,.97)`,
            }}
          >
            {m.nome.split(" ")[0]}
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              color: `rgba(255,255,255,.88)`,
            }}
          >
            {m.compat}% compatível · {m.cidade}
          </div>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: C.obs,
          padding: "14px 13px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", padding: "22px 0" }}>
            <div
              style={{
                fontFamily: FS,
                fontStyle: "italic",
                fontSize: 14,
                color: `rgba(255,255,255,.88)`,
                lineHeight: 1.6,
              }}
            >
              Comece a conversa!
              <br />
              Se movam juntas 💛
            </div>
          </div>
        )}
        {msgs.map((msg, i) => {
          const eu = msg.de === "RF";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: eu ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: 7,
              }}
            >
              {!eu && <Av ini={m.ini} cor={m.cor} sz={26} />}
              <div
                style={{
                  maxWidth: "73%",
                  background: eu ? `${C.ouro}20` : `rgba(255,255,255,.06)`,
                  borderRadius: eu
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                  padding: "10px 13px",
                  border: `1px solid ${eu ? C.ouro + "28" : C.ouro + "10"}`,
                }}
              >
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 13,
                    color: eu ? C.ouroLt : `rgba(255,255,255,.82)`,
                    lineHeight: 1.6,
                  }}
                >
                  {msg.texto}
                </div>
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 9,
                    color: `rgba(255,255,255,.45)`,
                    marginTop: 3,
                  }}
                >
                  {msg.hora}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bot} />
      </div>
      {msgs.length === 0 && (
        <div
          style={{
            background: C.obs,
            padding: "0 13px 8px",
            display: "flex",
            gap: 7,
            overflowX: "auto",
          }}
        >
          {SUGE.map((s, i) => (
            <button
              key={i}
              onClick={() => setTxt(s)}
              style={{
                background: `${C.ouro}10`,
                border: `1px solid ${C.ouro}18`,
                borderRadius: 20,
                padding: "6px 11px",
                fontSize: 11,
                fontFamily: FS,
                fontStyle: "italic",
                color: C.ouro,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div
        style={{
          padding: "9px 13px 14px",
          background: C.obs,
          borderTop: `1px solid ${C.ouro}15`,
          display: "flex",
          gap: 8,
        }}
      >
        <input
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Escreva uma mensagem..."
          style={{
            flex: 1,
            background: `rgba(255,255,255,.06)`,
            border: `1px solid ${C.ouro}15`,
            borderRadius: 20,
            padding: "10px 15px",
            fontSize: 13,
            fontFamily: FB,
            fontWeight: 300,
            color: C.branco,
          }}
        />
        <button
          onClick={enviar}
          style={{
            background: `${C.ouro}28`,
            border: `1px solid ${C.ouro}44`,
            borderRadius: "50%",
            width: 42,
            height: 42,
            cursor: "pointer",
            color: C.ouro,
            fontSize: 18,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ─── EDITOR DE CARTA ──────────────────────────────────────────────────────────
function CartaEditor({ setCarta, tk }) {
  const [txt, setTxt] = useState("");
  const ok = txt.trim().length > 10;
  const salvar = () => {
    if (!ok) return;
    const d = new Date();
    const data = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    setCarta({ texto: txt.trim(), data });
    syncDB("carta_futuro", {
      texto: txt.trim(),
      data_escrita: new Date().toISOString(),
    }, { onConflict: "user_id" });
    tk("Carta guardada. Ela espera por você na Semana 12. 💖");
  };
  return (
    <div>
      <textarea
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        placeholder="Querida futura eu..."
        style={{
          width: "100%",
          background: `rgba(255,255,255,.04)`,
          border: `1px solid ${C.ouro}18`,
          borderRadius: 10,
          padding: "14px",
          fontSize: 14,
          fontFamily: FS,
          fontStyle: "italic",
          color: `rgba(255,255,255,.88)`,
          resize: "none",
          height: 180,
          lineHeight: 1.8,
          marginBottom: 14,
          boxSizing: "border-box",
        }}
      />
      <BtnPill onClick={salvar} style={{ opacity: ok ? 1 : 0.4 }}>
        Guardar minha carta
      </BtnPill>
    </div>
  );
}

// ─── TELA DE CONVITE ──────────────────────────────────────────────────────────
function TelaConvite({ back }) {
  return (
    <Grain style={{ minHeight: 760, animation: "fadeUp .4s ease" }}>
      <Cab titulo="Jornada AUGE" voltar={back} />
      <div style={{ padding: "24px 20px 40px" }}>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 9,
            color: C.ouro,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Isso é da Jornada AUGE
        </div>
        <div
          style={{
            fontFamily: FS,
            fontStyle: "italic",
            fontSize: 18,
            color: `rgba(255,255,255,.88)`,
            textAlign: "center",
            lineHeight: 1.4,
            marginBottom: 24,
          }}
        >
          12 semanas. Método.
          <br />
          Transformação real.
        </div>
        {[
          {
            icon: "✅",
            tit: "Check-in diário com seus 3 hábitos personalizados",
          },
          {
            icon: "⭕",
            tit: "Roda AUGE: acompanhe sua evolução em S1, S6 e S12",
          },
          {
            icon: "🔁",
            tit: "Protocolo de Retomada com Kit de Emergência personalizado",
          },
          {
            icon: "✍️",
            tit: "Espaços de escrita: Vitórias, Âncora, Porquês e Carta para o Futuro",
          },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>
              {b.icon}
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 13,
                color: `rgba(255,255,255,.82)`,
                lineHeight: 1.5,
              }}
            >
              {b.tit}
            </div>
          </div>
        ))}
        <div
          style={{
            borderLeft: `2px solid ${C.ouro}44`,
            padding: "14px 16px",
            margin: "20px 0",
          }}
        >
          <div
            style={{
              fontFamily: FS,
              fontStyle: "italic",
              fontSize: 14,
              color: `rgba(255,255,255,.88)`,
              lineHeight: 1.6,
              marginBottom: 6,
            }}
          >
            "Em 12 semanas criei uma rotina que achei que nunca seria possível
            pra mim."
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              color: C.ouro,
              letterSpacing: "0.2em",
            }}
          >
            — Maria, 54 anos · Florianópolis
          </div>
        </div>
        <BtnPill
          onClick={() => {}}
          style={{ marginBottom: 12 }}
        >
          Quero entrar na lista de espera
        </BtnPill>
        <BtnOut onClick={back}>Voltar</BtnOut>
      </div>
    </Grain>
  );
}

// ─── JORNADA CLUBE ────────────────────────────────────────────────────────────
function JornadaClube({ ir }) {
  const [convite, setConvite] = useState(false);
  if (convite) return <TelaConvite back={() => setConvite(false)} />;
  const lock = () => setConvite(true);

  const LockCard = ({ children, msg }) => (
    <div
      style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}
      onClick={lock}
    >
      <div style={{ pointerEvents: "none", opacity: 0.38 }}>{children}</div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 20 }}>🔒</div>
        {msg && (
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              color: C.ouro,
              textAlign: "center",
              lineHeight: 1.4,
              maxWidth: 190,
              padding: "0 8px",
            }}
          >
            {msg}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp .35s ease" }}>
      <div
        style={{
          background: C.obs,
          padding: "12px 18px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${C.ouro}15`,
        }}
      >
        <div
          style={{
            fontFamily: FS,
            fontSize: 18,
            fontWeight: 300,
            letterSpacing: "0.1em",
            color: C.linho,
          }}
        >
          Jornada AUGE
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: C.ouro,
            letterSpacing: "0.2em",
          }}
        >
          Clube
        </div>
      </div>
      <Grain style={{ padding: "16px 18px 24px" }}>
        {/* Check-in diário — hábitos angulares bloqueados */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: C.ouro,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Check-in diário
          </div>
          <LockCard msg="Personalize seus 3 hábitos na Jornada AUGE">
            <div
              style={{
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}15`,
                borderRadius: 10,
                padding: "14px",
              }}
            >
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 12,
                  color: `rgba(255,255,255,.92)`,
                  marginBottom: 10,
                }}
              >
                Como você está hoje?
              </div>
              {[
                "1º hábito angular",
                "2º hábito angular",
                "3º hábito angular",
              ].map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `1px solid ${C.ouro}30`,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: FB,
                      fontWeight: 300,
                      fontSize: 13,
                      color: `rgba(255,255,255,.4)`,
                    }}
                  >
                    {h}
                  </div>
                </div>
              ))}
            </div>
          </LockCard>
        </div>

        {/* Roda AUGE — S1 liberada, S6 e S12 bloqueadas */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: C.ouro,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Roda AUGE
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <button
              onClick={() => ir(S.RODA)}
              style={{
                background: `${C.ouro}15`,
                border: `1px solid ${C.ouro}44`,
                borderRadius: 10,
                padding: "14px 0",
                cursor: "pointer",
                color: C.ouro,
                fontFamily: FB,
                fontSize: 12,
                letterSpacing: "0.2em",
              }}
            >
              S1
              <br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>Início ✓</span>
            </button>
            {[
              ["S6", "Meio"],
              ["S12", "Fim"],
            ].map(([m, sub]) => (
              <button
                key={m}
                onClick={lock}
                style={{
                  background: `rgba(255,255,255,.04)`,
                  border: `1px solid ${C.ouro}15`,
                  borderRadius: 10,
                  padding: "14px 0",
                  cursor: "pointer",
                  color: `rgba(255,255,255,.22)`,
                  fontFamily: FB,
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 8,
                    fontSize: 10,
                  }}
                >
                  🔒
                </div>
                {m}
                <br />
                <span style={{ fontSize: 9, opacity: 0.5 }}>{sub}</span>
              </button>
            ))}
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              color: `rgba(255,255,255,.45)`,
              lineHeight: 1.5,
            }}
          >
            S6 e S12 são exclusivos da Jornada AUGE
          </div>
        </div>

        {/* Protocolo de Retomada — regras visíveis, botão bloqueado */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: C.ouro,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Protocolo de Retomada
          </div>
          <div
            style={{
              background: `rgba(255,255,255,.04)`,
              border: `1px solid ${C.ouro}12`,
              borderRadius: 10,
              padding: "14px",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 9,
                color: C.ouro,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              A regra dos 2 dias
            </div>
            {[
              "Dois dias é o limite. No terceiro, você já não é mais a mesma.",
              "Ontem não conta. Hoje conta com metade — e isso já é tudo.",
              "Não compensa. Não é hora de provar nada. É hora de voltar.",
              "O dia que você volta vale igual ao dia perfeito. Às vezes vale mais.",
            ].map((r, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 10, marginBottom: 7 }}
              >
                <div style={{ color: C.ouro, fontSize: 14, flexShrink: 0 }}>
                  ·
                </div>
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 12,
                    color: `rgba(255,255,255,.38)`,
                    lineHeight: 1.5,
                  }}
                >
                  {r}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={lock}
            style={{
              width: "100%",
              background: `rgba(255,255,255,.04)`,
              border: `1px solid ${C.ouro}15`,
              borderRadius: 50,
              padding: "13px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 13,
                color: `rgba(255,255,255,.22)`,
                letterSpacing: "0.04em",
              }}
            >
              Estou voltando agora
            </span>
            <span style={{ fontSize: 15 }}>🔒</span>
          </button>
        </div>

        {/* Espaços de escrita — abas visíveis, tudo bloqueado */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: C.ouro,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Espaços de escrita
          </div>
          <LockCard msg="Ferramentas exclusivas da Jornada AUGE">
            <div
              style={{
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}12`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  borderBottom: `1px solid ${C.ouro}10`,
                }}
              >
                {["Vitórias", "Âncora", "Porquês", "Carta"].map((lb, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      fontFamily: FB,
                      fontWeight: 300,
                      fontSize: 10,
                      color: i === 0 ? C.ouro : `rgba(255,255,255,.18)`,
                      textAlign: "center",
                      borderBottom: `2px solid ${i === 0 ? C.ouro : "transparent"}`,
                    }}
                  >
                    {lb}
                  </div>
                ))}
              </div>
              <div
                style={{
                  padding: "16px",
                  height: 68,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: FS,
                    fontStyle: "italic",
                    fontSize: 13,
                    color: `rgba(255,255,255,.12)`,
                    textAlign: "center",
                  }}
                >
                  Registre sua vitória da semana...
                </div>
              </div>
            </div>
          </LockCard>
        </div>

        {/* Calendário — grade bloqueada */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 9,
                color: C.ouro,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              Calendário das 12 semanas
            </div>
            <span style={{ fontSize: 13 }}>🔒</span>
          </div>
          <div
            onClick={lock}
            style={{
              background: `rgba(255,255,255,.04)`,
              border: `1px solid ${C.ouro}12`,
              borderRadius: 10,
              padding: "12px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 18,
                    borderRadius: 3,
                    background: `rgba(196,168,130,${i < 2 ? 0.12 : 0.05})`,
                    border: `1px solid ${C.ouro}08`,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 10,
                color: `rgba(255,255,255,.18)`,
                textAlign: "center",
              }}
            >
              Disponível na Jornada AUGE
            </div>
          </div>
        </div>

        <BtnPill
          onClick={() => {}}
          style={{ marginBottom: 10, fontSize: 13 }}
        >
          Quero entrar na Jornada AUGE
        </BtnPill>
        <BtnOut onClick={() => ir(S.HOME)} style={{ fontSize: 13 }}>
          Voltar ao início
        </BtnOut>
      </Grain>
    </div>
  );
}

// ABA: JORNADA — Vitrine (Comunidade) ou Conteúdo (Aluna)
// ═══════════════════════════════════════════════════════════════════

// Vitrine para quem é só da Comunidade
function VitJornada({ ir, onLogin }) {
  return (
    <Grain style={{ minHeight: 760, animation: "fadeUp .4s ease" }}>
      <Cab titulo="Jornada AUGE" />
      <div style={{ padding: "24px 20px 36px", textAlign: "center" }}>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 9,
            color: C.ouro,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Mentoria exclusiva
        </div>
        <div
          style={{
            fontFamily: FS,
            fontSize: 28,
            fontWeight: 300,
            color: `rgba(255,255,255,.97)`,
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          Jornada AUGE
        </div>
        <div
          style={{
            fontFamily: FS,
            fontStyle: "italic",
            fontSize: 16,
            color: C.ouro,
            marginBottom: 24,
          }}
        >
          12 semanas de transformação real
        </div>

        {/* Benefícios */}
        {[
          {
            icon: "✅",
            titulo: "Checkin diário de hábitos",
            desc: "Acompanhamento dos seus hábitos com feedback personalizado",
          },
          {
            icon: "⭕",
            titulo: "Roda AUGE",
            desc: "Autodiagnóstico em 5 dimensões da sua vida: energia, consciência, organização, autocuidado e protagonismo",
          },
          {
            icon: "🔁",
            titulo: "Protocolo de Retomada",
            desc: "Método comprovado para nunca ficar mais de 2 dias sem agir",
          },
          {
            icon: "👩‍⚕️",
            titulo: "Mentoria com a Dra. Isadora",
            desc: "Encontros semanais ao vivo com acompanhamento individual",
          },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              background: `rgba(255,255,255,.04)`,
              border: `1px solid ${C.ouro}18`,
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 10,
              textAlign: "left",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <div style={{ fontSize: 22, flexShrink: 0 }}>{b.icon}</div>
            <div>
              <div
                style={{
                  fontFamily: FS,
                  fontSize: 16,
                  fontWeight: 300,
                  color: `rgba(255,255,255,.95)`,
                  marginBottom: 3,
                }}
              >
                {b.titulo}
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 12,
                  color: `rgba(255,255,255,.92)`,
                  lineHeight: 1.5,
                }}
              >
                {b.desc}
              </div>
            </div>
          </div>
        ))}

        {/* Depoimento */}
        <div
          style={{
            borderLeft: `2px solid ${C.ouro}44`,
            padding: "14px 16px",
            margin: "20px 0",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontFamily: FS,
              fontStyle: "italic",
              fontSize: 15,
              color: `rgba(255,255,255,.92)`,
              lineHeight: 1.6,
              marginBottom: 6,
            }}
          >
            "Em 12 semanas consegui criar uma rotina que achei que nunca seria
            possível para mim."
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              color: C.ouro,
              letterSpacing: "0.2em",
            }}
          >
            — Maria, 54 anos · Florianópolis
          </div>
        </div>

        <BtnPill
          onClick={() => {}}
          style={{ marginBottom: 12 }}
        >
          Quero participar da próxima turma
        </BtnPill>
        <BtnOut onClick={() => ir(S.HOME)} style={{ fontSize: 13 }}>
          Voltar ao início
        </BtnOut>
      </div>
    </Grain>
  );
}

// Menu principal da Jornada (alunas)
function Jornada({
  sem,
  hDia,
  feitos,
  ckOk,
  anc,
  pontos,
  medC,
  historico,
  retomadas,
  ir,
}) {
  const hist = historico || {};
  const SEMANA = ["S", "T", "Q", "Q", "S", "S", "D"];
  return (
    <div style={{ animation: "fadeUp .35s ease" }}>
      <div
        style={{
          background: C.obs,
          padding: "12px 18px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${C.ouro}15`,
        }}
      >
        <div
          style={{
            fontFamily: FS,
            fontSize: 18,
            fontWeight: 300,
            letterSpacing: "0.1em",
            color: C.linho,
          }}
        >
          Jornada AUGE
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: C.ouro,
            letterSpacing: "0.2em",
          }}
        >
          S{sem} de 12
        </div>
      </div>
      <Grain style={{ padding: "16px 18px 24px" }}>
        {/* Âncora */}
        <div
          style={{
            fontFamily: FS,
            fontStyle: "italic",
            fontSize: 13,
            color: `${C.ouroLt}55`,
            lineHeight: 1.5,
            marginBottom: 16,
            borderLeft: `1px solid ${C.ouro}33`,
            paddingLeft: 12,
          }}
        >
          "{anc}"
        </div>

        {/* Protocolo de Retomada — destaque */}
        <button
          onClick={() => ir(S.RET)}
          style={{
            width: "100%",
            background: `${C.blush}15`,
            border: `1px solid ${C.blush}55`,
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 16,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: FB,
              fontWeight: 500,
              fontSize: 13,
              color: C.blush,
              letterSpacing: "0.05em",
            }}
          >
            PROTOCOLO DE RETOMADA
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 15,
              color: C.blush,
            }}
          >
            →
          </div>
        </button>

        {/* Pontos + retomadas */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              flex: 1,
              background: `rgba(255,255,255,.04)`,
              border: `1px solid ${C.ouro}15`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 9,
                color: C.ouro,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Pontos AUGE
            </div>
            <div style={{ fontFamily: FS, fontSize: 26, color: C.ouro }}>
              {pontos}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: `rgba(255,255,255,.04)`,
              border: `1px solid ${C.ouro}15`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 9,
                color: `rgba(255,255,255,.88)`,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Retomadas
            </div>
            <div style={{ fontFamily: FS, fontSize: 26, color: C.lt }}>
              {retomadas || 0}
            </div>
          </div>
        </div>

        {/* Calendário semanal */}
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 9,
            color: `rgba(255,255,255,.88)`,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Esta semana
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
          {SEMANA.map((d, i) => {
            const dia = hist[`day${i}`] || {
              feitos: 0,
              total: 1,
              retomada: false,
            };
            const cor = dia.retomada
              ? C.blush
              : dia.feitos === dia.total && dia.total > 0
                ? C.ouro
                : dia.feitos > 0
                  ? C.ouroLt
                  : "transparent";
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  aspectRatio: "1",
                  borderRadius: 6,
                  background: cor,
                  border: `1px solid ${cor === "transparent" ? C.ouro + "12" : cor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 9,
                    color:
                      cor === C.ouro
                        ? C.obs
                        : cor === C.ouroLt
                          ? C.obs2
                          : `rgba(255,255,255,.45)`,
                  }}
                >
                  {d}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 10,
            color: `rgba(255,255,255,.45)`,
            marginBottom: 18,
            lineHeight: 1.5,
          }}
        >
          Pequeno, repetido e infinito. Qualquer cor é uma vitória.
        </div>

        {/* Medalhas */}
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 9,
            color: C.ouro,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Medalhas
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {MEDALHAS.map((med) => {
            const ok = medC.includes(med.id);
            return (
              <div
                key={med.id}
                style={{
                  flex: 1,
                  background: ok ? `${med.cor}12` : `rgba(255,255,255,.02)`,
                  border: `1px solid ${ok ? med.cor + "30" : C.ouro + "10"}`,
                  borderRadius: 10,
                  padding: "10px 6px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    filter: ok ? "none" : "grayscale(1)",
                    opacity: ok ? 1 : 0.3,
                  }}
                >
                  {med.icon}
                </div>
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 9,
                    color: ok
                      ? `rgba(255,255,255,.82)`
                      : `rgba(255,255,255,.15)`,
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {med.nome}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ferramentas — SÓ conteúdo exclusivo da Jornada */}
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 9,
            color: C.ouro,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Ferramentas exclusivas
        </div>
        {[
          {
            icon: "🔁",
            tit: "Protocolo de Retomada",
            sub: "O coração do método. Onde o método AUGE se diferencia.",
            sc: S.RET,
            destaque: true,
          },
          {
            icon: "⭕",
            tit: "Roda AUGE",
            sub: "Autodiagnóstico das 5 dimensões · 25 perguntas",
            sc: S.RODA,
          },

          {
            icon: "✍️",
            tit: "Espaços de escrita",
            sub: "Vitórias, Âncora, Porquês e Carta para o Futuro",
            sc: S.ESC,
          },
        ].map((item) => (
          <div
            key={item.sc}
            onClick={() => ir(item.sc)}
            style={{
              background: item.destaque
                ? `${C.blush}08`
                : `rgba(255,255,255,.04)`,
              border: `1px solid ${item.destaque ? C.blush + "33" : C.ouro + "12"}`,
              borderRadius: 10,
              padding: item.destaque ? "16px 15px" : "13px 15px",
              marginBottom: 9,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 13,
            }}
          >
            <div style={{ fontSize: item.destaque ? 24 : 20, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: FS,
                  fontSize: item.destaque ? 17 : 16,
                  fontWeight: 300,
                  color: item.destaque ? C.blush : `rgba(255,255,255,.95)`,
                  marginBottom: 3,
                }}
              >
                {item.tit}
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 11,
                  color: item.destaque
                    ? `rgba(226,185,168,.45)`
                    : `rgba(255,255,255,.88)`,
                  lineHeight: 1.4,
                }}
              >
                {item.sub}
              </div>
            </div>
            <div
              style={{
                color: item.destaque ? C.blush : `rgba(255,255,255,.45)`,
                fontSize: 16,
              }}
            >
              ›
            </div>
          </div>
        ))}
      </Grain>
    </div>
  );
}

// ─── RODA AUGE ────────────────────────────────────────────────────────────────
function Roda({
  rodaR,
  setRodaR,
  rodaI,
  setRodaI,
  calcRoda,
  zc,
  zl,
  back,
  tk,
  perfil,
  dataCadastro,
  rodaResultados = [],
}) {
  const [fase, setFase] = useState("intro");
  const [momento, setMom] = useState(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const perg = RODA_Q[rodaI];
  const opts = perg?.tipo === "f" ? OFREQ : OCONC;

  const resp = (v) => {
    setRodaR((r) => ({ ...r, [perg.id]: v }));
    if (rodaI < 24) setRodaI((i) => i + 1);
    else setFase("resultado");
  };

  useEffect(() => {
    if (fase !== "resultado" || !canvasRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
    const notas = calcRoda();
    const data = DIMS.map((d) => (notas[d] === null ? 0 : notas[d]));
    const draw = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !window.Chart) return;
      chartRef.current = new window.Chart(ctx, {
        type: "radar",
        data: {
          labels: DIMS,
          datasets: [
            {
              data,
              backgroundColor: "rgba(196,168,130,0.12)",
              borderColor: "#C4A882",
              borderWidth: 1.5,
              pointBackgroundColor: "#C4A882",
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: false,
          scales: {
            r: {
              min: 0,
              max: 10,
              ticks: { display: false },
              grid: { color: "rgba(90,75,67,0.3)" },
              angleLines: { color: "rgba(90,75,67,0.3)" },
              pointLabels: {
                color: "rgba(240,233,218,0.6)",
                font: { size: 10, family: "sans-serif" },
              },
            },
          },
          plugins: { legend: { display: false } },
        },
      });
    };
    if (window.Chart) {
      draw();
    } else {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
      s.onload = draw;
      document.head.appendChild(s);
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [fase]);

  if (fase === "intro")
    return (
      <Grain style={{ minHeight: 760, animation: "fadeUp .4s ease" }}>
        <Cab titulo="Roda AUGE" voltar={back} />
        <div style={{ padding: "24px 20px 36px", textAlign: "center" }}>
          <Logo width={130} fundo="escuro" />
          <div
            style={{
              fontFamily: FS,
              fontSize: 36,
              fontWeight: 300,
              letterSpacing: "0.12em",
              color: C.ouro,
              marginTop: 10,
              marginBottom: 4,
            }}
          >
            RODA
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: `rgba(255,255,255,.88)`,
              marginBottom: 24,
            }}
          >
            AUGE · 25 perguntas · 5 dimensões
          </div>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: `rgba(255,255,255,.88)`,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Selecione o momento
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 6,
              marginBottom: 28,
            }}
          >
            {[
              ["S1", "Início"],
              ["S6", "Meio"],
              ["S12", "Fim"],
            ].map(([m, sub]) => {
              const bloqMom = false; // demo: todas as semanas desbloqueadas
              return (
                <button
                  key={m}
                  onClick={() => (bloqMom ? null : setMom(m))}
                  style={{
                    background: bloqMom
                      ? `rgba(255,255,255,.03)`
                      : momento === m
                        ? `${C.ouro}22`
                        : `rgba(255,255,255,.04)`,
                    border: `1px solid ${bloqMom ? C.ouro + "0A" : momento === m ? C.ouro + "55" : C.ouro + "15"}`,
                    borderRadius: 10,
                    padding: "14px 0",
                    cursor: bloqMom ? "default" : "pointer",
                    color: bloqMom
                      ? `rgba(255,255,255,.18)`
                      : momento === m
                        ? C.ouro
                        : `rgba(255,255,255,.88)`,
                    fontFamily: FB,
                    fontSize: 12,
                    letterSpacing: "0.2em",
                    position: "relative",
                  }}
                >
                  {bloqMom && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 8,
                        fontSize: 10,
                      }}
                    >
                      🔒
                    </span>
                  )}
                  {m}
                  <br />
                  <span style={{ fontSize: 9, opacity: 0.6 }}>{sub}</span>
                </button>
              );
            })}
          </div>
          <BtnPill
            onClick={() => {
              if (momento) {
                const saved = rodaResultados.find((r) => r.momento === momento);
                if (saved?.respostas) {
                  setRodaR(saved.respostas);
                  setRodaI(24);
                  setFase("resultado");
                } else {
                  setRodaR({});
                  setRodaI(0);
                  setFase("perguntas");
                }
              }
            }}
            style={{ opacity: momento ? 1 : 0.4 }}
          >
            {momento && rodaResultados.find((r) => r.momento === momento) ? "Ver resultado" : "Iniciar diagnóstico"}
          </BtnPill>
        </div>
      </Grain>
    );

  if (fase === "perguntas" && perg) {
    const posInDim =
      RODA_Q.filter((p, i) => i < rodaI && p.dim === perg.dim).length + 1;
    const skipTxt =
      perg.tipo === "f"
        ? "Isso não faz parte da minha rotina"
        : "Não consigo avaliar agora";
    return (
      <Grain style={{ minHeight: 760, animation: "fadeUp .35s ease" }}>
        <div style={{ padding: "1.5rem 1.25rem" }}>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: C.ouro,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            <span>{perg.dim}</span>
            <span style={{ opacity: 0.4 }}> · </span>
            <span>{posInDim} de 5</span>
            <span style={{ opacity: 0.4, margin: "0 .4em" }}>·</span>
            <span style={{ color: `rgba(255,255,255,.88)` }}>
              {rodaI + 1} / 25
            </span>
          </div>
          <div
            style={{
              height: 2,
              background: `rgba(255,255,255,.08)`,
              borderRadius: 100,
              marginBottom: "1.5rem",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                background: C.ouro,
                borderRadius: 100,
                width: `${(rodaI / 25) * 100}%`,
                transition: "width .3s",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: FS,
              fontSize: 20,
              fontWeight: 300,
              color: `rgba(255,255,255,.97)`,
              lineHeight: 1.6,
              marginBottom: "2rem",
              minHeight: 80,
            }}
          >
            {perg.q}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {opts.map((op, i) => (
              <button
                key={i}
                onClick={() => resp(op.v)}
                style={{
                  background: `rgba(255,255,255,.05)`,
                  border: `1px solid ${C.ouro}15`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: FB,
                  fontSize: 14,
                  color: `rgba(255,255,255,.88)`,
                  lineHeight: 1.4,
                }}
              >
                {op.l}
              </button>
            ))}
          </div>
          <button
            onClick={() => resp(null)}
            style={{
              background: "transparent",
              border: "none",
              color: `rgba(255,255,255,.82)`,
              fontFamily: FB,
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "0.7rem",
              cursor: "pointer",
              width: "100%",
              textAlign: "center",
              marginTop: "0.75rem",
            }}
          >
            {skipTxt}
          </button>
        </div>
      </Grain>
    );
  }

  const notas = calcRoda();
  const vals = Object.values(notas).filter((v) => v !== null);
  const ind = vals.length
    ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
    : null;
  const z =
    ind !== null
      ? ind <= 3.9
        ? { l: "Zona de Atenção", c: C.atencao }
        : ind <= 6.9
          ? { l: "Zona de Desenvolvimento", c: C.dev }
          : { l: "Zona de Auge", c: C.augeZ }
      : null;
  return (
    <Grain style={{ minHeight: 760, animation: "fadeUp .4s ease" }}>
      <Cab titulo="Resultado" voltar={back} />
      <div style={{ padding: "1.5rem 1.25rem" }}>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 9,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: `rgba(255,255,255,.88)`,
            textAlign: "center",
            marginBottom: "0.5rem",
          }}
        >
          Resultado · {momento}
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 300,
            color: C.ouro,
            textAlign: "center",
            lineHeight: 1,
            fontFamily: FS,
          }}
        >
          {ind !== null ? ind.toFixed(1) : "—"}
        </div>
        {z && (
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              textAlign: "center",
              marginTop: "0.3rem",
              color: z.c,
            }}
          >
            {z.l}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "1.5rem 0",
          }}
        >
          <canvas ref={canvasRef} width={260} height={260} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: "1.5rem",
          }}
        >
          {DIMS.map((d) => {
            const n = notas[d];
            const dc =
              n === null
                ? { c: `rgba(255,255,255,.45)` }
                : n <= 3.9
                  ? { c: C.atencao }
                  : n <= 6.9
                    ? { c: C.ouroDk }
                    : { c: C.ouro };
            return (
              <div
                key={d}
                style={{
                  background: `rgba(255,255,255,.04)`,
                  border: `1px solid ${C.ouro}12`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: FB,
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: `rgba(255,255,255,.4)`,
                  }}
                >
                  {d}
                </span>
                <span style={{ fontFamily: FS, fontSize: 18, color: dc.c }}>
                  {n === null ? "—" : n.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            borderLeft: `1px solid ${C.ouro}44`,
            padding: "0.9rem 1rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 300,
              fontStyle: "italic",
              color: `rgba(255,255,255,.88)`,
              lineHeight: 1.6,
              fontFamily: FS,
            }}
          >
            "O auge não é o que você foi. É o que você está construindo."
          </p>
        </div>
        <BtnPill
          onClick={() => {
            const notas = calcRoda();
            const vals = Object.values(notas).filter((v) => v !== null);
            const indice = vals.length
              ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
              : 0;
            syncInsert("roda_auge", {
              momento: momento || "S1",
              data: new Date().toISOString().split("T")[0],
              respostas: rodaR,
              nota_energia: notas["Energia"] ?? null,
              nota_consciencia: notas["Consciência"] ?? null,
              nota_organizacao: notas["Organização"] ?? null,
              nota_autocuidado: notas["Autocuidado"] ?? null,
              nota_protagonismo: notas["Protagonismo"] ?? null,
              indice_auge: indice,
            });
            tk("Roda salva! Repita na semana 6 e 12 💖");
            back();
          }}
        >
          Salvar resultado
        </BtnPill>
        <BtnOut
          onClick={() => {
            setFase("intro");
            setMom(null);
            setRodaR({});
            setRodaI(0);
          }}
          style={{ marginTop: 10 }}
        >
          Fazer novamente
        </BtnOut>
      </div>
    </Grain>
  );
}

// ─── RETOMADA ─────────────────────────────────────────────────────────────────
function Retomada({ anc, back, tk, setRet, pq1, pq2, pq3, usuario }) {
  const [mot, setMot] = useState("");
  const [onde, setOnde] = useState("");
  const [p, setP] = useState(1);
  const [isaMsg, setIsaMsg] = useState(null);
  const [isaLoad, setIsaLoad] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  const registrar = async () => {
    setRet((r) => r + 1);
    const hoje = new Date().toISOString().split("T")[0];
    syncDB(
      "checkins",
      {
        data: hoje,
        total_feitos: 0,
        total: 0,
        percentual: 0,
        retomada: true,
        chips: [],
      },
      { onConflict: "user_id,data" },
    );
    tk("Retomada registrada. +20 pontos AUGE 💖");
    setRegistrado(true);
    setIsaLoad(true);
    const motTxt = mot.trim() ? `"${mot.trim()}"` : "não descreveu";
    const porquesRet = [pq1, pq2, pq3].filter(Boolean);
    const nomeRet = usuario?.nome ? usuario.nome.split(" ")[0] : null;
    const resp = await callISA(
      [
        `A aluna acabou de ativar o Protocolo de Retomada — clicou em "Estou voltando agora".`,
        nomeRet ? `Nome dela: ${nomeRet}.` : null,
        `O que aconteceu segundo ela: ${motTxt}.`,
        `Onde ela disse que quebrou: ${onde || "não especificou"}.`,
        `Âncora de identidade dela: "${anc}".`,
        porquesRet.length > 0 ? `Os porquês dela: ${porquesRet.join(" / ")}.` : null,
        `Acolha o que ela compartilhou diretamente, sem generalizar. Convoque ao movimento com a energia do método: acolhe e chama. Conecte aos porquês dela se existirem. Termine com a frase da marca se fizer sentido natural: "O auge não é o que você foi. É o que você está construindo."`,
      ].filter(Boolean).join("\n"),
    );
    setIsaMsg(resp);
    setIsaLoad(false);
  };
  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      <Cab titulo="Protocolo de Retomada" voltar={back} />
      <Grain style={{ padding: "20px 20px 36px" }}>
        <div
          style={{
            fontFamily: FS,
            fontSize: 24,
            fontWeight: 300,
            color: `rgba(255,255,255,.97)`,
            lineHeight: 1.25,
            marginBottom: 16,
          }}
        >
          Caiu. Faz parte.
          <br />
          Agora você volta.
        </div>
        <div
          style={{
            background: `${C.ouro}10`,
            border: `1px solid ${C.ouro}20`,
            borderRadius: 10,
            padding: "15px",
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: FS,
              fontStyle: "italic",
              fontSize: 16,
              color: C.ouro,
              lineHeight: 1.5,
            }}
          >
            "{anc}"
          </div>
        </div>
        <div
          style={{
            background: `rgba(255,255,255,.04)`,
            border: `1px solid ${C.ouro}12`,
            borderRadius: 10,
            padding: "15px",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: C.ouro,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            A regra dos 2 dias
          </div>
          {[
            "Dois dias é o limite. No terceiro, você já não é mais a mesma.",
            "Ontem não conta. Hoje conta com metade — e isso já é tudo.",
            "Não compensa. Não é hora de provar nada. É hora de voltar.",
            "O dia que você volta vale igual ao dia perfeito. Às vezes vale mais.",
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ color: C.ouro, fontSize: 15, flexShrink: 0 }}>
                ·
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 13,
                  color: `rgba(255,255,255,.4)`,
                  lineHeight: 1.5,
                }}
              >
                {r}
              </div>
            </div>
          ))}
        </div>
        {p >= 1 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.92)`,
                marginBottom: 8,
              }}
            >
              O que aconteceu?
            </div>
            <textarea
              value={mot}
              onChange={(e) => setMot(e.target.value)}
              placeholder="Sem julgamento. E sem rodeio. Escreve curto, pra você ver com clareza."
              style={{
                width: "100%",
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}15`,
                borderRadius: 10,
                padding: "12px",
                fontSize: 14,
                fontFamily: FS,
                color: `rgba(255,255,255,.82)`,
                resize: "none",
                height: 76,
                lineHeight: 1.6,
              }}
            />
          </div>
        )}
        {p >= 2 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.92)`,
                marginBottom: 8,
              }}
            >
              Onde quebrou?
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                "Falta de tempo",
                "Cansaço",
                "Imprevisto",
                "Esqueci",
                "Outro",
              ].map((op) => (
                <button
                  key={op}
                  onClick={() => setOnde(op)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 50,
                    border: `1px solid ${onde === op ? C.ouro + "55" : C.ouro + "15"}`,
                    background:
                      onde === op ? `${C.ouro}20` : `rgba(255,255,255,.03)`,
                    color: onde === op ? C.ouro : `rgba(255,255,255,.88)`,
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        )}
        {p === 1 && (
          <BtnPill
            onClick={() => mot && setP(2)}
            style={{ opacity: mot ? 1 : 0.4 }}
          >
            Continuar
          </BtnPill>
        )}
        {p >= 2 && (
          <div>
            <div
              style={{
                background: `${C.ouroLt}10`,
                border: `1px solid ${C.ouro}25`,
                borderRadius: 10,
                padding: "14px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 9,
                  color: C.ouro,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Com o que você volta hoje?
              </div>
              <div
                style={{
                  fontFamily: FS,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: `rgba(255,255,255,.88)`,
                  lineHeight: 1.6,
                }}
              >
                5 minutos de movimento. Uma refeição no horário. Um copo de
                água. Isso conta.
              </div>
            </div>
            {!registrado && (
              <BtnPill onClick={registrar}>Estou voltando agora</BtnPill>
            )}
            {(isaLoad || isaMsg) && <IsaCard text={isaMsg} loading={isaLoad} />}
            {registrado && !isaLoad && (
              <>
              <p
                style={{
                  fontFamily: FS,
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: C.ouro,
                  lineHeight: 1.6,
                  marginTop: 14,
                  textAlign: 'center',
                }}
              >
                "O auge não é o que você foi. É o que você está construindo."
              </p>
                <BtnPill onClick={back} style={{ marginTop: 16 }}>
                  Concluir ←
                </BtnPill>
              </>
            )}
          </div>
        )}
      </Grain>
    </div>
  );
}

// ─── CALENDÁRIO ───────────────────────────────────────────────────────────────
function Calendario({ back, historico, dataCadastro }) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const nomeMes = hoje.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const rdCor = (dataStr) => {
    const d = historico[dataStr];
    if (!d) return { bg: "transparent", tc: `rgba(255,255,255,.45)`, bo: `1px solid ${C.ouro}10` };
    if (d.retomada) return { bg: `${C.blush}40`, tc: C.blush, bo: "none" };
    if (d.total > 0 && d.feitos === d.total) return { bg: C.ouro, tc: C.obs, bo: "none" };
    if (d.feitos > 0) return { bg: `${C.ouroLt}30`, tc: C.ouroDk, bo: `1.5px solid ${C.ouro}` };
    return { bg: "transparent", tc: `rgba(255,255,255,.45)`, bo: `1px solid ${C.ouro}10` };
  };

  // Barras de semanas baseadas em checkins reais
  const semanas = dataCadastro ? Array.from({ length: 12 }, (_, s) => {
    const ini = new Date(dataCadastro);
    ini.setDate(ini.getDate() + s * 7);
    let dias = 0, feitos = 0;
    for (let d = 0; d < 7; d++) {
      const dt = new Date(ini);
      dt.setDate(dt.getDate() + d);
      const k = dt.toISOString().split("T")[0];
      if (historico[k]) { dias++; if (historico[k].feitos > 0 || historico[k].retomada) feitos++; }
    }
    return dias > 0 ? feitos / dias : 0;
  }) : Array(12).fill(0);

  const todayStr = hoje.toISOString().split("T")[0];

  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      <Cab titulo="Meu progresso" voltar={back} />
      <Grain style={{ padding: "18px 18px 32px" }}>
        <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 9, color: C.ouro, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 12 }}>
          As 12 semanas
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 22, alignItems: "flex-end" }}>
          {semanas.map((pct, i) => {
            const h = Math.max(6, Math.round(pct * 42));
            const op = pct === 0 ? 0.12 : 0.3 + pct * 0.7;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: "100%", background: `rgba(196,168,130,${op})`, borderRadius: 4, height: h }} />
                <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 8, color: `rgba(255,255,255,.82)` }}>{i + 1}</div>
              </div>
            );
          })}
        </div>

        <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 9, color: C.ouro, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 12 }}>
          {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 16 }}>
          {["D","S","T","Q","Q","S","S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontFamily: FB, fontWeight: 300, fontSize: 9, color: `rgba(255,255,255,.82)`, padding: "2px 0" }}>{d}</div>
          ))}
          {Array.from({ length: primeiroDia }, (_, i) => <div key={"e" + i} />)}
          {Array.from({ length: diasNoMes }, (_, i) => {
            const dia = i + 1;
            const dataStr = `${ano}-${String(mes + 1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
            const { bg, tc, bo } = rdCor(dataStr);
            const isHoje = dataStr === todayStr;
            return (
              <div key={dia} style={{
                aspectRatio: "1", borderRadius: 7,
                background: bg, border: isHoje ? `2px solid ${C.ouro}` : (bo || "none"),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontFamily: FS, fontWeight: 300, color: tc,
                boxShadow: isHoje ? `0 0 0 1px ${C.ouro}44` : "none",
              }}>
                {dia}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            [C.ouro, "Todos os hábitos"],
            [`${C.ouroLt}30`, "Parcial"],
            [`${C.blush}40`, "Kit / Retomada"],
            ["transparent", "Sem registro"],
          ].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: c, border: `1px solid ${C.ouro}25`, flexShrink: 0 }} />
              <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 12, color: `rgba(255,255,255,.88)` }}>{l}</div>
            </div>
          ))}
        </div>
      </Grain>
    </div>
  );
}

// ─── ESPAÇOS DE ESCRITA ───────────────────────────────────────────────────────
function Escritas({
  vit,
  setVit,
  anc,
  setAnc,
  escT,
  setEscT,
  back,
  tk,
  carta,
  setCarta,
  dataCadastro,
  pq1,
  setPq1,
  pq2,
  setPq2,
  pq3,
  setPq3,
}) {
  const [nv, setNv] = useState("");
  const [na, setNa] = useState(anc);
  const [editAnc, setEditAnc] = useState(!anc || anc === "Eu sou a mulher que volta.");
  const [editPq, setEditPq] = useState(false);
  const [isaVit, setIsaVit] = useState(null);
  const [isaVitLoad, setIsaVitLoad] = useState(false);
  const salvarVit = async () => {
    if (!nv.trim()) return;
    const d = new Date();
    const vitData = `${d.getDate()}/${d.getMonth() + 1}`;
    setVit((v) => [...v, { sem: 3, texto: nv.trim(), data: vitData }]);
    syncInsert("vitorias", { sem: 3, texto: nv.trim(), data: vitData });
    tk("Vitória registrada! 💖");
    setIsaVitLoad(true);
    setIsaVit(null);
    const resp = await callISA(
      `A aluna acabou de registrar uma vitória: "${nv.trim()}". Escreva uma resposta breve (2-3 linhas) celebrando genuinamente essa vitória. Termine sempre com: — ISA, Inteligência do Clube do Auge · Método Dra. Isadora Zaniboni`,
    );
    setIsaVit(resp);
    setIsaVitLoad(false);
    setNv("");
  };
  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      <Cab titulo="Espaços de escrita" voltar={back} />
      <Grain style={{ padding: "0 18px 24px" }}>
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${C.ouro}12`,
            marginBottom: 18,
          }}
        >
          {[
            ["vitorias", "Vitórias"],
            ["ancora", "Âncora"],
            ["porques", "Porquês"],
            ["carta", "Carta"],
          ].map(([id, lb]) => (
            <button
              key={id}
              onClick={() => setEscT(id)}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${escT === id ? C.ouro : "transparent"}`,
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 10,
                color: escT === id ? C.ouro : `rgba(255,255,255,.88)`,
                cursor: "pointer",
                transition: "all .2s",
              }}
            >
              {lb}
            </button>
          ))}
        </div>
        {escT === "vitorias" && (
          <div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.92)`,
                marginBottom: 10,
              }}
            >
              Qual foi sua vitória essa semana?
            </div>
            <textarea
              value={nv}
              onChange={(e) => setNv(e.target.value)}
              placeholder="Não existe vitória pequena demais."
              style={{
                width: "100%",
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}15`,
                borderRadius: 10,
                padding: "13px",
                fontSize: 15,
                fontFamily: FS,
                color: `rgba(255,255,255,.88)`,
                resize: "none",
                height: 110,
                lineHeight: 1.7,
                marginBottom: 12,
              }}
            />
            <BtnPill
              onClick={salvarVit}
              style={{ opacity: nv.trim() ? 1 : 0.4, marginBottom: 14 }}
            >
              Registrar vitória
            </BtnPill>
            {(isaVitLoad || isaVit) && (
              <div
                style={{
                  background: `rgba(255,255,255,.04)`,
                  border: `1px solid ${C.ouro}20`,
                  borderRadius: 12,
                  padding: "14px 15px",
                  marginBottom: 16,
                  animation: "fadeUp .3s ease",
                }}
              >
                {isaVitLoad ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    >
                      💭
                    </div>
                    <div
                      style={{
                        fontFamily: FS,
                        fontStyle: "italic",
                        fontSize: 13,
                        color: `rgba(255,255,255,.92)`,
                      }}
                    >
                      ISA está respondendo...
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      fontFamily: FB,
                      fontWeight: 300,
                      fontSize: 13,
                      color: `rgba(255,255,255,.92)`,
                      lineHeight: 1.75,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {isaVit}
                  </div>
                )}
              </div>
            )}

              <p
                style={{
                  fontFamily: FS,
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: C.ouro,
                  lineHeight: 1.6,
                  marginTop: 14,
                  textAlign: 'center',
                }}
              >
                "O auge não é o que você foi. É o que você está construindo."
              </p>
            {vit.map((v, i) => (
              <div
                key={i}
                style={{
                  borderLeft: `2px solid ${C.ouro}33`,
                  paddingLeft: 13,
                  marginBottom: 13,
                }}
              >
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 9,
                    color: C.ouro,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  Semana {v.sem} · {v.data}
                </div>
                <div
                  style={{
                    fontFamily: FS,
                    fontStyle: "italic",
                    fontSize: 14,
                    color: `rgba(255,255,255,.92)`,
                    lineHeight: 1.5,
                  }}
                >
                  {v.texto}
                </div>
              </div>
            ))}
          </div>
        )}
        {escT === "ancora" && (
          <div>
            {anc && anc !== "Eu sou a mulher que volta." && !editAnc ? (
              <div>
                <div
                  style={{
                    background: `${C.ouro}10`,
                    border: `1px solid ${C.ouro}28`,
                    borderRadius: 10,
                    padding: "26px 18px",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 9, color: C.ouro, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>
                    Minha âncora
                  </div>
                  <div style={{ fontFamily: FS, fontStyle: "italic", fontSize: 20, color: C.ouro, lineHeight: 1.5 }}>
                    "{anc}"
                  </div>
                </div>
                <button
                  onClick={() => { setNa(anc); setEditAnc(true); }}
                  style={{
                    width: "100%", background: "none",
                    border: `1px solid ${C.ouro}20`, borderRadius: 50,
                    padding: "12px", fontFamily: FB, fontWeight: 300,
                    fontSize: 12, color: `rgba(255,255,255,.88)`,
                    cursor: "pointer", letterSpacing: "0.1em",
                  }}
                >
                  Reescrever minha âncora
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 12, color: `rgba(255,255,255,.92)`, marginBottom: 12, lineHeight: 1.6 }}>
                  Escreva a frase que vai te trazer de volta nos dias difíceis.
                </div>
                <textarea
                  value={na}
                  onChange={(e) => setNa(e.target.value)}
                  placeholder="A frase que vai te trazer de volta..."
                  style={{
                    width: "100%", background: `rgba(255,255,255,.04)`,
                    border: `1px solid ${C.ouro}15`, borderRadius: 10,
                    padding: "13px", fontSize: 15, fontFamily: FS,
                    fontStyle: "italic", color: `rgba(255,255,255,.82)`,
                    resize: "none", height: 80, lineHeight: 1.6, marginBottom: 12,
                  }}
                />
                <BtnPill
                  onClick={() => {
                    if (!na.trim()) return;
                    setAnc(na);
                    syncDB("ancora", { texto: na }, { onConflict: "user_id" });
                    setEditAnc(false);
                    tk("Âncora salva 💖");
                  }}
                  style={{ opacity: na.trim() ? 1 : 0.4 }}
                >
                  Salvar minha âncora
                </BtnPill>
              </div>
            )}
          </div>
        )}
        {escT === "porques" && (
          <div>
            {pq1 && pq2 && pq3 && !editPq ? (
              <div>
                <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 9, color: `rgba(255,255,255,.82)`, lineHeight: 1.6, marginBottom: 16 }}>
                  Essas respostas são só suas. Ninguém mais acessa.
                </div>
                {[
                  ["Por que isso importa para você de verdade?", pq1],
                  ["O que você está perdendo hoje por estar onde está?", pq2],
                  ["Como você quer se sentir daqui a 5 anos?", pq3],
                ].map(([q, v], i) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <div style={{ fontFamily: FS, fontStyle: "italic", fontSize: 14, color: `rgba(255,255,255,.45)`, lineHeight: 1.5, marginBottom: 8 }}>{q}</div>
                    <div style={{ background: `rgba(255,255,255,.04)`, border: `1px solid ${C.ouro}12`, borderRadius: 10, padding: "13px 14px", fontFamily: FS, fontSize: 15, color: `rgba(255,255,255,.92)`, lineHeight: 1.6 }}>
                      {v}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setEditPq(true)}
                  style={{
                    width: "100%", background: "none",
                    border: `1px solid ${C.ouro}20`, borderRadius: 50,
                    padding: "12px", fontFamily: FB, fontWeight: 300,
                    fontSize: 12, color: `rgba(255,255,255,.88)`,
                    cursor: "pointer", letterSpacing: "0.1em", marginTop: 4,
                  }}
                >
                  Reescrever meus porquês
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 12, color: `rgba(255,255,255,.82)`, lineHeight: 1.7, marginBottom: 16 }}>
                  Essas respostas são só suas. Ninguém mais acessa.
                </div>
                {[
                  ["Por que isso importa para você de verdade?", pq1, setPq1],
                  ["O que você está perdendo hoje por estar onde está?", pq2, setPq2],
                  ["Como você quer se sentir daqui a 5 anos?", pq3, setPq3],
                ].map(([q, v, s], i) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <div style={{ fontFamily: FS, fontStyle: "italic", fontSize: 15, color: `rgba(255,255,255,.92)`, lineHeight: 1.5, marginBottom: 8 }}>{q}</div>
                    <textarea
                      value={v}
                      onChange={(e) => s(e.target.value)}
                      placeholder="Escreva com honestidade..."
                      style={{ width: "100%", background: `rgba(255,255,255,.04)`, border: `1px solid ${C.ouro}12`, borderRadius: 10, padding: "11px 12px", fontSize: 14, fontFamily: FS, color: `rgba(255,255,255,.92)`, resize: "none", height: 80, lineHeight: 1.6 }}
                    />
                  </div>
                ))}
                <BtnPill
                  onClick={() => {
                    if (!pq1 || !pq2 || !pq3) return;
                    syncDB("porques", { p1: pq1, p2: pq2, p3: pq3 }, { onConflict: "user_id" });
                    setEditPq(false);
                    tk("Porquês salvos 💖");
                  }}
                  style={{ opacity: pq1 && pq2 && pq3 ? 1 : 0.4 }}
                >
                  Salvar meus porquês
                </BtnPill>
              </div>
            )}
          </div>
        )}
        {escT === "carta" && (
          <div style={{ paddingTop: 4 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 26 }}>✉️</div>
              <div>
                <div
                  style={{
                    fontFamily: FS,
                    fontSize: 18,
                    fontWeight: 300,
                    color: `rgba(255,255,255,.95)`,
                  }}
                >
                  Carta para o Futuro
                </div>
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 11,
                    color: `rgba(255,255,255,.88)`,
                    marginTop: 2,
                  }}
                >
                  Aberta na Semana 12
                </div>
              </div>
            </div>
            {carta ? (
              <div>
                {(() => {
                  const semAtual = dataCadastro
                    ? Math.min(
                        12,
                        Math.max(
                          1,
                          Math.ceil(
                            (Date.now() - dataCadastro.getTime()) /
                              (7 * 24 * 60 * 60 * 1000),
                          ),
                        ),
                      )
                    : 1;
                  const isS12 = semAtual >= 12;
                  return (
                    <>
                      <div
                        style={{
                          fontFamily: FB,
                          fontWeight: 300,
                          fontSize: 9,
                          color: C.ouro,
                          letterSpacing: "0.3em",
                          textTransform: "uppercase",
                          marginBottom: 8,
                        }}
                      >
                        Escrita em {carta.data}
                      </div>
                      <div
                        style={{
                          background: `rgba(255,255,255,.04)`,
                          border: `1px solid ${C.ouro}18`,
                          borderRadius: 10,
                          padding: "16px",
                          marginBottom: isS12 ? 0 : 16,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: FS,
                            fontSize: 14,
                            color: `rgba(255,255,255,.82)`,
                            lineHeight: 1.8,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {carta.texto}
                        </div>
                      </div>
                      {isS12 && (
                        <div
                          style={{
                            marginTop: 16,
                            marginBottom: 16,
                            animation: "fadeUp .5s ease",
                          }}
                        >
                          <div
                            style={{
                              borderLeft: `1px solid ${C.ouro}`,
                              padding: "14px 16px",
                              marginBottom: 12,
                            }}
                          >
                            <p
                              style={{
                                fontFamily: FS,
                                fontStyle: "italic",
                                fontSize: 15,
                                color: C.ouro,
                                lineHeight: 1.6,
                                margin: 0,
                              }}
                            >
                              "O auge não é o que você foi. É o que você está
                              construindo."
                            </p>
                          </div>
                          <div
                            style={{
                              background: `${C.ouro}08`,
                              border: `1px solid ${C.ouro}22`,
                              borderRadius: 10,
                              padding: "16px 18px",
                            }}
                          >
                            <div
                              style={{
                                fontFamily: FB,
                                fontWeight: 300,
                                fontSize: 14,
                                color: `rgba(255,255,255,.92)`,
                                lineHeight: 1.7,
                                marginBottom: 10,
                              }}
                            >
                              Você chegou. 12 semanas de protagonismo. Isso é o
                              seu auge. 💖
                            </div>
                            <div
                              style={{
                                fontFamily: FS,
                                fontStyle: "italic",
                                fontSize: 12,
                                color: C.ouro,
                                letterSpacing: "0.04em",
                              }}
                            >
                              — ISA, Inteligência do Clube do Auge · Método Dra.
                              Isadora Zaniboni
                            </div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => setCarta(null)}
                        style={{
                          background: "none",
                          border: `1px solid ${C.ouro}15`,
                          borderRadius: 50,
                          padding: "10px",
                          width: "100%",
                          fontFamily: FB,
                          fontWeight: 300,
                          fontSize: 11,
                          color: `rgba(255,255,255,.82)`,
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Reescrever minha carta
                      </button>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 12,
                    color: `rgba(255,255,255,.88)`,
                    lineHeight: 1.7,
                    marginBottom: 16,
                  }}
                >
                  Escreva para você mesma. Ninguém mais lê. Na Semana 12, um
                  aviso especial vai aparecer na tela inicial convidando você a
                  abrir.
                </div>
                <CartaEditor setCarta={setCarta} tk={tk} />
              </div>
            )}
          </div>
        )}
      </Grain>
    </div>
  );
}

// ─── KIT DE EMERGÊNCIA ────────────────────────────────────────────────────────
function Emergencia({
  anc,
  kitMin,
  setKitMin,
  kitApoio,
  setKitApoio,
  back,
  tk,
}) {
  const [edit, setEdit] = useState(false);
  const [tm, setTm] = useState(kitMin);
  const [ta, setTa] = useState(kitApoio);
  const naoTem = !kitMin;
  const [isaMsg, setIsaMsg] = useState(null);
  const [isaLoad, setIsaLoad] = useState(false);
  useEffect(() => {
    if (!naoTem && !edit) {
      setIsaLoad(true);
      const minTxt = kitMin || "não definiu";
      const apoioTxt = kitApoio || "não definiu";
      callISA(
        `A aluna está no limite hoje e abriu o kit de emergência.\nÂncora de identidade dela: "${anc}"\nO mínimo viável que ela mesma definiu: "${minTxt}"\nOnde ela busca apoio: "${apoioTxt}"\nResponda com apoio suave. Encoraje ela a fazer exatamente o mínimo que ela mesma definiu — não sugira mais, não expanda. O kit é dela. Valide a sabedoria dela em ter criado esse kit. Máximo 3 parágrafos.`,
      ).then((r) => {
        setIsaMsg(r);
        setIsaLoad(false);
      });
    }
  }, []);
  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      <div
        style={{
          background: `${C.blush}18`,
          padding: "20px 20px 22px",
          borderBottom: `1px solid ${C.blush}25`,
        }}
      >
        <button
          onClick={back}
          style={{
            background: "none",
            border: "none",
            color: C.blush,
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          ← Jornada
        </button>
        <div
          style={{
            fontFamily: FS,
            fontSize: 24,
            fontWeight: 300,
            color: `rgba(255,255,255,.97)`,
            lineHeight: 1.2,
          }}
        >
          Kit de Emergência
        </div>
        <div
          style={{
            fontFamily: FS,
            fontStyle: "italic",
            fontSize: 14,
            color: C.blush,
            marginTop: 4,
          }}
        >
          O mínimo possível para voltar a se mover. Hoje.
        </div>
      </div>
      <Grain style={{ padding: "18px 20px 36px" }}>
        <div
          style={{
            background: `${C.ouro}10`,
            border: `1px solid ${C.ouro}18`,
            borderRadius: 10,
            padding: "16px",
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: FS,
              fontStyle: "italic",
              fontSize: 17,
              color: C.ouro,
              lineHeight: 1.5,
            }}
          >
            "{anc}"
          </div>
        </div>
        {naoTem && !edit ? (
          <div>
            <div
              style={{
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}12`,
                borderRadius: 10,
                padding: "16px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 9,
                  color: C.ouro,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Seu kit ainda não foi criado
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 13,
                  color: `rgba(255,255,255,.4)`,
                  lineHeight: 1.7,
                }}
              >
                O Kit de Emergência é construído com a Dra. Isadora na sua
                sessão individual. Cada kit é único — feito para a sua vida
                real.
              </div>
            </div>
            <BtnPill onClick={() => setEdit(true)}>
              Adicionar meu kit agora
            </BtnPill>
          </div>
        ) : edit ? (
          <div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.92)`,
                marginBottom: 6,
              }}
            >
              Qual é o seu mínimo viável?
            </div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 10,
                color: `rgba(255,255,255,.45)`,
                marginBottom: 10,
                lineHeight: 1.6,
              }}
            >
              Tão pequeno que consegue fazer mesmo no pior dia.
            </div>
            <textarea
              value={tm}
              onChange={(e) => setTm(e.target.value)}
              placeholder="Ex: 10 minutos de caminhada antes do café"
              style={{
                width: "100%",
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}15`,
                borderRadius: 10,
                padding: "11px",
                fontSize: 14,
                fontFamily: FS,
                color: `rgba(255,255,255,.82)`,
                resize: "none",
                height: 76,
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            />
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.92)`,
                marginBottom: 6,
              }}
            >
              Onde você busca apoio?
            </div>
            <textarea
              value={ta}
              onChange={(e) => setTa(e.target.value)}
              placeholder="Ex: Ligo para minha irmã / Leio minha âncora"
              style={{
                width: "100%",
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}15`,
                borderRadius: 10,
                padding: "11px",
                fontSize: 14,
                fontFamily: FS,
                color: `rgba(255,255,255,.82)`,
                resize: "none",
                height: 76,
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            />
            <BtnPill
              onClick={() => {
                setKitMin(tm);
                setKitApoio(ta);
                syncDB("kit_emergencia", { min_viavel: tm, onde_apoio: ta }, { onConflict: "user_id" });
                setEdit(false);
                tk("Kit salvo 💖");
              }}
              style={{ opacity: tm.trim() ? 1 : 0.4, marginBottom: 10 }}
            >
              Salvar meu kit
            </BtnPill>
            <button
              onClick={() => setEdit(false)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: `rgba(255,255,255,.45)`,
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 9,
                color: C.ouro,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Meu mínimo viável
            </div>
            <div
              style={{
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}12`,
                borderRadius: 10,
                padding: "14px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: FS,
                  fontSize: 16,
                  color: `rgba(255,255,255,.88)`,
                  lineHeight: 1.6,
                }}
              >
                {kitMin}
              </div>
            </div>
            {kitApoio && (
              <>
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 9,
                    color: C.ouro,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Onde busco apoio
                </div>
                <div
                  style={{
                    background: `rgba(255,255,255,.04)`,
                    border: `1px solid ${C.ouro}12`,
                    borderRadius: 10,
                    padding: "14px",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FS,
                      fontSize: 16,
                      color: `rgba(255,255,255,.88)`,
                      lineHeight: 1.6,
                    }}
                  >
                    {kitApoio}
                  </div>
                </div>
              </>
            )}
            {(isaLoad || isaMsg) && <IsaCard text={isaMsg} loading={isaLoad} />}
            <div
              style={{
                background: `${C.ouroLt}10`,
                border: `1px solid ${C.ouro}20`,
                borderRadius: 10,
                padding: "13px",
                marginBottom: 18,
                textAlign: "center",
                marginTop: isaMsg || isaLoad ? 12 : 0,
              }}
            >
              <div
                style={{
                  fontFamily: FS,
                  fontStyle: "italic",
                  fontSize: 15,
                  color: C.ouro,
                  lineHeight: 1.6,
                }}
              >
                "Isso conta. Isso já é o auge de hoje."
              </div>
            </div>
            <BtnPill
              onClick={() => {
                tk("Registrado. Você apareceu hoje 💖");
                back();
              }}
              style={{ marginBottom: 10 }}
            >
              Registrar meu kit de hoje
            </BtnPill>
            <button
              onClick={() => {
                setTm(kitMin);
                setTa(kitApoio);
                setEdit(true);
              }}
              style={{
                width: "100%",
                background: "none",
                border: `1px solid ${C.ouro}15`,
                borderRadius: 50,
                padding: "11px",
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.82)`,
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              Editar meu kit
            </button>
          </div>
        )}
      </Grain>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABA: CONTEÚDO — categorias por tipo
// ═══════════════════════════════════════════════════════════════════
const CATS = [
  {
    id: "yoga",
    icon: "🧘",
    label: "Yoga e meditação",
    lock: false,
    cor: "#1E2E2A",
  },
  { id: "nutri", icon: "🥗", label: "Nutrição", lock: false, cor: "#1E2820" },
  {
    id: "podcast",
    icon: "🎙️",
    label: "Podcast com a Isa",
    lock: false,
    cor: "#252028",
  },
  {
    id: "convid",
    icon: "👥",
    label: "Convidadas",
    lock: false,
    cor: "#1E252E",
  },
  {
    id: "jornada",
    icon: "📽️",
    label: "Jornada ao vivo",
    lock: true,
    cor: "#2E2018",
  },
];

const VIDS = {
  yoga: [
    {
      id: 1,
      titulo: "Flow matinal — 30 min",
      sub: "Com Fernanda · Yoga",
      dur: "32 min",
    },
    {
      id: 2,
      titulo: "Yoga restaurativa",
      sub: "Com Fernanda · Yoga",
      dur: "28 min",
    },
    {
      id: 3,
      titulo: "Meditação para dormir",
      sub: "Com Fernanda · Meditação",
      dur: "15 min",
    },
    {
      id: 4,
      titulo: "Respiração e equilíbrio",
      sub: "Com Fernanda · Yoga",
      dur: "20 min",
    },
  ],
  nutri: [
    {
      id: 5,
      titulo: "Proteína no dia a dia",
      sub: "Dra. Ana · Nutrição",
      dur: "22 min",
    },
    {
      id: 6,
      titulo: "Como montar seu prato",
      sub: "Dra. Ana · Nutrição",
      dur: "18 min",
    },
    {
      id: 7,
      titulo: "Hidratação e energia",
      sub: "Dra. Ana · Nutrição",
      dur: "14 min",
    },
  ],
  podcast: [
    {
      id: 8,
      titulo: "A regra dos 2 dias",
      sub: "Dra. Isadora · Método",
      dur: "15 min",
    },
    {
      id: 9,
      titulo: "Por que você sabota",
      sub: "Dra. Isadora · Método",
      dur: "20 min",
    },
    {
      id: 10,
      titulo: "Protagonismo aos 40+",
      sub: "Dra. Isadora · Método",
      dur: "18 min",
    },
    {
      id: 11,
      titulo: "O que muda no corpo depois dos 40",
      sub: "Dra. Isadora · Fisiologia",
      dur: "22 min",
    },
  ],
  convid: [
    {
      id: 12,
      titulo: "Sono e hormônios",
      sub: "Dra. Paula · Convidada",
      dur: "35 min",
    },
    {
      id: 13,
      titulo: "Saúde mental feminina",
      sub: "Dra. Carla · Convidada",
      dur: "28 min",
    },
  ],
  jornada: [
    {
      id: 14,
      titulo: "Encontro Semana 1",
      sub: "Dra. Isadora · Ao vivo",
      dur: "75 min",
    },
    {
      id: 15,
      titulo: "Encontro Semana 2",
      sub: "Dra. Isadora · Ao vivo",
      dur: "72 min",
    },
    {
      id: 16,
      titulo: "Encontro Semana 3",
      sub: "Dra. Isadora · Ao vivo",
      dur: "78 min",
    },
    {
      id: 17,
      titulo: "Encontro Semana 4",
      sub: "Dra. Isadora · Ao vivo",
      dur: "70 min",
    },
  ],
};

function Conteudo({ perfil, videos: videosDB }) {
  const [catSel, setCatSel] = useState("yoga");
  const [showConvite, setShowConvite] = useState(false);
  if (showConvite) return <TelaConvite back={() => setShowConvite(false)} />;

  const catAtual = CATS.find((c) => c.id === catSel);
  const bloqCat = false; // demo: todos os conteúdos desbloqueados

  // Usa vídeos do Supabase se disponíveis, senão usa os estáticos
  const videosCategoria = videosDB?.length
    ? videosDB
        .filter((v) => v.categoria === catSel)
        .map((v) => ({
          id: v.id,
          titulo: v.titulo,
          sub: v.descricao || "",
          dur: v.duracao || "30 min",
          url: v.url_youtube,
          plano: v.plano_minimo,
        }))
    : (VIDS[catSel] || []);
  const videos = videosCategoria;

  return (
    <div style={{ animation: "fadeUp .35s ease" }}>
      {/* Header */}
      <div
        style={{
          background: C.obs,
          padding: "12px 18px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${C.ouro}15`,
        }}
      >
        <div style={{ width: 40 }} />
        <Logo width={100} fundo="escuro" />
        <div style={{ width: 40 }} />
      </div>

      {/* Grid de categorias 3x2 */}
      <div
        style={{
          background: C.obs,
          padding: "14px 16px 0",
          borderBottom: `1px solid ${C.ouro}10`,
        }}
      >
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 9,
            color: `rgba(255,255,255,.88)`,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Categorias
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8,
            paddingBottom: 14,
          }}
        >
          {CATS.map((cat) => {
            const bloq = false; // demo: categorias desbloqueadas
            const ativa = catSel === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCatSel(cat.id)}
                style={{
                  background: ativa ? `${C.ouro}20` : `rgba(255,255,255,.04)`,
                  border: `1px solid ${ativa ? C.ouro + "44" : C.ouro + "12"}`,
                  borderRadius: 10,
                  padding: "12px 6px",
                  cursor: "pointer",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                {bloq && (
                  <div
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 6,
                      fontSize: 9,
                    }}
                  >
                    🔒
                  </div>
                )}
                <div style={{ fontSize: 18, marginBottom: 4 }}>{cat.icon}</div>
                <div
                  style={{
                    fontFamily: FB,
                    fontWeight: 300,
                    fontSize: 10,
                    color: ativa
                      ? C.ouro
                      : bloq
                        ? `rgba(255,255,255,.45)`
                        : `rgba(255,255,255,.45)`,
                    lineHeight: 1.3,
                  }}
                >
                  {cat.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Grain style={{ padding: "14px 16px 24px" }}>
        {/* Título da categoria selecionada */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 18 }}>{catAtual?.icon}</div>
          <div
            style={{
              fontFamily: FS,
              fontSize: 18,
              fontWeight: 300,
              color: `rgba(255,255,255,.97)`,
            }}
          >
            {catAtual?.label}
          </div>
          {bloqCat && (
            <div
              style={{
                background: `${C.ouro}15`,
                border: `1px solid ${C.ouro}30`,
                borderRadius: 20,
                padding: "2px 10px",
                fontFamily: FB,
                fontSize: 9,
                color: C.ouro,
                letterSpacing: "0.1em",
              }}
            >
              Jornada AUGE
            </div>
          )}
        </div>

        {/* Aviso de bloqueio */}
        {bloqCat && (
          <div
            style={{
              background: `${C.ouro}0A`,
              border: `1px solid ${C.ouro}20`,
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 13,
                color: `rgba(255,255,255,.82)`,
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              Os encontros ao vivo da Jornada ficam salvos aqui para você
              assistir quando quiser.
            </div>
            <BtnPill
              onClick={() => setShowConvite(true)}
              style={{ fontSize: 13 }}
            >
              Quero entrar na Jornada AUGE
            </BtnPill>
          </div>
        )}

        {/* Lista de vídeos */}
        {videos.map((v) => {
          const bloqVideo = false; // demo: todos os vídeos desbloqueados
          return (
          <div
            key={v.id}
            onClick={() => !bloqVideo && v.url && window.open(v.url, "_blank")}
            style={{
              background: `rgba(255,255,255,.04)`,
              border: `1px solid ${C.ouro}12`,
              borderRadius: 10,
              marginBottom: 9,
              overflow: "hidden",
              display: "flex",
              cursor: bloqVideo ? "default" : "pointer",
              opacity: bloqVideo ? 0.5 : 1,
            }}
          >
            <div
              style={{
                width: 80,
                background: catAtual?.cor || "#1E252E",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: bloqVideo ? 18 : 22,
                color: `rgba(255,255,255,.55)`,
              }}
            >
              {bloqVideo ? "🔒" : "▶"}
            </div>
            <div style={{ padding: "11px 13px", flex: 1 }}>
              <div
                style={{
                  fontFamily: FS,
                  fontSize: 15,
                  color: bloqCat
                    ? `rgba(255,255,255,.92)`
                    : `rgba(255,255,255,.97)`,
                  marginBottom: 3,
                  lineHeight: 1.3,
                }}
              >
                {v.titulo}
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 10,
                  color: `rgba(255,255,255,.88)`,
                  marginBottom: 2,
                }}
              >
                {v.sub}
              </div>
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 10,
                  color: bloqCat ? C.ouro : `rgba(255,255,255,.45)`,
                }}
              >
                {bloqCat ? "Exclusivo Jornada AUGE" : v.dur}
              </div>
            </div>
          </div>
          );
        })}
      </Grain>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABA: PERFIL
// ═══════════════════════════════════════════════════════════════════

// ─── PAINEL DA MENTORA ────────────────────────────────────────────────────────
const CATS_ADMIN = [
  { id: "yoga", label: "Yoga" },
  { id: "meditacao", label: "Meditação" },
  { id: "pilates", label: "Pilates" },
  { id: "nutricao", label: "Nutrição" },
  { id: "longevidade", label: "Longevidade" },
  { id: "mentalidade", label: "Mentalidade" },
];

function PainelMentora({ ir }) {
  const [aba, setAba] = useState("videos"); // "videos" | "mentoria" | "alunas"
  // ── estado vídeos ──
  const [videos, setVideos] = useState([]);
  const [loadingV, setLoadingV] = useState(true);
  const [formV, setFormV] = useState({ titulo: "", url: "", categoria: "yoga", duracao: "30 min", descricao: "" });
  const [salvandoV, setSalvandoV] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  // ── estado mentoria ──
  const [ment, setMent] = useState({ data: "", semana: "", duracao: "75 min", zoom: "" });
  const [salvandoM, setSalvandoM] = useState(false);
  const [salvoM, setSalvoM] = useState(false);
  // ── estado alunas ──
  const [alunas, setAlunas] = useState([]);
  const [loadingA, setLoadingA] = useState(false);

  // Carregar vídeos ao montar
  useEffect(() => {
    supabase.from("videos").select("*").order("ordem", { ascending: true }).order("created_at", { ascending: false })
      .then(({ data }) => { setVideos(data || []); setLoadingV(false); });
  }, []);

  // Carregar mentoria ao montar
  useEffect(() => {
    supabase.from("config").select("*")
      .then(({ data }) => {
        if (!data?.length) return;
        const cfg = Object.fromEntries(data.map((c) => [c.id, c.valor]));
        setMent({
          data: cfg.mentoria_data || "",
          semana: cfg.mentoria_semana || "",
          duracao: cfg.mentoria_duracao || "75 min",
          zoom: cfg.mentoria_zoom || "",
        });
      });
  }, []);

  // Carregar alunas ao clicar na aba
  useEffect(() => {
    if (aba !== "alunas") return;
    setLoadingA(true);
    supabase.from("profiles").select("id, nome, plano, data_cadastro, habito_1, habito_2, habito_3")
      .neq("plano", "pendente")
      .order("data_cadastro", { ascending: false })
      .then(async ({ data: perfis }) => {
        if (!perfis?.length) { setAlunas([]); setLoadingA(false); return; }
        // Buscar último checkin de cada aluna
        const ids = perfis.map((p) => p.id);
        const { data: cks } = await supabase.from("checkins")
          .select("user_id, data, percentual")
          .in("user_id", ids)
          .order("data", { ascending: false });
        const ultimoCk = {};
        for (const ck of (cks || [])) {
          if (!ultimoCk[ck.user_id]) ultimoCk[ck.user_id] = ck;
        }
        setAlunas(perfis.map((p) => ({ ...p, ultimoCk: ultimoCk[p.id] || null })));
        setLoadingA(false);
      });
  }, [aba]);

  const adicionarVideo = async () => {
    if (!formV.titulo.trim() || !formV.url.trim()) return;
    setSalvandoV(true);
    const ytId = formV.url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1] || "";
    const { data, error } = await supabase.from("videos").insert({
      titulo: formV.titulo.trim(),
      url_youtube: formV.url.trim(),
      youtube_id: ytId,
      categoria: formV.categoria,
      duracao: formV.duracao.trim() || "30 min",
      descricao: formV.descricao.trim(),
      ativo: true,
      ordem: videos.length + 1,
      plano_minimo: "comunidade",
    }).select().single();
    if (!error && data) {
      setVideos((v) => [data, ...v]);
      setFormV({ titulo: "", url: "", categoria: "yoga", duracao: "30 min", descricao: "" });
      setMostrarForm(false);
    }
    setSalvandoV(false);
  };

  const removerVideo = async (id) => {
    await supabase.from("videos").delete().eq("id", id);
    setVideos((v) => v.filter((x) => x.id !== id));
  };

  const salvarMentoria = async () => {
    setSalvandoM(true);
    const upserts = [
      { id: "mentoria_data", valor: ment.data },
      { id: "mentoria_semana", valor: ment.semana },
      { id: "mentoria_duracao", valor: ment.duracao },
      { id: "mentoria_zoom", valor: ment.zoom },
    ];
    await Promise.all(upserts.map((u) => supabase.from("config").upsert(u, { onConflict: "id" })));
    setSalvandoM(false);
    setSalvoM(true);
    setTimeout(() => setSalvoM(false), 2500);
  };

  const diasSemCk = (ultimoCk) => {
    if (!ultimoCk) return null;
    const diff = Date.now() - new Date(ultimoCk.data).getTime();
    return Math.floor(diff / 86400000);
  };

  return (
    <Grain style={{ minHeight: 760, animation: "fadeUp .35s ease" }}>
      {/* Header */}
      <div style={{ background: C.obs, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.ouro}18` }}>
        <button onClick={() => ir(S.PF)} style={{ background: "transparent", border: "none", color: C.ouro, cursor: "pointer", fontSize: 18, padding: 0 }}>←</button>
        <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 11, color: C.ouro, letterSpacing: "0.35em", textTransform: "uppercase" }}>Painel da Mentora</div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.ouro}12`, background: C.obs }}>
        {[["videos", "Vídeos"], ["mentoria", "Mentoria"], ["alunas", "Alunas"]].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)} style={{ flex: 1, background: "transparent", border: "none", borderBottom: aba === id ? `2px solid ${C.ouro}` : "2px solid transparent", padding: "12px 0", fontFamily: FB, fontWeight: 300, fontSize: 12, color: aba === id ? C.ouro : `rgba(255,255,255,.4)`, cursor: "pointer", transition: "all .2s" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 18px 48px" }}>

        {/* ── ABA VÍDEOS ── */}
        {aba === "videos" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: FS, fontSize: 18, fontWeight: 300, color: `rgba(255,255,255,.95)` }}>Aulas no YouTube</div>
              <button onClick={() => setMostrarForm((v) => !v)} style={{ background: `${C.ouro}22`, border: `1px solid ${C.ouro}44`, borderRadius: 20, padding: "6px 14px", fontFamily: FB, fontWeight: 300, fontSize: 11, color: C.ouro, cursor: "pointer" }}>
                {mostrarForm ? "Cancelar" : "+ Adicionar"}
              </button>
            </div>

            {/* Formulário de novo vídeo */}
            {mostrarForm && (
              <div style={{ background: `rgba(255,255,255,.04)`, border: `1px solid ${C.ouro}18`, borderRadius: 12, padding: "16px 14px", marginBottom: 20, animation: "fadeUp .25s ease" }}>
                <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 10, color: C.ouro, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 14 }}>Novo vídeo</div>
                {[
                  ["Título", "titulo", "Ex: Yoga para mobilidade"],
                  ["Link do YouTube", "url", "https://youtube.com/watch?v=..."],
                  ["Duração", "duracao", "Ex: 30 min"],
                  ["Descrição (opcional)", "descricao", "Breve descrição da aula"],
                ].map(([lb, field, ph]) => (
                  <div key={field} style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 10, color: `rgba(255,255,255,.5)`, marginBottom: 5 }}>{lb}</div>
                    <input
                      value={formV[field]}
                      onChange={(e) => setFormV((f) => ({ ...f, [field]: e.target.value }))}
                      placeholder={ph}
                      style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid rgba(255,255,255,.2)`, color: C.branco, fontFamily: FB, fontWeight: 300, fontSize: 13, padding: "6px 0" }}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 10, color: `rgba(255,255,255,.5)`, marginBottom: 5 }}>Categoria</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {CATS_ADMIN.map((cat) => (
                      <button key={cat.id} onClick={() => setFormV((f) => ({ ...f, categoria: cat.id }))}
                        style={{ background: formV.categoria === cat.id ? `${C.ouro}22` : `rgba(255,255,255,.04)`, border: `1px solid ${formV.categoria === cat.id ? C.ouro + "55" : C.ouro + "15"}`, borderRadius: 50, padding: "5px 12px", fontFamily: FB, fontWeight: 300, fontSize: 11, color: formV.categoria === cat.id ? C.ouro : `rgba(255,255,255,.4)`, cursor: "pointer" }}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <BtnPill onClick={adicionarVideo} style={{ opacity: formV.titulo && formV.url ? 1 : 0.4, fontSize: 13 }}>
                  {salvandoV ? "Salvando..." : "Salvar vídeo"}
                </BtnPill>
              </div>
            )}

            {/* Lista de vídeos */}
            {loadingV ? (
              <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 13, color: `rgba(255,255,255,.4)`, textAlign: "center", marginTop: 32 }}>Carregando...</div>
            ) : videos.length === 0 ? (
              <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 13, color: `rgba(255,255,255,.4)`, textAlign: "center", marginTop: 32 }}>Nenhum vídeo cadastrado ainda.</div>
            ) : videos.map((v) => (
              <div key={v.id} style={{ background: `rgba(255,255,255,.04)`, border: `1px solid ${C.ouro}12`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 12 }}>
                {v.youtube_id && (
                  <img src={`https://img.youtube.com/vi/${v.youtube_id}/default.jpg`} alt="" style={{ width: 60, height: 45, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 13, color: `rgba(255,255,255,.92)`, marginBottom: 3 }}>{v.titulo}</div>
                  <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 11, color: `rgba(255,255,255,.4)` }}>{v.categoria} · {v.duracao}</div>
                </div>
                <button onClick={() => removerVideo(v.id)} style={{ background: "transparent", border: "none", color: `rgba(255,255,255,.25)`, cursor: "pointer", fontSize: 16, flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* ── ABA MENTORIA ── */}
        {aba === "mentoria" && (
          <div>
            <div style={{ fontFamily: FS, fontSize: 18, fontWeight: 300, color: `rgba(255,255,255,.95)`, marginBottom: 20 }}>Próxima mentoria</div>
            {[
              ["Data e horário", "data", "Ex: 15 de julho · 19h"],
              ["Semana da jornada", "semana", "Ex: Semana 3"],
              ["Duração", "duracao", "Ex: 75 min"],
              ["Link do Zoom", "zoom", "https://zoom.us/j/..."],
            ].map(([lb, field, ph]) => (
              <div key={field} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 10, color: `rgba(255,255,255,.5)`, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>{lb}</div>
                <input
                  value={ment[field]}
                  onChange={(e) => setMent((m) => ({ ...m, [field]: e.target.value }))}
                  placeholder={ph}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid rgba(255,255,255,.2)`, color: C.branco, fontFamily: FB, fontWeight: 300, fontSize: 14, padding: "7px 0" }}
                />
              </div>
            ))}
            <BtnPill onClick={salvarMentoria} style={{ fontSize: 13 }}>
              {salvoM ? "✓ Salvo!" : salvandoM ? "Salvando..." : "Salvar mentoria"}
            </BtnPill>
          </div>
        )}

        {/* ── ABA ALUNAS ── */}
        {aba === "alunas" && (
          <div>
            <div style={{ fontFamily: FS, fontSize: 18, fontWeight: 300, color: `rgba(255,255,255,.95)`, marginBottom: 16 }}>Alunas ativas</div>
            {loadingA ? (
              <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 13, color: `rgba(255,255,255,.4)`, textAlign: "center", marginTop: 32 }}>Carregando...</div>
            ) : alunas.length === 0 ? (
              <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 13, color: `rgba(255,255,255,.4)`, textAlign: "center", marginTop: 32 }}>Nenhuma aluna ativa ainda.</div>
            ) : alunas.map((a) => {
              const dias = diasSemCk(a.ultimoCk);
              const statusCor = dias === null ? `rgba(255,255,255,.25)` : dias <= 2 ? "#7FC98B" : dias <= 5 ? C.ouro : "#C98B7F";
              const statusTxt = dias === null ? "Sem checkin" : dias === 0 ? "Checkin hoje" : dias === 1 ? "Ontem" : `${dias} dias atrás`;
              return (
                <div key={a.id} style={{ background: `rgba(255,255,255,.04)`, border: `1px solid ${C.ouro}12`, borderRadius: 10, padding: "13px 14px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 14, color: `rgba(255,255,255,.92)` }}>{a.nome || "—"}</div>
                    <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 10, color: statusCor }}>{statusTxt}</div>
                  </div>
                  <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 11, color: `rgba(255,255,255,.4)`, marginBottom: a.habito_1 ? 8 : 0 }}>
                    {a.plano} {a.ultimoCk ? `· ${a.ultimoCk.percentual}% no último check-in` : ""}
                  </div>
                  {a.habito_1 && (
                    <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 11, color: `rgba(255,255,255,.35)` }}>
                      {[a.habito_1, a.habito_2, a.habito_3].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Grain>
  );
}

function Perfil({
  perfil,
  matches,
  pontos,
  medC,
  habAngulares,
  setHabAngulares,
  usuario,
  setUsuario,
  logout,
  recarregarPerfil,
  authUserId,
  sem,
  historico,
  mentoria,
  ir,
}) {
  const [editando, setEditando] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(usuario?.nome || "");
  const [emailEdit, setEmailEdit] = useState(usuario?.email || "");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEdit.trim());
  const editOk = nomeEdit.trim().length >= 2 && emailOk;
  const fotoRef = useRef(null);
  const [fotoPerfil, setFotoPerfil] = useState(() => {
    try { return localStorage.getItem("auge_foto") || null; } catch { return null; }
  });

  const iniciais = usuario?.nome
    ? usuario.nome
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("")
    : "?";

  const salvarEdicao = () => {
    if (!editOk) return;
    setUsuario({
      nome: nomeEdit.trim(),
      email: emailEdit.trim().toLowerCase(),
    });
    setEditando(false);
  };

  return (
    <div style={{ animation: "fadeUp .35s ease" }}>
      <div
        style={{
          background: C.obs,
          padding: "24px 18px 30px",
          textAlign: "center",
          borderBottom: `1px solid ${C.ouro}12`,
        }}
      >
        <input
          ref={fotoRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = (ev) => {
              setFotoPerfil(ev.target.result);
              try { localStorage.setItem("auge_foto", ev.target.result); } catch {}
            };
            r.readAsDataURL(f);
            // Upload para Supabase Storage
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            const ext = f.name.split(".").pop() || "jpg";
            const path = `${session.user.id}/avatar.${ext}`;
            const { error } = await supabase.storage
              .from("avatars")
              .upload(path, f, { upsert: true, contentType: f.type });
            if (!error) {
              const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
              if (urlData?.publicUrl) {
                await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", session.user.id);
                try { localStorage.setItem("auge_foto_url", urlData.publicUrl); } catch {}
              }
            }
          }}
        />
        <div
          onClick={() => fotoRef.current?.click()}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: fotoPerfil ? "transparent" : `${C.ouro}18`,
            border: `1px solid ${C.ouro}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FS,
            fontSize: 28,
            color: C.ouro,
            margin: "0 auto 4px",
            cursor: "pointer",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {fotoPerfil ? (
            <img src={fotoPerfil} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            iniciais
          )}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(0,0,0,.45)", fontSize: 9,
            fontFamily: FB, color: "rgba(255,255,255,.88)",
            padding: "3px 0", letterSpacing: "0.05em",
          }}>📷</div>
        </div>
        <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 10, color: `rgba(255,255,255,.45)`, marginBottom: 8 }}>
          Toque para alterar foto
        </div>
        <div
          style={{
            fontFamily: FS,
            fontSize: 22,
            fontWeight: 300,
            color: `rgba(255,255,255,.97)`,
          }}
        >
          {usuario?.nome || "—"}
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 11,
            color: `rgba(255,255,255,.88)`,
            marginTop: 3,
          }}
        >
          {usuario?.email || ""}
        </div>
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 12,
            color: C.ouro,
            marginTop: 4,
          }}
        >
          {perfil === "jornada"
            ? `Aluna da Jornada · Semana ${sem} de 12`
            : perfil === "admin"
            ? "Dra. Isadora Zaniboni · Mentora"
            : perfil === "pendente"
            ? "Conta em ativação"
            : "Assinante da Comunidade"}
        </div>
        {perfil === "jornada" && (
          <div
            style={{
              display: "inline-block",
              background: "rgba(15,110,86,.18)",
              border: "1px solid rgba(15,110,86,.3)",
              borderRadius: 20,
              padding: "4px 14px",
              marginTop: 10,
              color: "#4ade80",
              fontSize: 11,
              fontFamily: FB,
            }}
          >
            ✓ Identidade verificada
          </div>
        )}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => {
              setNomeEdit(usuario?.nome || "");
              setEmailEdit(usuario?.email || "");
              setEditando((e) => !e);
            }}
            style={{
              background: "transparent",
              border: `1px solid ${C.ouro}30`,
              borderRadius: 20,
              padding: "6px 16px",
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 11,
              color: C.ouro,
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            {editando ? "Cancelar" : "✏️ Editar dados"}
          </button>
          {perfil === "admin" && (
            <button
              onClick={() => ir(S.ADMIN)}
              style={{
                background: `${C.ouro}18`,
                border: `1px solid ${C.ouro}44`,
                borderRadius: 20,
                padding: "6px 16px",
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: C.ouro,
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              ⚙️ Painel da Mentora
            </button>
          )}
          {logout && (
            <button
              onClick={logout}
              style={{
                background: "transparent",
                border: `1px solid rgba(255,255,255,.1)`,
                borderRadius: 20,
                padding: "6px 16px",
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.88)`,
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              Sair
            </button>
          )}

        </div>
      </div>

      {/* Formulário de edição inline */}
      {editando && (
        <div
          style={{
            background: `${C.obs2}`,
            borderBottom: `1px solid ${C.ouro}12`,
            padding: "20px 20px 24px",
            animation: "fadeUp .25s ease",
          }}
        >
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 9,
              color: C.ouro,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Editar informações
          </div>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.4)`,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Nome
            </div>
            <input
              value={nomeEdit}
              onChange={(e) => setNomeEdit(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${nomeEdit.trim().length >= 2 ? C.ouro + "66" : "rgba(255,255,255,.45)"}`,
                color: C.branco,
                fontFamily: FS,
                fontSize: 16,
                fontWeight: 300,
                padding: "6px 0",
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 11,
                color: `rgba(255,255,255,.4)`,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              E-mail
            </div>
            <input
              type="email"
              value={emailEdit}
              onChange={(e) => setEmailEdit(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${emailOk ? C.ouro + "66" : "rgba(255,255,255,.45)"}`,
                color: C.branco,
                fontFamily: FS,
                fontSize: 16,
                fontWeight: 300,
                padding: "6px 0",
              }}
            />
          </div>
          <BtnPill onClick={salvarEdicao} style={{ opacity: editOk ? 1 : 0.4 }}>
            Salvar alterações
          </BtnPill>
        </div>
      )}
      <Grain style={{ padding: "18px 18px 32px" }}>
        {/* Estatísticas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 18,
          }}
        >
          {[
            ["💛", "Conexões", `${matches?.length || 0}`],
            ["📋", "Check-ins", `${Object.keys(historico || {}).length}`],
            ["⭐", "Pontos AUGE", `${pontos || 0}`],
          ].map(([ic, l, v]) => (
            <div
              key={l}
              style={{
                background: `rgba(255,255,255,.04)`,
                border: `1px solid ${C.ouro}12`,
                borderRadius: 10,
                padding: "13px 14px",
              }}
            >
              <div
                style={{
                  fontFamily: FB,
                  fontWeight: 300,
                  fontSize: 11,
                  color: `rgba(255,255,255,.92)`,
                  marginBottom: 4,
                }}
              >
                {ic} {l}
              </div>
              <div style={{ fontFamily: FS, fontSize: 22, color: C.ouro }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        {/* Medalhas */}
        {perfil === "jornada" && (
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontFamily: FB,
                fontWeight: 300,
                fontSize: 9,
                color: C.ouro,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Medalhas
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {MEDALHAS.map((med) => {
                const ok = medC?.includes(med.id);
                return (
                  <div
                    key={med.id}
                    style={{
                      flex: 1,
                      background: ok ? `${med.cor}12` : `rgba(255,255,255,.02)`,
                      border: `1px solid ${ok ? med.cor + "28" : C.ouro + "10"}`,
                      borderRadius: 10,
                      padding: "10px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        filter: ok ? "none" : "grayscale(1)",
                        opacity: ok ? 1 : 0.3,
                      }}
                    >
                      {med.icon}
                    </div>
                    <div
                      style={{
                        fontFamily: FB,
                        fontWeight: 300,
                        fontSize: 9,
                        color: ok
                          ? `rgba(255,255,255,.45)`
                          : `rgba(255,255,255,.15)`,
                        marginTop: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {med.nome}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Preferências para o radar de amigas */}
        <PrefRadar authUserId={authUserId} />
        <EditarHabitos
          habAngulares={habAngulares}
          setHabAngulares={setHabAngulares}
        />

        {/* Aviso legal */}
        <div
          style={{
            background: `rgba(255,255,255,.02)`,
            border: `1px solid ${C.ouro}10`,
            borderRadius: 10,
            padding: "12px 14px",
            marginTop: 14,
          }}
        >
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              color: `rgba(255,255,255,.45)`,
              lineHeight: 1.6,
            }}
          >
            Este app é um programa de desenvolvimento de hábitos e estilo de
            vida. Não substitui consulta médica ou acompanhamento clínico.
          </div>
        </div>
      </Grain>
    </div>
  );
}

function PrefRadar({ authUserId }) {
  const INTERESSES = [
    "Caminhada", "Corrida", "Pilates", "Yoga", "Musculação",
    "Natação", "Dança", "Funcional", "Leitura", "Meditação", "Outros",
  ];
  const [cidade, setCidade] = useState(() => {
    try { return localStorage.getItem("auge_pref_cidade") || ""; } catch { return ""; }
  });
  const [sels, setSels] = useState(() => {
    try { return JSON.parse(localStorage.getItem("auge_pref_sels") || "[]"); } catch { return []; }
  });
  const [salvo, setSalvo] = useState(() => {
    try { return !!localStorage.getItem("auge_pref_salvo"); } catch { return false; }
  });
  const [editando, setEditando] = useState(false);
  const toggle = (i) => setSels((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i]);

  const salvar = () => {
    try {
      localStorage.setItem("auge_pref_cidade", cidade);
      localStorage.setItem("auge_pref_sels", JSON.stringify(sels));
      localStorage.setItem("auge_pref_salvo", "1");
    } catch {}
    if (authUserId) {
      supabase.from("profiles").update({
        radar_cidade: cidade,
        radar_interesses: sels,
      }).eq("id", authUserId).then(() => {});
    }
    setSalvo(true);
    setEditando(false);
  };

  return (
    <div style={{ background: `rgba(255,255,255,.04)`, border: `1px solid ${C.ouro}15`, borderRadius: 10, padding: "16px", marginBottom: 14 }}>
      <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 9, color: C.ouro, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 14 }}>
        Minhas preferências · Radar de Amigas
      </div>

      {salvo && !editando ? (
        <div>
          {cidade && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 11, color: `rgba(255,255,255,.92)`, marginBottom: 4 }}>Cidade</div>
              <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 15, color: `rgba(255,255,255,.92)` }}>{cidade}</div>
            </div>
          )}
          {sels.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 11, color: `rgba(255,255,255,.92)`, marginBottom: 8 }}>Interesses</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {sels.map((i) => (
                  <span key={i} style={{ background: `${C.ouro}22`, border: `1px solid ${C.ouro}44`, borderRadius: 50, padding: "6px 13px", fontFamily: FB, fontWeight: 300, fontSize: 12, color: C.ouro }}>
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setEditando(true)}
            style={{ width: "100%", background: "none", border: `1px solid ${C.ouro}20`, borderRadius: 50, padding: "11px", fontFamily: FB, fontWeight: 300, fontSize: 12, color: `rgba(255,255,255,.88)`, cursor: "pointer", letterSpacing: "0.1em" }}
          >
            Editar preferências
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 12, color: `rgba(255,255,255,.92)`, marginBottom: 8 }}>Cidade</div>
          <input
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Ex: Florianópolis"
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid rgba(255,255,255,.45)`, color: C.branco, fontFamily: FB, fontWeight: 300, fontSize: 15, padding: "7px 0", marginBottom: 18 }}
          />
          <div style={{ fontFamily: FB, fontWeight: 300, fontSize: 12, color: `rgba(255,255,255,.92)`, marginBottom: 10 }}>Interesses (selecione os seus)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
            {INTERESSES.map((i) => {
              const s = sels.includes(i);
              return (
                <button key={i} onClick={() => toggle(i)} style={{ background: s ? `${C.ouro}22` : `rgba(255,255,255,.04)`, border: `1px solid ${s ? C.ouro + "44" : C.ouro + "12"}`, borderRadius: 50, padding: "7px 13px", fontFamily: FB, fontWeight: 300, fontSize: 12, color: s ? C.ouro : `rgba(255,255,255,.4)`, cursor: "pointer" }}>
                  {i}
                </button>
              );
            })}
          </div>
          <BtnPill onClick={salvar} style={{ fontSize: 13 }}>
            Salvar preferências
          </BtnPill>
        </div>
      )}
    </div>
  );
}

function EditarHabitos({ habAngulares, setHabAngulares }) {
  const [vals, setVals] = useState(
    habAngulares.length > 0 ? habAngulares.map((h) => h.t) : ["", "", ""],
  );
  // Sincroniza quando habAngulares chega do banco após mount
  useEffect(() => {
    if (habAngulares.length > 0) {
      setVals(habAngulares.map((h) => h.t));
    }
  }, [habAngulares]);
  const [salvo, setSalvo] = useState(false);
  const ok = vals.every((v) => v.trim());
  const salvar = () => {
    if (!ok) return;
    const habs = vals.map((t, i) => ({ id: "ha" + (i + 1), t: t.trim() }));
    setHabAngulares(habs);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase.from("profiles").upsert({
        id: session.user.id,
        habito_1: habs[0]?.t || null,
        habito_2: habs[1]?.t || null,
        habito_3: habs[2]?.t || null,
      }, { onConflict: "id" }).then(() => {});
    });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };
  return (
    <div
      style={{
        background: "rgba(255,255,255,.04)",
        border: `1px solid ${C.ouro}15`,
        borderRadius: 10,
        padding: "16px",
        marginBottom: 14,
        marginTop: 14,
      }}
    >
      <div
        style={{
          fontFamily: FB,
          fontWeight: 300,
          fontSize: 9,
          color: C.ouro,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        Meus hábitos angulares
      </div>
      {vals.map((v, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: FB,
              fontWeight: 300,
              fontSize: 10,
              color: "rgba(255,255,255,.92)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {i + 1}º hábito
          </div>
          <input
            value={v}
            onChange={(e) => {
              const n = [...vals];
              n[i] = e.target.value;
              setVals(n);
            }}
            placeholder="Defina seu hábito"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${v.trim() ? C.ouro + "55" : "rgba(255,255,255,.45)"}`,
              color: C.branco,
              fontFamily: FS,
              fontSize: 16,
              fontWeight: 300,
              padding: "7px 0",
            }}
          />
        </div>
      ))}
      {salvo ? (
        <div
          style={{
            fontFamily: FB,
            fontWeight: 300,
            fontSize: 12,
            color: C.augeZ,
            textAlign: "center",
          }}
        >
          ✓ Hábitos salvos!
        </div>
      ) : (
        <BtnPill
          onClick={salvar}
          style={{ opacity: ok ? 1 : 0.4, fontSize: 13 }}
        >
          Salvar hábitos
        </BtnPill>
      )}
    </div>
  );
}
