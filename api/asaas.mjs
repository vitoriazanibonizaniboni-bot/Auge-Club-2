// ─── Pagamento do Clube pelo Asaas ────────────────────────────────────────────
// O Asaas chama este endereço (webhook) a cada novidade de cobrança ou de
// assinatura. Aqui o Clube da aluna é estendido, marcado como atrasado ou
// cancelado — ninguém precisa conferir pagamento à mão.
//
// Configuração na Vercel (Production):
//   ASAAS_API_KEY        chave da API do Asaas (Integrações → Chave de API)
//   ASAAS_WEBHOOK_TOKEN  a mesma frase cadastrada no webhook do Asaas
//   ASAAS_AMBIENTE       "sandbox" durante os testes; vazio = produção
//   SUPABASE_SERVICE_ROLE_KEY (já existe)
//
// Regras (decisões da Vitória, 27–28/10/2026):
//  - A conta é achada pelo E-MAIL que a aluna usou no pagamento.
//  - Pagou (cartão confirmado ou Pix recebido): o Clube vale até 1 mês depois
//    do vencimento daquela cobrança, mais 3 dias de folga.
//  - Atrasou ou cancelou: o Clube vale até o fim do que já foi pago. Depois
//    disso ela sai do app sozinha e aparece no Painel em "Remover do grupo".
//  - Pagou antes de criar a conta: fica guardado em `assinaturas`; o banco
//    libera o Clube quando ela se cadastrar com o mesmo e-mail (migração 024).
// Sem biblioteca: chamadas diretas, como em lembretes.mjs.

const FOLGA_DIAS = 3;

const EVENTOS_PAGO = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const EVENTOS_ATRASO = new Set(["PAYMENT_OVERDUE"]);
const EVENTOS_ESTORNO = new Set(["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"]);
const EVENTOS_CANCELA = new Set(["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED"]);

// "2026-01-31" + 1 mês = "2026-02-28" (sem pular para março)
export function somaMeses(iso, n) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + n, 1));
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return alvo.toISOString().slice(0, 10);
}
export function somaDias(iso, n) {
  const d = new Date(iso.slice(0, 10) + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function hojeBR() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
const maior = (a, b) => (!a ? b : !b ? a : a > b ? a : b);

// O que cada aviso muda: { status, pagoAte }
export function efeitoDoEvento(evento, hoje = hojeBR()) {
  const tipo = evento?.event;
  const pg = evento?.payment;
  if (EVENTOS_PAGO.has(tipo) && pg?.dueDate) {
    return { status: "ativa", pagoAte: somaDias(somaMeses(pg.dueDate, 1), FOLGA_DIAS) };
  }
  if (EVENTOS_ATRASO.has(tipo)) return { status: "atrasada" };
  if (EVENTOS_ESTORNO.has(tipo)) return { status: "encerrada", pagoAte: somaDias(hoje, -1), corta: true };
  if (EVENTOS_CANCELA.has(tipo)) return { status: "cancelada" };
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!token || req.headers["asaas-access-token"] !== token) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const asaasKey = process.env.ASAAS_API_KEY;
  if (!supaUrl || !serviceKey || !asaasKey) {
    return res.status(503).json({ error: "Faltam variáveis na Vercel (Supabase ou Asaas)." });
  }
  const asaasBase = process.env.ASAAS_AMBIENTE === "sandbox" ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";

  const evento = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
  const rest = async (metodo, caminho, corpo, prefer = "return=minimal") => {
    const r = await fetch(`${supaUrl}/rest/v1/${caminho}`, { method: metodo, headers: { ...h, Prefer: prefer }, body: corpo ? JSON.stringify(corpo) : undefined });
    if (!r.ok) throw new Error(`${metodo} ${caminho.split("?")[0]}: ${r.status} ${await r.text()}`);
    return metodo === "GET" ? r.json() : null;
  };

  try {
    // O Asaas entrega "pelo menos uma vez": o mesmo aviso pode chegar de novo
    if (evento.id) {
      const ja = await rest("GET", `asaas_eventos?select=id&id=eq.${encodeURIComponent(evento.id)}`);
      if (ja.length) return res.status(200).json({ ok: true, repetido: true });
    }

    const efeito = efeitoDoEvento(evento);
    const pg = evento.payment;
    const sub = evento.subscription;
    const customerId = pg?.customer || sub?.customer;
    const subscriptionId = pg?.subscription || sub?.id || null;

    // Cobrança avulsa (fora de assinatura) ou aviso que não muda nada: só registra
    if (!efeito || !customerId || (pg && !pg.subscription)) {
      await registrar(rest, evento);
      return res.status(200).json({ ok: true, ignorado: true });
    }

    // Quem é a cliente: nome, e-mail e telefone vêm do cadastro dela no Asaas
    const rc = await fetch(`${asaasBase}/customers/${encodeURIComponent(customerId)}`, { headers: { access_token: asaasKey, "User-Agent": "clube-do-auge" } });
    if (!rc.ok) throw new Error(`Asaas customers: ${rc.status}`);
    const cli = await rc.json();
    const email = String(cli.email || "").trim().toLowerCase();
    const telefone = String(cli.mobilePhone || cli.phone || "").replace(/\D/g, "") || null;

    // Assinatura guardada (vale também para quem ainda não criou conta)
    const [antes] = await rest("GET", `assinaturas?select=pago_ate&asaas_customer_id=eq.${encodeURIComponent(customerId)}`);
    const pagoAte = efeito.corta ? efeito.pagoAte : maior(antes?.pago_ate, efeito.pagoAte) || null;
    await rest("POST", "assinaturas?on_conflict=asaas_customer_id", {
      asaas_customer_id: customerId,
      asaas_subscription_id: subscriptionId,
      email: email || null,
      nome: cli.name || null,
      telefone,
      status: efeito.status,
      pago_ate: pagoAte,
      atualizado_em: new Date().toISOString(),
    }, "resolution=merge-duplicates,return=minimal");

    // A conta dela no app, pelo e-mail (o app e o Supabase guardam em minúsculas)
    let conta = null;
    if (email) {
      [conta] = await rest("GET", `profiles?select=id,plano,clube_ate&email=eq.${encodeURIComponent(email)}`);
    }
    if (conta) {
      const mud = {
        clube_status: efeito.status,
        clube_origem: "asaas",
        asaas_customer_id: customerId,
        asaas_subscription_id: subscriptionId,
      };
      if (telefone) mud.telefone = telefone;
      if (efeito.corta) {
        mud.clube_ate = pagoAte;
      } else if (efeito.pagoAte) {
        mud.clube_ate = maior(conta.clube_ate, pagoAte);
        if (!conta.plano || conta.plano === "pendente") mud.plano = "comunidade";
        mud.dispensada_em = null;
        mud.grupo_removida_em = null; // voltou a pagar: pode voltar ao grupo
      }
      await rest("PATCH", `profiles?id=eq.${conta.id}`, mud);
      await rest("PATCH", `assinaturas?asaas_customer_id=eq.${encodeURIComponent(customerId)}`, { user_id: conta.id });
    }

    await registrar(rest, evento);
    return res.status(200).json({ ok: true, status: efeito.status, pago_ate: pagoAte, conta: !!conta });
  } catch (e) {
    // Erro: responde 500 para o Asaas tentar de novo mais tarde
    console.error("asaas", e?.message || e);
    return res.status(500).json({ error: "Falha ao processar o aviso." });
  }
}

async function registrar(rest, evento) {
  if (!evento.id) return;
  await rest("POST", "asaas_eventos?on_conflict=id", { id: evento.id, tipo: evento.event || null, payload: evento }, "resolution=ignore-duplicates,return=minimal");
}
