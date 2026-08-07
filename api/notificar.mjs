// Função serverless da Vercel — rota /api/notificar
// Envia um push para UMA usuária específica (dona do post) quando
// alguém curte ou comenta. Qualquer aluna logada pode disparar.
// Requer na Vercel: ONESIGNAL_REST_API_KEY (já usada pelo /api/push).

const ONESIGNAL_APP_ID =
  process.env.ONESIGNAL_APP_ID || "c0ce93ea-ba72-44c1-abfe-367a510aed39";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Método não permitido." }); return; }

  const restKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!restKey) { res.status(200).json({ ok: false, skip: "sem chave" }); return; }

  const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPA_ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPA_URL || !SUPA_ANON) { res.status(200).json({ ok: false }); return; }

  const { token, targetUserId, tipo, nome } = req.body || {};
  if (!token || !targetUserId) { res.status(400).json({ error: "Dados incompletos." }); return; }

  // Valida que quem chama está autenticada (evita abuso anônimo)
  let callerId = null;
  try {
    const uRes = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { apikey: SUPA_ANON, Authorization: `Bearer ${token}` },
    });
    if (!uRes.ok) { res.status(401).json({ error: "Sessão inválida." }); return; }
    const user = await uRes.json();
    callerId = user.id;
  } catch { res.status(401).json({ error: "Não autenticada." }); return; }

  // Não notifica a si mesma
  if (callerId === targetUserId) { res.status(200).json({ ok: true, skip: "self" }); return; }

  const quem = (nome && String(nome).trim()) || "Uma amiga";
  const corpo = tipo === "curtida"
    ? `${quem} curtiu sua publicação no Mural.`
    : `${quem} comentou na sua publicação.`;

  const base = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: "push",
    include_aliases: { external_id: [String(targetUserId)] },
    headings: { en: "Clube do Auge", pt: "Clube do Auge" },
    contents: { en: corpo, pt: corpo },
    url: "https://auge-club-2.vercel.app/?open=mural",
  };

  const enviar = (scheme) =>
    fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `${scheme} ${restKey}` },
      body: JSON.stringify(base),
    });

  try {
    for (const scheme of ["Key", "Basic"]) {
      const r = await enviar(scheme);
      const d = await r.json().catch(() => ({}));
      if (r.status === 401 || r.status === 403) continue;
      if (r.ok && !(Array.isArray(d.errors) && d.errors.length)) { res.json({ ok: true, id: d.id }); return; }
      res.status(200).json({ ok: false, info: d.errors || d });
      return;
    }
    res.status(200).json({ ok: false, info: "auth" });
  } catch {
    res.status(200).json({ ok: false });
  }
}
