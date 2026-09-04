// Função serverless da Vercel — rota /api/lembretes
// Dispara os 3 gatilhos do método pelo OneSignal (push de servidor).
//
// Substitui o agendamento antigo, que vivia no Service Worker do navegador:
// a lista de horários ficava só na memória e o celular apagava esse processo
// quando o app saía de uso, então os lembretes nunca chegavam.
//
// As três tarefas agendadas em vercel.json apontam para ESTE MESMO endereço.
// A Vercel nao aceita diferencia-las por "?g=..." no caminho — ela ignora a
// parte depois do "?" e registra uma tarefa so. O jeito suportado e declarar
// o mesmo caminho tres vezes, com horarios diferentes, e descobrir aqui dentro
// qual delas chamou lendo o cabecalho x-vercel-cron-schedule.
//
//   0 20 * * 5  -> sexta 17h (Brasília)
//   0 22 * * 0  -> domingo 19h
//   0 23 * * *  -> todo dia 20h, só para quem está há 2+ dias sem check-in
//
// O "?g=..." continua valendo para disparo manual, em teste.
//
// Variáveis necessárias na Vercel:
//   ONESIGNAL_REST_API_KEY   (já usada por /api/push e /api/notificar)
//   CRON_SECRET              (a Vercel envia sozinha no cabeçalho das tarefas agendadas)
//   SUPABASE_SERVICE_ROLE_KEY  — só para o gatilho "dois-dias", que precisa ler
//                                os check-ins de todas as alunas

const ONESIGNAL_APP_ID =
  process.env.ONESIGNAL_APP_ID || "c0ce93ea-ba72-44c1-abfe-367a510aed39";
const APP_URL = "https://auge-club-2.vercel.app";

// Qual lembrete cada horario de vercel.json representa
const AGENDAS = {
  "0 20 * * 5": "sexta",
  "0 22 * * 0": "domingo",
  "0 23 * * *": "dois-dias",
};

const TEXTOS = {
  sexta: {
    corpo:
      "Hoje é sexta. Que tal comemorar a sua vitória da semana contando pra gente? " +
      "Compartilhe no Mural do 1% — por menor que pareça, ela conta.",
    url: `${APP_URL}/?open=mural`,
  },
  domingo: {
    corpo:
      "Esqueça a busca pela semana perfeita de domingo à noite. Amanhã começamos " +
      "focando apenas no pequeno, repetido e infinito. Qual será o seu 1% para essa segunda-feira?",
    url: `${APP_URL}/?open=home`,
  },
};

// Data de hoje em Brasília, no formato YYYY-MM-DD
function hojeBR() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
function menosDias(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - n));
  return dt.toISOString().slice(0, 10);
}

// Envia pelo OneSignal aceitando a chave nova ("Key") e a legada ("Basic")
async function enviarOneSignal(restKey, payload) {
  let ultimo = null;
  for (const scheme of ["Key", "Basic"]) {
    const r = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `${scheme} ${restKey}`,
      },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 || r.status === 403) { ultimo = "auth"; continue; }
    if (r.ok && !(Array.isArray(d.errors) && d.errors.length)) {
      return { ok: true, id: d.id, recipients: d.recipients ?? null };
    }
    ultimo = (Array.isArray(d.errors) && d.errors[0]) || d;
  }
  return { ok: false, erro: ultimo };
}

// Quem sumiu ha 2+ dias (e tem o app liberado).
//
// "Apareceu" nao e so fechar o check-in completo: marcar um habito angular
// tambem conta. Sao tabelas diferentes — o check-in grava em `checkins` e o
// botao do habito grava em `registros` — e olhar so a primeira faria o app
// cobrar quem entrou e marcou os habitos. O Painel da Mentora ja trata as
// duas como atividade; aqui passa a tratar tambem.
async function alunasSemCheckin(supaUrl, serviceKey) {
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  const pRes = await fetch(
    `${supaUrl}/rest/v1/profiles?select=id,plano&plano=in.(jornada,comunidade,admin)`,
    { headers: h }
  );
  if (!pRes.ok) throw new Error("Falha ao ler profiles");
  const alunas = await pRes.json();
  if (!alunas.length) return [];

  const hoje = hojeBR();
  const limite = menosDias(hoje, 1); // apareceu ontem ou hoje = não incomoda

  const [cRes, rRes] = await Promise.all([
    fetch(`${supaUrl}/rest/v1/checkins?select=user_id&data=gte.${limite}`, { headers: h }),
    fetch(`${supaUrl}/rest/v1/registros?select=user_id&data=gte.${limite}`, { headers: h }),
  ]);
  if (!cRes.ok) throw new Error("Falha ao ler checkins");
  if (!rRes.ok) throw new Error("Falha ao ler registros");

  const recentes = new Set();
  for (const linha of await cRes.json()) recentes.add(linha.user_id);
  for (const linha of await rRes.json()) recentes.add(linha.user_id);

  return alunas.map((a) => a.id).filter((id) => !recentes.has(id));
}

export default async function handler(req, res) {
  // A Vercel envia o CRON_SECRET no cabeçalho das tarefas agendadas.
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.authorization !== `Bearer ${segredo}`) {
    res.status(401).json({ error: "Não autorizado." });
    return;
  }

  const restKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!restKey) {
    res.status(503).json({ error: "Falta ONESIGNAL_REST_API_KEY na Vercel." });
    return;
  }

  // Nas tarefas agendadas o gatilho vem pelo horario; no disparo manual, por ?g=
  const agenda = String(req.headers?.["x-vercel-cron-schedule"] || "")
    .trim()
    .replace(/\s+/g, " ");
  const g = String(req.query?.g || AGENDAS[agenda] || "");

  // ── Sexta e domingo: mensagem igual para todas ──────────────────────────────
  if (g === "sexta" || g === "domingo") {
    const t = TEXTOS[g];
    const base = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: "Clube do Auge", pt: "Clube do Auge" },
      contents: { en: t.corpo, pt: t.corpo },
      url: t.url,
    };
    // Contas novas do OneSignal usam "Total Subscriptions"; as antigas, "Subscribed Users"
    for (const segs of [["Total Subscriptions"], ["Subscribed Users"], ["Active Subscriptions"]]) {
      const r = await enviarOneSignal(restKey, { ...base, included_segments: segs });
      if (r.ok) { res.json({ ok: true, gatilho: g, ...r }); return; }
      if (r.erro === "auth") { res.status(502).json({ error: "Chave do OneSignal recusada." }); return; }
    }
    res.status(502).json({ error: "Nenhum segmento do OneSignal aceitou o envio." });
    return;
  }

  // ── Regra dos 2 Dias: só para quem sumiu ────────────────────────────────────
  if (g === "dois-dias") {
    const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supaUrl || !serviceKey) {
      res.status(503).json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY na Vercel." });
      return;
    }

    let ids;
    try {
      ids = await alunasSemCheckin(supaUrl, serviceKey);
    } catch (e) {
      res.status(502).json({ error: String(e.message || e) });
      return;
    }
    if (!ids.length) { res.json({ ok: true, gatilho: g, enviados: 0, motivo: "todas apareceram" }); return; }

    const corpo =
      "Dois dias. Não precisa ser perfeito, precisa ser hoje. " +
      "Sem cobrança, um hábito de cada vez — bora voltar?";
    const r = await enviarOneSignal(restKey, {
      app_id: ONESIGNAL_APP_ID,
      target_channel: "push",
      include_aliases: { external_id: ids.map(String) },
      headings: { en: "Clube do Auge", pt: "Clube do Auge" },
      contents: { en: corpo, pt: corpo },
      url: `${APP_URL}/?open=retomada`,
    });
    if (r.ok) { res.json({ ok: true, gatilho: g, alvos: ids.length, ...r }); return; }
    res.status(502).json({ error: "OneSignal recusou o envio.", info: r.erro });
    return;
  }

  res.status(400).json({ error: "Use ?g=sexta, ?g=domingo ou ?g=dois-dias." });
}
