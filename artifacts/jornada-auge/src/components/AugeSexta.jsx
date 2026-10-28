// ─── SEXTA DA VITÓRIA ────────────────────────────────────────────────────────
// Depois de enviar a Vitória da Semana, a aluna recebe o post da semana
// (1080×1920) para os stories ou o WhatsApp: a montanha da tela Hoje, com a
// luz onde ela chegou na semana, a frase dela e — se ela quiser — as
// pastilhas da semana ("Movimento 3x").
//
// A imagem é desenhada num <canvas>, não com html-to-image: no iPhone o Safari
// costuma gerar a imagem sem as fontes ou em branco quando ela é copiada do
// HTML, e o canvas sai igual em qualquer celular. A prévia na tela é o MESMO
// desenho, então o que ela vê é o que posta.
import { useEffect, useRef, useState } from "react";
import { DESENHO, pontoNaTrilha } from "./AugeCume.jsx";

export const ARROBA = "@isadorageriatra";
export const LIMITE_FRASE = 100;
const FONTE = "Inter, system-ui, -apple-system, sans-serif";
const PW = 1080, PH = 1920;

// Título muda com a semana: completou tudo → auge; senão, a subida.
export const tituloDoPost = (t) => (t >= 1 ? "Você chegou ao seu auge!" : "Que subida bonita!");

function quebrarLinhas(ctx, texto, largura) {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width <= largura || !atual) atual = teste;
    else { linhas.push(atual); atual = p; }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// Texto com espaçamento entre letras (ctx.letterSpacing não existe em todo celular)
function textoEspacado(ctx, texto, cx, y, espaco) {
  const chars = [...texto];
  const total = chars.reduce((a, ch) => a + ctx.measureText(ch).width, 0) + espaco * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  for (const ch of chars) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + espaco; }
  ctx.textAlign = "center";
}

function retanguloRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
}

const alfaHex = (hex, a) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
};

// Pastilhas em linhas centralizadas; devolve o y onde terminaram
function desenharPastilhas(ctx, tags, corDe, yTopo, desenhar = true) {
  if (!tags?.length) return yTopo;
  ctx.font = `600 44px ${FONTE}`;
  const ALT = 84, GAP = 18, PADX = 34, LARG = 940;
  const itens = tags.map((t) => { const txt = `${t.nome} ${t.n}x`; return { txt, w: ctx.measureText(txt).width + PADX * 2, cor: corDe(t.nome) }; });
  const linhas = [];
  let atual = [], larg = 0;
  for (const it of itens) {
    const extra = atual.length ? GAP : 0;
    if (atual.length && larg + extra + it.w > LARG) { linhas.push({ itens: atual, larg }); atual = [it]; larg = it.w; }
    else { atual.push(it); larg += extra + it.w; }
  }
  if (atual.length) linhas.push({ itens: atual, larg });
  let y = yTopo;
  for (const l of linhas) {
    let x = PW / 2 - l.larg / 2;
    for (const it of l.itens) {
      if (!desenhar) { x += it.w + GAP; continue; }
      retanguloRedondo(ctx, x, y, it.w, ALT, ALT / 2);
      ctx.fillStyle = alfaHex(it.cor.base, 0.18); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = alfaHex(it.cor.base, 0.45); ctx.stroke();
      ctx.fillStyle = it.cor.txt;
      ctx.fillText(it.txt, x + it.w / 2, y + 57);
      x += it.w + GAP;
    }
    y += ALT + GAP;
  }
  return y - GAP;
}

// A montanha da tela Hoje, esticada na largura do post, com a luz em t
// ACHATAR baixa o cume (como na Hoje, que usa 0,62), para sobrar espaço ao texto
const ACHATAR = 0.6;
function desenharMontanha(ctx, t, yBase) {
  const { W, H, TRILHA_BASE, FUNDO, MONTANHA, SOMBRA, NEVE } = DESENHO;
  const k = PW / W;
  const px = ([x, y]) => [x * k, yBase + (H - (H - y) * ACHATAR) * k];
  const forma = (pts, cor, alfa = 1) => {
    ctx.globalAlpha = alfa; ctx.fillStyle = cor; ctx.beginPath();
    pts.map(px).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  };
  forma(FUNDO, "#D8B79C");
  forma(MONTANHA, "#B5563C");
  forma(SOMBRA, "#9A4B36");
  forma(NEVE, "#FBF3E8", 0.9);
  // trilha tracejada
  ctx.save();
  ctx.setLineDash([10, 20]); ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(251,243,232,.9)";
  ctx.beginPath();
  TRILHA_BASE.map(px).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke(); ctx.restore();
  // a luz (sai do 2º ponto, como na tela Hoje)
  const [lx, ly] = px(pontoNaTrilha(Math.max(0, Math.min(1, t)), TRILHA_BASE.slice(1)));
  const halo = ctx.createRadialGradient(lx, ly, 10, lx, ly, 120);
  halo.addColorStop(0, "rgba(255,239,201,1)");
  halo.addColorStop(0.55, "rgba(252,230,196,.85)");
  halo.addColorStop(1, "rgba(252,230,196,0)");
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(lx, ly, 120, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = "rgba(255,236,190,.95)"; ctx.shadowBlur = 24;
  ctx.fillStyle = "#FFF8E8"; ctx.beginPath(); ctx.arc(lx, ly, 26, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

export function desenharPost(canvas, { t, semana, frase, nome, tags, corDe, programa = "Jornada AUGE" }) {
  canvas.width = PW; canvas.height = PH;
  const ctx = canvas.getContext("2d");
  // céu creme, como o cabeçalho da Hoje
  const ceu = ctx.createLinearGradient(0, 0, 0, PH);
  ceu.addColorStop(0, "#FBF3E8"); ceu.addColorStop(1, "#F3E3CC");
  ctx.fillStyle = ceu; ctx.fillRect(0, 0, PW, PH);

  const yMontanha = PH - DESENHO.H * (PW / DESENHO.W); // a montanha encosta no pé do post
  const yCume = yMontanha + (DESENHO.H - (DESENHO.H - 46) * ACHATAR) * (PW / DESENHO.W);
  desenharMontanha(ctx, t, yMontanha);

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  // O convite fica preso acima do brilho da luz no cume; o bloco de texto
  // (etiqueta, título, frase, nome e pastilhas) fica centralizado no espaço
  // que sobra acima dele. Mede primeiro sem desenhar, depois desenha.
  const sh = 112;
  const syFixo = yCume - 360;
  const blocoTexto = (y0, desenhar) => {
    const escreve = (txt, x, y) => { if (desenhar) ctx.fillText(txt, x, y); };
    let y = y0;
    ctx.fillStyle = "#9A4B36";
    ctx.font = `700 38px ${FONTE}`;
    y += 38;
    if (desenhar) textoEspacado(ctx, semana ? `SEXTA DA VITÓRIA · SEMANA ${semana}` : "SEXTA DA VITÓRIA", PW / 2, y, 6);
    ctx.fillStyle = "#1F1A17";
    ctx.font = `700 76px ${FONTE}`;
    y += 110;
    const tit = quebrarLinhas(ctx, tituloDoPost(t), 960);
    tit.forEach((l, i) => { escreve(l, PW / 2, y); if (i < tit.length - 1) y += 92; });
    const limpa = (frase || "").trim();
    if (limpa) {
      let tam = 64, linhas = [];
      for (const s of [64, 58, 52]) {
        ctx.font = `500 ${s}px ${FONTE}`;
        linhas = quebrarLinhas(ctx, `“${limpa}”`, 920);
        tam = s;
        if (linhas.length <= 5) break;
      }
      ctx.fillStyle = "#3A2E28";
      y += 64 + tam;
      linhas.forEach((l, i) => { escreve(l, PW / 2, y); if (i < linhas.length - 1) y += Math.round(tam * 1.3); });
    }
    if (nome) {
      ctx.font = `500 44px ${FONTE}`;
      ctx.fillStyle = "#5C4F47";
      y += 80;
      escreve(`— ${nome}`, PW / 2, y);
    }
    if (tags?.length && corDe) y = desenharPastilhas(ctx, tags, corDe, y + 50, desenhar);
    return y;
  };
  const altura = blocoTexto(0, false);
  const topo = 90, base = syFixo - 70;
  const y0 = Math.max(topo, topo + (base - topo - altura) / 2);
  const y = blocoTexto(y0, true);

  // convite, logo acima do cume
  const selo = "Também quer se priorizar?";
  ctx.font = `700 46px ${FONTE}`;
  const sw = ctx.measureText(selo).width + 100;
  const sy = Math.max(y + 60, syFixo);
  retanguloRedondo(ctx, PW / 2 - sw / 2, sy, sw, sh, 56);
  ctx.fillStyle = "#9A4B36"; ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(selo, PW / 2, sy + 72);
  ctx.font = `600 38px ${FONTE}`;
  ctx.fillStyle = "#7E6038";
  ctx.fillText(`Conheça ${programa === "Clube do Auge" ? "o" : "a"} ${programa} · ${ARROBA}`, PW / 2, sy + sh + 60);
}

async function fontesProntas() {
  try {
    await Promise.all(["700 76px Inter", "600 44px Inter", "500 64px Inter"].map((f) => document.fonts.load(f)));
  } catch {}
}

async function gerarArquivo(dados) {
  await fontesProntas();
  const c = document.createElement("canvas");
  desenharPost(c, dados);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
  return new File([blob], "sexta-da-vitoria.png", { type: "image/png" });
}

function baixar(arquivo) {
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement("a");
  a.href = url; a.download = arquivo.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const podeCompartilharArquivo = (arquivo) => {
  try { return !!navigator.canShare && navigator.canShare({ files: [arquivo] }); } catch { return false; }
};

// ── Tela "Sexta da Vitória" ─────────────────────────────────────────────────
// C: cores do app. Button: o botão dos componentes. corDe(nome): cor da pastilha.
export function SextaDaVitoria({ C, Button, t, semana, programa = "Jornada AUGE", fraseInicial, nome, tags = [], corDe, onFechar, tk }) {
  const [frase, setFrase] = useState((fraseInicial || "").slice(0, LIMITE_FRASE));
  const [comHabitos, setComHabitos] = useState(false); // opcional, desligado de início
  const [ocupada, setOcupada] = useState(false);
  const previa = useRef(null);
  const dados = { t, semana, programa, frase, nome, tags: comHabitos ? tags : [], corDe };

  useEffect(() => {
    let vivo = true;
    fontesProntas().then(() => { if (vivo && previa.current) desenharPost(previa.current, dados); });
    return () => { vivo = false; };
  }, [frase, t, semana, programa, nome, comHabitos]);

  const postarStories = async () => {
    if (ocupada) return;
    setOcupada(true);
    try {
      try { await navigator.clipboard.writeText(ARROBA); } catch {}
      const arq = await gerarArquivo(dados);
      if (podeCompartilharArquivo(arq)) await navigator.share({ files: [arq] });
      else { baixar(arq); tk?.("Imagem salva. É só postar nos stories."); }
    } catch (e) {
      if (e?.name !== "AbortError") tk?.("Não deu para compartilhar agora.");
    }
    setOcupada(false);
  };

  const enviarWhats = async () => {
    if (ocupada) return;
    setOcupada(true);
    const texto = "Minha vitória da semana #SextaDaVitória";
    try {
      const arq = await gerarArquivo(dados);
      if (podeCompartilharArquivo(arq)) await navigator.share({ files: [arq], text: texto });
      else { baixar(arq); window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank"); }
    } catch (e) {
      if (e?.name !== "AbortError") tk?.("Não deu para compartilhar agora.");
    }
    setOcupada(false);
  };

  return (
    <div role="dialog" aria-label="Sexta da Vitória"
      style={{ position: "absolute", inset: 0, zIndex: 400, background: C.creme, overflowY: "auto", fontFamily: FONTE }}>
      <div style={{ padding: "24px 20px calc(24px + env(safe-area-inset-bottom))", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: C.primary }}>SEXTA DA VITÓRIA</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: C.obs }}>Sua vitória merece ser vista</h1>
        <p style={{ margin: "8px 0 0", fontSize: 17, lineHeight: 1.5, color: C.lt }}>
          Inspire outras mulheres. Quem vê o seu story pode te perguntar como começar.
        </p>

        {/* prévia: o mesmo desenho do post, em miniatura */}
        <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
          <canvas ref={previa} aria-label="Prévia do post"
            style={{ width: "min(62vw, 240px)", aspectRatio: "9 / 16", borderRadius: 22, boxShadow: "0 8px 24px rgba(31,26,23,.16)", display: "block" }} />
        </div>

        <label htmlFor="frase-post" style={{ display: "block", fontSize: 16, fontWeight: 600, color: C.obs, marginBottom: 6 }}>
          Sua frase para o post
        </label>
        <textarea id="frase-post" value={frase} maxLength={LIMITE_FRASE} onChange={(e) => setFrase(e.target.value.slice(0, LIMITE_FRASE))}
          placeholder="Escreva a sua vitória da semana"
          style={{ width: "100%", minHeight: 96, boxSizing: "border-box", background: C.branco, border: `1px solid ${C.lineForte}`, borderRadius: 12, padding: 12, fontSize: 17, lineHeight: 1.45, fontFamily: FONTE, color: C.obs, resize: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 15, color: C.lt, marginTop: 6, lineHeight: 1.45 }}>
          <span>Só muda o post. A sua vitória salva continua igual.</span>
          <span style={{ flexShrink: 0 }}>{frase.length}/{LIMITE_FRASE}</span>
        </div>

        {tags.length > 0 && (
          <label style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, minHeight: 48, cursor: "pointer", fontSize: 17, color: C.obs }}>
            <input type="checkbox" checked={comHabitos} onChange={(e) => setComHabitos(e.target.checked)}
              style={{ width: 24, height: 24, accentColor: C.primary, flexShrink: 0 }} />
            Mostrar meus hábitos da semana no post
          </label>
        )}

        <div style={{ background: C.blushBg, borderRadius: 14, padding: "12px 14px", marginTop: 16, fontSize: 16, lineHeight: 1.5, color: C.obs }}>
          Dica: ao postar, marque <strong>{ARROBA}</strong> no story. Assim suas amigas encontram o Clube com um toque. Já copiamos o @ para você.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <Button onClick={postarStories} carregando={ocupada}>Postar nos stories</Button>
          <Button variante="contorno" onClick={enviarWhats} disabled={ocupada}>Enviar no WhatsApp</Button>
          <Button variante="texto" onClick={onFechar}>Agora não</Button>
        </div>
      </div>
    </div>
  );
}
