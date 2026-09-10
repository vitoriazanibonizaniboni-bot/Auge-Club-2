import { createClient } from "@supabase/supabase-js";

const CRON_SECRET = process.env.CRON_SECRET;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Validar token CRON
  if (req.headers["authorization"] !== `Bearer ${CRON_SECRET}`) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    // Calcular datas: semana anterior (segunda a domingo)
    const hoje = new Date();
    const diaDaSemana = hoje.getUTCDay(); // 0 = domingo, 1 = segunda
    
    // Ir até a segunda-feira passada
    const diasParaVoltar = (diaDaSemana === 0 ? 1 : diaDaSemana + 6);
    const inicioSemanaAnterior = new Date(hoje);
    inicioSemanaAnterior.setUTCDate(hoje.getUTCDate() - diasParaVoltar);
    inicioSemanaAnterior.setUTCHours(0, 0, 0, 0);
    
    const fimSemanaAnterior = new Date(inicioSemanaAnterior);
    fimSemanaAnterior.setUTCDate(inicioSemanaAnterior.getUTCDate() + 6);
    fimSemanaAnterior.setUTCHours(23, 59, 59, 999);

    console.log(
      `Calculando destaque: ${inicioSemanaAnterior.toISOString()} a ${fimSemanaAnterior.toISOString()}`
    );

    // Buscar todas as turmas
    const { data: turmas, error: turmasErr } = await supabase
      .from("turmas")
      .select("id");

    if (turmasErr) throw turmasErr;

    // Para cada turma, encontrar post com mais curtidas
    for (const turma of turmas) {
      // Remover destaque dos posts antigos
      await supabase
        .from("feed")
        .update({ destaque_semana: false })
        .eq("turma_id", turma.id);

      // Buscar post com mais curtidas da semana anterior
      const { data: posts, error: postsErr } = await supabase
        .from("feed")
        .select("id, cur")
        .eq("turma_id", turma.id)
        .gte("created_at", inicioSemanaAnterior.toISOString())
        .lte("created_at", fimSemanaAnterior.toISOString())
        .order("created_at", { ascending: false });

      if (postsErr) {
        console.error(`Erro ao buscar posts da turma ${turma.id}:`, postsErr);
        continue;
      }

      // Encontrar post com maior array de curtidas
      if (posts.length > 0) {
        const postDestaque = posts.reduce((max, post) => {
          const curtasAtual = (post.cur || []).length;
          const curtasMax = (max.cur || []).length;
          return curtasAtual > curtasMax ? post : max;
        });

        // Marcar como destaque
        await supabase
          .from("feed")
          .update({ destaque_semana: true })
          .eq("id", postDestaque.id);

        console.log(
          `Destaque turma ${turma.id}: ${postDestaque.id} (${
            (postDestaque.cur || []).length
          } curtidas)`
        );
      }
    }

    res.status(200).json({ success: true, message: "Destaque semanal atualizado" });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: err.message });
  }
}
