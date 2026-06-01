// ─── NOTIFICAÇÕES LOCAIS — CLUBE DO AUGE ─────────────────────────────────────
// Agenda as 3 notificações-gatilho via Service Worker.
// Não depende de servidor de push — tudo local no dispositivo da aluna.

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

// Próxima ocorrência de um dia-da-semana (0=Dom…6=Sáb) em um horário fixo.
// Se o alvo já passou hoje/nessa semana, vai para a próxima.
function nextWeekdayAt(weekday, hour, minute = 0) {
  const now = new Date();
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  let diff = (weekday - d.getDay() + 7) % 7;
  if (diff === 0 && d.getTime() <= now.getTime()) diff = 7;
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

// Próximo hoje às <hour>h (ou amanhã se já passou).
function nextDailyAt(hour, minute = 0) {
  const now = new Date();
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

// ─── Solicitar permissão ──────────────────────────────────────────────────────
export async function requestPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result; // "granted" | "denied" | "default"
}

// ─── Enviar schedule ao SW ────────────────────────────────────────────────────
async function postToSW(msg) {
  if (!("serviceWorker" in navigator)) return;
  // Aguarda o SW estar ativo
  const reg = await navigator.serviceWorker.ready;
  const ctrl = navigator.serviceWorker.controller || reg.active;
  if (ctrl) ctrl.postMessage(msg);
}

// ─── Agendar os 3 gatilhos ────────────────────────────────────────────────────
// diasSemCheckin: calculado pelo app (diasSemTreino no estado global)
export async function scheduleAll(diasSemCheckin = 0) {
  if (Notification.permission !== "granted") return;

  const schedule = {};

  // Gatilho 1 — Regra dos 2 Dias (às 20h, só quando ≥ 2 dias sem checkin)
  if (diasSemCheckin >= 2) {
    schedule["g1_dois_dias"] = {
      title: "Clube do Auge",
      body: "Dois dias. É agora. Não precisa ser perfeito. Precisa ser hoje. Toque aqui — você sabe o caminho.",
      fireAt: nextDailyAt(20),
      url: BASE + "/?open=retomada",
      repeat: "daily",
    };
  }

  // Gatilho 2 — Ritual de Sexta (toda sexta às 17h)
  schedule["g2_sexta"] = {
    title: "Clube do Auge",
    body: "Mais uma semana concluída na sua construção de longevidade. Qual foi a sua pequena vitória desses últimos dias, por menor que pareça? Entre no app e registre.",
    fireAt: nextWeekdayAt(5, 17),
    url: BASE + "/?open=escritas-vitorias",
    repeat: "weekly",
  };

  // Gatilho 3 — Reforço do 1% (todo domingo às 19h)
  schedule["g3_domingo"] = {
    title: "Clube do Auge",
    body: "Esqueça a busca pela semana perfeita de domingo à noite. Amanhã começamos focando apenas no pequeno, repetido e infinito. Qual será o seu 1% para essa segunda-feira?",
    fireAt: nextWeekdayAt(0, 19),
    url: BASE + "/?open=home",
    repeat: "weekly",
  };

  await postToSW({ type: "SCHEDULE_NOTIFICATIONS", schedule });
}

export async function clearAll() {
  await postToSW({ type: "CLEAR_NOTIFICATIONS" });
}
