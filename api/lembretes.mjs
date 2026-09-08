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
//   0 20 * * 5    -> sexta 17h (Brasília)
//   0 22 * * 0    -> domingo 19h
//   0 22 * * 1-6  -> seg a sab 19h, so para quem esta presente mas nao marcou
//                    algum habito liberado hoje
//   0 23 * * *    -> todo dia 20h, so para quem sumiu ha 2+ dias
//
// Os dois ultimos nunca alcancam a mesma aluna na mesma noite: o das 19h so
// olha quem apareceu ontem ou hoje, e o das 20h so quem NAO apareceu. Cada
// aluna recebe no maximo um por noite, com o tom certo para a situacao dela.
// O das 19h nao roda no domingo porque o Reforco do 1% ja ocupa esse horario.
//
// O "?g=..." continua valendo para disparo manual, em teste.
//
// Variáveis necessárias na Vercel:
//   ONESIGNAL_REST_API_KEY   (já usada por /api/push e /api/notificar)
//   CRON_SECRET              (a Vercel envia sozinha no cabeçalho das tarefas agendadas)
//   SUPABASE_SERVICE_ROLE_KEY  — para os gatilhos "diario" e "dois-dias", que
//                                precisam ler os registros de todas as alunas

const ONESIGNAL_APP_ID =
  process.env.ONESIGNAL_APP_ID || "c0ce93ea-ba72-44c1-abfe-367a510aed39";
const APP_URL = "https://auge-club-2.vercel.app";

// Qual lembrete cada horario de vercel.json representa
const AGENDAS = {
  "0 20 * * 5": "sexta",
  "0 22 * * 0": "domingo",
  "0 22 * * 1-6": "diario",
  "0 23 * * *": "dois-dias",
};

// Os 3 habitos angulares, na ordem em que aparecem no app.
//   unlock  — semana da Jornada em que o habito libera
//   ontem   — o Sono e registrado referente a NOITE ANTERIOR
// O texto nao e fixo por habito: sai do template em textoLembrete(), com o
// nome e a sequencia da aluna. Os tres nomes sao masculinos, entao "Seu" serve
// para todos. Habito criado pela aluna nao usa artigo, porque o nome e livre
// e nao da para saber o genero de "Agua" ou "Alongamento" sem chutar.
const HABITOS = [
  { id: "movimento", nome: "Movimento", unlock: 1, ontem: false },
  { id: "sono", nome: "Sono", unlock: 5, ontem: true },
  { id: "tempo", nome: "Tempo para Si", unlock: 9, ontem: false },
];

// Quantos dias seguidos ja contam como sequencia digna de comemorar.
const SEQ_MINIMA = 3;

// Template do lembrete (secao 9). Nunca fala em perder sequencia nem em
// quebrar progresso: o publico ja vive o ciclo comecar-parar-culpa, e ameaca
// de perda reforca exatamente esse padrao. So convite ou celebracao.
function textoLembrete({ nome, pessoal, seq }) {
  if (seq >= SEQ_MINIMA) {
    return `${seq} dias seguidos de ${nome}. Hoje pode ser mais um.`;
  }
  if (pessoal) {
    // Nome na frente: a notificacao fechada corta o fim, e o nome e a unica
    // parte que muda de aluna para aluna. Sem artigo e sem particípio, porque
    // o nome e livre e "Sua Alongamento" ou "Agua marcado" sairiam errados.
    return `${nome}: ainda dá tempo hoje.`;
  }
  return `Seu ${nome} ainda não foi hoje. Ainda dá tempo, mesmo que seja o mínimo.`;
}

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
// Segunda-feira da semana de uma data ISO (a semana do metodo comeca na segunda)
function segundaDe(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0 = domingo
  dt.setUTCDate(dt.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return dt.toISOString().slice(0, 10);
}

// Semana da Jornada, igual ao calculo do app: semanas inteiras entre a segunda
// de hoje e a segunda do inicio, limitado entre 1 e 12.
function semanaDaJornada(hoje, inicio) {
  if (!inicio) return 1;
  const a = new Date(segundaDe(hoje) + "T00:00:00Z");
  const b = new Date(segundaDe(String(inicio).slice(0, 10)) + "T00:00:00Z");
  const semanas = Math.floor((a - b) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(12, Math.max(1, semanas));
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

// Lembrete das 19h — quem esta presente mas ainda nao marcou algum habito.
// Devolve uma lista de { texto, ids }: alunas que tem o mesmo texto vao no
// mesmo envio, porque o OneSignal manda um conteudo por chamada.
//
// Cobre os 3 angulares E os habitos que a aluna criou (habitos_pessoais).
// Manda UM lembrete por aluna, sobre UM habito, mesmo que varios estejam
// pendentes: notificacao com lista vira bloco de texto que o celular corta.
// A escolha do habito prioriza quem tem sequencia ativa — celebrar o que ja
// existe convida melhor do que apontar o que falta.
async function lembretesDoDia(supaUrl, serviceKey) {
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const hoje = hojeBR();
  const ontem = menosDias(hoje, 1);
  // 60 dias bastam para qualquer sequencia que valha a pena comemorar
  const desde = menosDias(hoje, 60);

  const [pRes, cRes, rRes, hpRes] = await Promise.all([
    fetch(`${supaUrl}/rest/v1/profiles?select=id,plano,data_cadastro&plano=in.(jornada,comunidade,admin)`, { headers: h }),
    fetch(`${supaUrl}/rest/v1/config?select=id,valor&id=eq.jornada_inicio`, { headers: h }),
    fetch(`${supaUrl}/rest/v1/registros?select=user_id,habito,data&data=gte.${desde}`, { headers: h }),
    fetch(`${supaUrl}/rest/v1/habitos_pessoais?select=id,user_id,nome,ativo&ativo=is.true`, { headers: h }),
  ]);
  if (!pRes.ok) throw new Error("Falha ao ler profiles");
  if (!rRes.ok) throw new Error("Falha ao ler registros");

  const alunas = await pRes.json();
  const cfg = cRes.ok ? await cRes.json() : [];
  const inicioTurma = cfg[0]?.valor || null;
  const registros = await rRes.json();
  // A tabela pode nao existir ainda num ambiente antigo: sem ela, so os 3 fixos
  const pessoais = hpRes.ok ? await hpRes.json() : [];

  // Indice: user_id -> Set("habito|data")
  const marcou = new Map();
  for (const r of registros) {
    if (!marcou.has(r.user_id)) marcou.set(r.user_id, new Set());
    marcou.get(r.user_id).add(`${r.habito}|${String(r.data).slice(0, 10)}`);
  }
  // Habitos pessoais por aluna
  const pessoaisDe = new Map();
  for (const hp of pessoais) {
    if (!pessoaisDe.has(hp.user_id)) pessoaisDe.set(hp.user_id, []);
    pessoaisDe.get(hp.user_id).push(hp);
  }

  // Dias seguidos de um habito, contando para tras a partir do dia anterior ao
  // que esta em aberto. Como o lembrete so existe quando o dia ainda nao foi
  // marcado, a sequencia e a que ela ja tem "ate ontem".
  const sequencia = (marcas, habId, diaAlvo) => {
    if (!marcas) return 0;
    let n = 0;
    let d = menosDias(diaAlvo, 1);
    while (marcas.has(`${habId}|${d}`)) { n++; d = menosDias(d, 1); }
    return n;
  };

  const porTexto = new Map();
  for (const a of alunas) {
    const marcas = marcou.get(a.id);
    // So fala com quem esta presente: apareceu ontem ou hoje. Quem sumiu ha
    // 2+ dias recebe o Protocolo de Retomada as 20h, com outro tom.
    const presente =
      marcas && [...marcas].some((k) => {
        const dia = k.split("|")[1];
        return dia === hoje || dia === ontem;
      });
    if (!presente) continue;

    const sem = semanaDaJornada(hoje, inicioTurma || a.data_cadastro);

    const candidatos = [];
    for (const hb of HABITOS) {
      if (sem < hb.unlock) continue; // habito ainda bloqueado para ela
      const alvo = hb.ontem ? ontem : hoje;
      if (marcas.has(`${hb.id}|${alvo}`)) continue;
      candidatos.push({ nome: hb.nome, pessoal: false, seq: sequencia(marcas, hb.id, alvo) });
    }
    for (const hp of pessoaisDe.get(a.id) || []) {
      if (marcas.has(`${hp.id}|${hoje}`)) continue;
      candidatos.push({ nome: hp.nome, pessoal: true, seq: sequencia(marcas, hp.id, hoje) });
    }
    if (!candidatos.length) continue; // fez tudo que estava liberado

    // Maior sequencia primeiro; empatando, a ordem em que aparecem no app
    candidatos.sort((x, y) => y.seq - x.seq);
    const texto = textoLembrete(candidatos[0]);

    if (!porTexto.has(texto)) porTexto.set(texto, []);
    porTexto.get(texto).push(a.id);
  }

  return [...porTexto].map(([texto, ids]) => ({ texto, ids }));
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

  // ── Lembrete das 19h: quem esta presente mas nao marcou algum habito ────────
  if (g === "diario") {
    const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supaUrl || !serviceKey) {
      res.status(503).json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY na Vercel." });
      return;
    }

    let grupos;
    try {
      grupos = await lembretesDoDia(supaUrl, serviceKey);
    } catch (e) {
      res.status(502).json({ error: String(e.message || e) });
      return;
    }
    if (!grupos.length) {
      res.json({ ok: true, gatilho: g, enviados: 0, motivo: "ninguem com habito pendente" });
      return;
    }

    const envios = [];
    for (const grupo of grupos) {
      const r = await enviarOneSignal(restKey, {
        app_id: ONESIGNAL_APP_ID,
        target_channel: "push",
        include_aliases: { external_id: grupo.ids.map(String) },
        headings: { en: "Clube do Auge", pt: "Clube do Auge" },
        contents: { en: grupo.texto, pt: grupo.texto },
        url: `${APP_URL}/?open=home`,
      });
      envios.push({ texto: grupo.texto, alvos: grupo.ids.length, ok: r.ok, erro: r.ok ? undefined : r.erro });
    }
    const falhou = envios.filter((e) => !e.ok);
    res.status(falhou.length === envios.length ? 502 : 200)
      .json({ ok: !falhou.length, gatilho: g, envios });
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
      url: `${APP_URL}/?open=kit`,
    });
    if (r.ok) { res.json({ ok: true, gatilho: g, alvos: ids.length, ...r }); return; }
    res.status(502).json({ error: "OneSignal recusou o envio.", info: r.erro });
    return;
  }

  res.status(400).json({ error: "Use ?g=sexta, ?g=domingo, ?g=diario ou ?g=dois-dias." });
}
