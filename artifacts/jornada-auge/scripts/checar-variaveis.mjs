// Verificador de identificador usado sem nunca ter sido declarado.
//
// Existe por causa de 09/09/2026: um "perfilRes" escrito onde a variável se
// chama "profileRes" derrubou, em produção, o carregamento das configurações,
// da turma, dos vídeos e do Radar. O build não acusa — é um erro que só
// acontece na hora de rodar — e os testes de tela montam um componente por vez,
// então nenhum deles executa o carregamento inicial.
//
// Rodar antes de cada commit:
//   node artifacts/jornada-auge/scripts/checar-variaveis.mjs
//
// Ele NÃO valida escopo: só pergunta se o nome existe em algum lugar do
// arquivo. Isso basta para pegar erro de digitação em nome de variável, que é
// o que já custou uma publicação quebrada.

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const alvo = path.join(aqui, "..", "src", "AugeApp.jsx");

const require = createRequire(import.meta.url);
let parse;
try {
  ({ parse } = require("@babel/parser"));
} catch {
  console.error("Não achei o @babel/parser. Rode de dentro do repositório, com as dependências instaladas.");
  process.exit(2);
}

const src = fs.readFileSync(alvo, "utf8");
const ast = parse(src, { sourceType: "module", plugins: ["jsx"] });

const declarados = new Set();
const usados = new Map();

const GLOBAIS = new Set([
  "window","document","console","Math","JSON","Object","Array","String","Number","Boolean","Date","Promise",
  "Map","Set","RegExp","Error","fetch","setTimeout","clearTimeout","setInterval","clearInterval","navigator",
  "localStorage","sessionStorage","location","alert","encodeURIComponent","decodeURIComponent","parseInt",
  "parseFloat","isNaN","undefined","NaN","Infinity","React","process","Intl","URL","Blob","File","FileReader",
  "FormData","Response","Request","Headers","AbortController","structuredClone","crypto","performance",
  "globalThis","atob","btoa","TextEncoder","TextDecoder","CustomEvent","Event","Image","Audio","arguments",
  "HTMLElement","Notification","IntersectionObserver","ResizeObserver","MutationObserver",
  "requestAnimationFrame","cancelAnimationFrame","history","screen","matchMedia","getComputedStyle","Symbol",
  "WeakMap","WeakSet","Proxy","Reflect","BigInt","queueMicrotask","Uint8Array","ArrayBuffer","Function",
]);

function andar(no, ver) {
  if (!no || typeof no !== "object") return;
  if (Array.isArray(no)) { for (const n of no) andar(n, ver); return; }
  if (no.type) ver(no);
  for (const k of Object.keys(no)) {
    if (k === "loc" || k === "leadingComments" || k === "trailingComments") continue;
    andar(no[k], ver);
  }
}

function colher(p) {
  if (!p) return;
  if (p.type === "Identifier") declarados.add(p.name);
  else if (p.type === "ObjectPattern") p.properties.forEach((pr) => colher(pr.value || pr.argument));
  else if (p.type === "ArrayPattern") p.elements.forEach(colher);
  else if (p.type === "AssignmentPattern") colher(p.left);
  else if (p.type === "RestElement") colher(p.argument);
}

andar(ast, (n) => {
  if (n.type === "VariableDeclarator") colher(n.id);
  else if (n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression") {
    if (n.id) declarados.add(n.id.name);
    (n.params || []).forEach(colher);
  } else if (n.type === "ClassDeclaration" && n.id) declarados.add(n.id.name);
  else if (n.type === "ImportSpecifier" || n.type === "ImportDefaultSpecifier" || n.type === "ImportNamespaceSpecifier") declarados.add(n.local.name);
  else if (n.type === "CatchClause") colher(n.param);
});

andar(ast, (n) => {
  if (n.type === "MemberExpression" && !n.computed && n.object?.type === "Identifier") {
    if (!usados.has(n.object.name)) usados.set(n.object.name, n.loc?.start.line);
  }
});

const faltando = [...usados].filter(([nome]) => !declarados.has(nome) && !GLOBAIS.has(nome));

if (!faltando.length) {
  console.log("ok — nenhum identificador usado sem declaração");
} else {
  console.error("USADOS SEM DECLARAÇÃO — isso quebra o app na hora de rodar:");
  for (const [nome, linha] of faltando) console.error(`  linha ${linha}: ${nome}`);
  process.exit(1);
}
