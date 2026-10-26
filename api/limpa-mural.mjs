// ─── Limpeza do Mural: posts com mais de 13 semanas ───────────────────────────
// Decisão da Vitória (26/10/2026): o Mural guarda só as últimas 13 semanas —
// a Jornada inteira (12 semanas) mais uma de folga, para não afetar a turma.
// Todo dia, de madrugada, apaga o post inteiro — foto, legenda, curtidas e
// comentários (estes saem junto, pela chave com "on delete cascade") — de
// todos os posts com mais de 91 dias (13 semanas), públicos e "Só você".
// Os registros de hábito (Trajetória) NÃO são afetados: ficam em outra tabela.
//
// Disparo: tarefa agendada da Vercel (vercel.json), com o CRON_SECRET.
// Teste sem apagar nada: /api/limpa-mural?simular=1 com o mesmo cabeçalho.
// Sem biblioteca: chamadas diretas à API do Supabase, como em lembretes.mjs
// (a pasta api/ não tem dependências instaladas próprias).

const DIAS = 91; // 13 semanas
const BUCKET = "posts";

// caminho do arquivo dentro do bucket, a partir do endereço público da foto
export function caminhoDaFoto(url) {
  if (!url || typeof url !== "string") return null;
  const marca = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marca);
  if (i < 0) return null;
  return decodeURIComponent(url.slice(i + marca.length).split("?")[0]);
}

export default async function handler(req, res) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers["authorization"] !== `Bearer ${segredo}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return res.status(503).json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY na Vercel." });
  const h = { apikey: chave, Authorization: `Bearer ${chave}`, "Content-Type": "application/json" };
  const rest = async (metodo, caminho, corpo) => {
    const r = await fetch(`${url}/rest/v1/${caminho}`, { method: metodo, headers: { ...h, Prefer: "return=minimal" }, body: corpo ? JSON.stringify(corpo) : undefined });
    if (!r.ok) throw new Error(`${metodo} ${caminho.split("?")[0]}: ${r.status} ${await r.text()}`);
    return metodo === "GET" ? r.json() : null;
  };
  const lista = (xs) => `(${xs.map((x) => `"${x}"`).join(",")})`;
  const simular = String(req.query?.simular || "") === "1";

  const limite = new Date(Date.now() - DIAS * 24 * 60 * 60 * 1000).toISOString();
  const resumo = { limite, simular, posts: 0, fotos: 0, erros: [] };

  try {
    // Em lotes, para não estourar o tempo da função com um Mural muito cheio
    for (let rodada = 0; rodada < 20; rodada++) {
      const velhos = await rest("GET", `feed?select=id,img_url&created_at=lt.${encodeURIComponent(limite)}&order=created_at.asc&limit=200`);
      if (!velhos?.length) break;
      const ids = velhos.map((p) => p.id);
      const fotos = velhos.map((p) => caminhoDaFoto(p.img_url)).filter(Boolean);
      if (simular) { resumo.posts += ids.length; resumo.fotos += fotos.length; break; }

      // denúncias apontam para o post ou para os comentários dele: saem antes,
      // senão a chave estrangeira pode impedir apagar o post
      const coms = await rest("GET", `comentarios?select=id&post_id=in.${encodeURIComponent(lista(ids))}`);
      // (se a tabela de denúncias não tiver uma dessas colunas, segue em frente)
      try { await rest("DELETE", `denuncias?post_id=in.${encodeURIComponent(lista(ids))}`); } catch {}
      const idsComs = (coms || []).map((c) => c.id);
      if (idsComs.length) { try { await rest("DELETE", `denuncias?comentario_id=in.${encodeURIComponent(lista(idsComs))}`); } catch {} }

      if (fotos.length) {
        const r = await fetch(`${url}/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: h, body: JSON.stringify({ prefixes: fotos }) });
        if (r.ok) resumo.fotos += fotos.length;
        else resumo.erros.push(`apagar fotos: ${r.status} ${await r.text()}`);
      }
      await rest("DELETE", `feed?id=in.${encodeURIComponent(lista(ids))}`);
      resumo.posts += ids.length;
      if (velhos.length < 200) break;
    }
  } catch (e) {
    resumo.erros.push(String(e.message || e));
  }

  console.log("limpa-mural", JSON.stringify(resumo));
  return res.status(resumo.erros.length ? 500 : 200).json(resumo);
}
