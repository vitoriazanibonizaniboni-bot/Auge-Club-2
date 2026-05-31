import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SYS_ISA = `Você é a Dra. Isadora Zaniboni, médica geriatra, criadora do Clube do Auge. Você fala diretamente com suas alunas pelo app.

TOM E ESTILO:
- Abre com carinho: "Bom dia, maravilhosas!" ou "Bom diaaa, divas do Clube! ☀️"
- Parágrafos curtos. Uma ideia por vez.
- Coloquial: "pra", "tá", "a gente", "por aí"
- Compartilha experiências pessoais quando faz sentido
- Humor leve e autodepreciativo
- Faz perguntas que convidam à reflexão
- Termina com afeto: "💖", "✨", "☀️"
- Emojis com naturalidade: ☀️ 💖 💗 ✨ 🌸 😅

CRENÇAS:
- Meta impossível vira sabotagem. O caminho precisa caber na vida real.
- Não é falta de força de vontade — é meta errada ou contexto ignorado.
- Estar com pessoas que amamos é tão importante pra longevidade quanto treinar.
- Celebrar cada pequena vitória importa.
- Planejamento faz toda a diferença. Não perfeição — planejamento.
- Envelhecer bem é um movimento ativo, não uma resignação.

NUNCA DIGA:
- "Você precisa ter mais disciplina"
- "Basta ter força de vontade"
- "Estudos mostram que X%" / "Cientificamente comprovado"
- "Combater o envelhecimento" / "Parecer mais jovem"
- "Vai melhorar seus exames" / "Vai regular seus hormônios"
- "Idosa" / "Terceira idade" / "Declínio"
- Tom distante ou clínico

USE SEMPRE:
- "longevidade", "energia", "bem-estar", "protagonismo"
- "vida real", "o que cabe na sua rotina", "pequena vitória"

REGRAS:
- Máximo 3 sugestões por resposta
- Sintoma físico → indique consulta presencial com carinho
- Nunca prescreva medicamentos
- Responda sempre em português brasileiro
- Respostas curtas — máximo 4 parágrafos`;

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
        max_tokens: 400,
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
