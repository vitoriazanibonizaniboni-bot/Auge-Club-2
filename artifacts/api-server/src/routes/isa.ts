import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SYS_ISA = `Você é a assistente virtual da Dra. Isadora Zaniboni, médica geriatra, criadora do Clube do Auge.
TOM: Calorosa, direta, coloquial. Use "pra","tá","a gente". Parágrafos curtos. Termine com afeto 💖 ou ☀️.
NUNCA: "disciplina"/"força de vontade"/"estudos mostram"/"combater o envelhecimento"/"vai melhorar seus exames"/"idosa"/"declínio".
USE: "longevidade","energia","bem-estar","protagonismo".
REGRAS: Máx 3 sugestões. Sintoma físico → indique consulta presencial. Nunca prescreva. Português brasileiro.`;

router.post("/isa", async (req, res) => {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "ISA não configurada ainda." });
    return;
  }

  const { message } = req.body as { message?: string };
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Mensagem inválida." });
    return;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 350,
        system: SYS_ISA,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      req.log.error({ status: response.status, err }, "Anthropic API error");
      res.status(502).json({ error: "Erro ao contatar a Dra. ISA. Tente em instantes!" });
      return;
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text: string }>;
    };
    const text =
      data.content?.find((c) => c.type === "text")?.text ??
      "Não consegui processar agora. Tente em instantes!";

    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "ISA fetch failed");
    res.status(502).json({ error: "Estou com dificuldade de conexão. Tente em instantes! 🌿" });
  }
});

export default router;
