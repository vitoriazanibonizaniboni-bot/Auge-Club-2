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
  // App nativo (Capacitor / lojas): quem pede a permissão é o OneSignal nativo
  if (typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    try {
      const OS = (window.plugins && window.plugins.OneSignal) || window.OneSignal;
      if (OS && OS.Notifications && typeof OS.Notifications.requestPermission === "function") {
        const ok = await OS.Notifications.requestPermission(true);
        return ok ? "granted" : "denied";
      }
    } catch (e) {}
    return "unsupported";
  }
  if (!("Notification" in window)) return "unsupported";
  let result = Notification.permission;
  if (result !== "granted" && result !== "denied") {
    result = await Notification.requestPermission();
  }
  // Push de servidor (OneSignal): inscreve o aparelho quando a permissao e concedida
  if (result === "granted" && typeof window !== "undefined") {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try { await OneSignal.User.PushSubscription.optIn(); } catch (e) {}
    });
  }
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
export async function scheduleAll(diasSemCheckin = 0, nHab = 0) {
  if (Notification.permission !== "granted") return;

  const schedule = {};

  // Gatilho 1 — Regra dos 2 Dias (às 20h, só quando ≥ 2 dias sem checkin)
  if (diasSemCheckin >= 2) {
    const corpoRet = nHab > 1
      ? `Você tem ${nHab} hábitos para retomar. Sem cobrança, um de cada vez. Bora voltar hoje?`
      : "Tem um hábito te esperando pra retomar. Sem cobrança, no seu tempo. Bora voltar hoje?";
    schedule["g1_dois_dias"] = {
      title: "Clube do Auge",
      body: corpoRet,
      fireAt: nextDailyAt(20),
      url: BASE + "/?open=retomada",
      repeat: "daily",
    };
  }

  // Gatilho 2 — Ritual de Sexta (toda sexta às 17h)
  schedule["g2_sexta"] = {
    title: "Clube do Auge",
    body: "Hoje é sexta. Que tal comemorar a sua vitória da semana contando pra gente? Compartilhe no Mural do 1% — por menor que pareça, ela conta.",
    fireAt: nextWeekdayAt(5, 17),
    url: BASE + "/?open=mural",
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


// ─── ONESIGNAL NATIVO (Capacitor / apps das lojas) ───────────────────────────
// Roda só dentro do app nativo. No navegador (PWA) o SDK web continua cuidando.
const ONESIGNAL_APP_ID = "c0ce93ea-ba72-44c1-abfe-367a510aed39";
export function initOneSignalNative() {
  try {
    const isNative = typeof window !== "undefined" && window.Capacitor &&
      window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    if (!isNative) return;
    const OS = (window.plugins && window.plugins.OneSignal) || window.OneSignal;
    if (!OS || typeof OS.initialize !== "function") return;
    OS.initialize(ONESIGNAL_APP_ID);
    if (OS.Notifications && typeof OS.Notifications.requestPermission === "function") {
      OS.Notifications.requestPermission(true);
    }
    // Ao tocar na notificação, abre o deep-link do app (?open=...)
    if (OS.Notifications && typeof OS.Notifications.addEventListener === "function") {
      OS.Notifications.addEventListener("click", (ev) => {
        try {
          const url = (ev && ev.notification && ev.notification.additionalData && ev.notification.additionalData.url) ||
            (ev && ev.result && ev.result.url);
          if (url) window.location.href = url;
        } catch (e) {}
      });
    }
  } catch (e) {}
}
