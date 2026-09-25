// ─── TOKENS DE DESIGN — "editorial quente" ──────────────────────────────────
// Fonte única das cores, tamanhos, raios e espaços do app.
// As cores ficam em HEX (não em var(--x)) porque o AugeApp.jsx monta
// transparência colando dois dígitos no fim da cor — `${C.ouro}15` — em
// ~270 lugares. Com var() isso quebraria calado. Para código novo, usar alfa().
// As mesmas cores são espelhadas em variáveis CSS (cssVars) para quem preferir.
//
// Contraste medido (WCAG), sobre bg / surface / surfaceSoft:
//   ink      16,15 / 17,24 / 14,83   texto principal
//   inkSoft   7,38 /  7,88 /  6,78   texto secundário
//   primary   5,73 /  6,12 /  5,26   terracota — branco por cima: 6,12
//   olive     5,90 /  6,30 /  5,42   conquista — branco por cima: 6,30
//   ouroTxt   5,44 /  5,81 /  5,00   único dourado permitido como texto
//   gold      2,12 /  2,27           NUNCA texto nem ícone informativo
//   lineForte 3,87 /  4,13 /  3,55   borda de campo de formulário (mín. 3:1)

export const T = {
  bg: "#FBF7F1", // fundo do app (também no desktop)
  surface: "#FFFFFF", // cartões principais
  surfaceSoft: "#F4EDE3", // cartões secundários, áreas agrupadas
  blush: "#F2E4DC", // destaque afetivo (Vitória da Semana, resgate)
  ink: "#1F1A17", // texto principal
  inkSoft: "#5C4F47", // texto secundário
  primary: "#9A4B36", // terracota: ação principal
  olive: "#5E6340", // oliva: feito, conquista, progresso
  gold: "#C4A882", // só decorativo
  line: "#E6DCCF", // divisórias e borda de cartão
  lineForte: "#8A7A6D", // borda de campo (input, textarea)
  onColor: "#FFFFFF", // texto sobre primary e olive
};

// Tipografia: só Inter. Hierarquia por peso e tamanho.
export const FONTE = "'Inter', system-ui, -apple-system, sans-serif";
export const TIPO = {
  destaque: { fontSize: 40, fontWeight: 700, lineHeight: 1.1 },
  tela: { fontSize: 28, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" },
  cartao: { fontSize: 19, fontWeight: 600, lineHeight: 1.3 },
  corpo: { fontSize: 17, fontWeight: 400, lineHeight: 1.5 },
  secao: { fontSize: 15, fontWeight: 600, lineHeight: 1.4 }, // rótulo de seção, caixa normal
  sec: { fontSize: 15, fontWeight: 400, lineHeight: 1.45 }, // texto secundário: mínimo
  botao: { fontSize: 17, fontWeight: 600, lineHeight: 1.2 },
  nav: { fontSize: 13, fontWeight: 500, lineHeight: 1.2 }, // só a barra inferior
};

export const RAIO = { cartao: 20, botao: 14, chip: 999 };
export const ESP = { x1: 4, x2: 8, x3: 12, x4: 16, x6: 24, x8: 32, x12: 48, lateral: 20 };
export const ALVO = { min: 48, botao: 52 };
export const SOMBRA = "0 1px 2px rgba(31,26,23,.06)";
export const MOV = { rapido: "200ms cubic-bezier(.2,.8,.2,1)" };

// alfa("#9A4B36", .12) → "rgba(154,75,54,0.12)"
export function alfa(hex, a) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
}

const kebab = (s) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
export const cssVars =
  ":root{" +
  Object.entries(T).map(([k, v]) => `--${kebab(k)}:${v};`).join("") +
  `--raio-cartao:${RAIO.cartao}px;--raio-botao:${RAIO.botao}px;--sombra:${SOMBRA};` +
  "}";
