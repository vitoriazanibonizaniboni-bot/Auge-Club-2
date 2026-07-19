// Função serverless da Vercel — rota /api/push
// Envia uma notificação push (OneSignal) para todas as alunas inscritas.
// Só a mentora (profiles.plano === 'admin') pode disparar.
// Requer na Vercel a variável: ONESIGNAL_REST_API_KEY
// Opcional: ONESIGNAL_APP_ID (senão usa o App ID público do app).

const ONESIGNAL_APP_ID =
  process.env.ONESIGNAL_APP_ID || "c0ce93ea-ba72-44c1-abfe-367a510aed39";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }

  const restKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!restKey) {
    res.status(503).json({
      error: "Envio ainda não configurado (falta a chave do OneSignal na Vercel).",
    });
    return;
  }

  const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPA_ANON =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPA_URL || !SUPA_ANON) {
    res.status(503).json({ error: "Verificação de acesso indisponível." });
    return;
  }

  const { title, message, sendAt, token } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Escreva a mensagem." });
    return;
  }
  if (message.length > 500) {
    res.status(400).json({ error: "Mensagem longa demais (máx. 500 caracteres)." });
    return;
  }
  if (!token) {
    res.status(401).json({ error: "Não autenticada." });
    return;
  }

  // 1) Confirma que quem chama é a mentora (plano === 'admin')
  try {
    const uRes = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { apikey: SUPA_ANON, Authorization: `Bearer ${token}` },
    });
    if (!uRes.ok) {
      res.status(401).json({ error: "Sessão inválida. Entre novamente." });
      return;
    }
    const user = await uRes.json();
    const pRes = await fetch(
      `${SUPA_URL}/rest/v1/profiles?id=eq.${user.id}&select=plano`,
      { headers: { apikey: SUPA_ANON, Authorization: `Bearer ${token}` } }
    );
    const rows = pRes.ok ? await pRes.json() : [];
    if (rows?.[0]?.plano !== "admin") {
      res.status(403).json({ error: "Só a mentora pode enviar notificações." });
      return;
    }
  } catch {
    res.status(401).json({ error: "Não foi possível validar o acesso." });
    return;
  }

  // 2) Monta e dispara via OneSignal
  const titulo = (title && title.trim()) || "Clube do Auge";
  const corpo = message.trim();
  const base = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: titulo, pt: titulo },
    contents: { en: corpo, pt: corpo },
  };
  if (sendAt) base.send_after = sendAt; // ISO 8601 (UTC) — agendamento

  // Tenta os nomes de segmento possiveis (contas novas usam "Total Subscriptions")
  const SEGMENTOS = [["Total Subscriptions"], ["Subscribed Users"], ["Active Subscriptions"]];
  // Aceita a chave nova (Authorization: Key ...) e a legada (Basic ...)
  const enviar = (scheme, segs) =>
    fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `${scheme} ${restKey}`,
      },
      body: JSON.stringify({ ...base, included_segments: segs }),
    });

  try {
    let ultimoErro = "O OneSignal recusou o envio.";
    for (const scheme of ["Key", "Basic"]) {
      let authFalhou = false;
      for (const segs of SEGMENTOS) {
        const r = await enviar(scheme, segs);
        const d = await r.json().catch(() => ({}));
        if (r.status === 401 || r.status === 403) { authFalhou = true; break; }
        if (r.ok && !(Array.isArray(d.errors) && d.errors.length)) {
          res.json({ ok: true, id: d.id, recipients: d.recipients ?? null });
          return;
        }
        if (Array.isArray(d.errors) && d.errors.length) ultimoErro = d.errors[0];
      }
      if (!authFalhou) break; // auth funcionou, mas nenhum segmento entregou
    }
    res.status(502).json({ error: String(ultimoErro) });
  } catch {
    res.status(502).json({ error: "Erro ao contatar o OneSignal." });
  }
}
