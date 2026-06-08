# Clube do Auge — Instruções do Projeto

## O que é este projeto

PWA mobile-first de bem-estar e longevidade para mulheres 40+, criado para **Dra. Isadora Zaniboni** (médica geriatra, Florianópolis). Desenvolvido por **Vitória Zaniboni** sem experiência prévia em programação, usando Replit + Claude via Cowork.

---

## Links essenciais

| O quê | Onde |
|---|---|
| App ao vivo | https://auge-club--vitoriazaniboni.replit.app/ |
| Repositório | https://github.com/vitoriazanibonizaniboni-bot/Auge-Club |
| Supabase | projeto `clube-do-auge` |
| Arquivo principal | `artifacts/clube-do-auge/src/AugeApp.jsx` |

---

## Stack técnica

- **Frontend:** React/JSX, Vite, Tailwind CSS
- **Backend/Auth/Dados:** Supabase (auth + PostgreSQL)
- **Deploy:** Replit (conta bot: vitoriazanibonizaniboni-bot)
- **IA (ISA):** Anthropic API — modelo `claude-haiku-4-5-20251001`
- **Tipo:** PWA instalável no celular

---

## Como fazer mudanças no código

1. Clonar o repo: `git clone https://TOKEN@github.com/vitoriazanibonizaniboni-bot/Auge-Club.git`
2. Editar `artifacts/clube-do-auge/src/AugeApp.jsx`
3. Commit + push com o Personal Access Token da Vitória
4. No Replit: botão **↻** (fetch) → **Pull** → **Republish**

> **Importante:** Vitória não é desenvolvedora. Ela faz o Pull e Republish no Replit manualmente. Sempre instruí-la ao final de cada push.

---

## Estrutura de planos

| Funcionalidade | Comunidade | Jornada AUGE |
|---|---|---|
| Check-in diário | simplificado | completo (hábitos + emoção + microdiário) |
| Mural do 1% | ✓ | ✓ |
| Biblioteca de conteúdo | ✓ | ✓ |
| Radar de Amigas | ✓ | ✓ |
| Trilha 12 semanas | 🔒 | ✓ liberada cronologicamente |
| Roda AUGE | básica | completa com comparativo S1/S6/S12 |
| Protocolo de Retomada | tela explicativa | ✓ completo |
| ISA | ✓ | ✓ com contexto completo |

**Fluxo de ativação:** cadastro → `plano: 'pendente'` → Dra. Isadora ativa manualmente no Supabase (Table Editor → profiles → coluna `plano`).

---

## Tabelas no Supabase

| Tabela | Campos principais |
|---|---|
| `profiles` | `id, nome, plano, habito_1, habito_2, habito_3, email, lgpd_aceito, data_cadastro, avatar_url, radar_cidade, radar_interesses` |
| `checkins` | `id, user_id, data, hab_feitos, hab_nao_feitos, total_feitos, total, percentual, chips, nota, retomada` |
| `feed` | `id, user_id, autor_nome, autor_ini, autor_cor, titulo, descricao, img_url, publica, curtidas, comentarios, created_at` |
| `porques` | `user_id, p1, p2, p3, updated_at` |
| `vitorias` | `id, user_id, texto, created_at` |
| `cartas` | `id, user_id, texto, data_abertura, created_at` |
| `ancora` | `user_id, texto` |
| `kit_emergencia` | `user_id, min_viavel, onde_apoio` |
| `videos` | `id, titulo, descricao, url_youtube, categoria, plano_minimo, duracao, ativo, ordem` |
| `config` | `id, valor` (chaves: `mentoria_data`, `mentoria_semana`, `mentoria_duracao`, `mentoria_zoom`) |

> **Hábitos angulares** ficam em `profiles.habito_1/2/3` — NÃO em tabela separada.

---

## Check-in diário (ordem obrigatória)

1. **Hábitos angulares** — 3 hábitos personalizados definidos pela aluna
2. **Chips emocionais** — até 2 de 5 opções: Cansada 😮‍💨 · Ansiosa 🌀 · Energizada 🔋 · Forte ⚡ · Progredindo 📈
3. **Microdiário** — texto livre opcional (botão "Pular" sem culpa)
4. **Fechamento** — percentual em itálico dourado + pontos + resposta da ISA

---

## Vocabulário obrigatório do produto

| ❌ Nunca usar | ✓ Usar sempre |
|---|---|
| treino / exercício | movimento |
| chatbot / IA | ISA |
| usuária | aluna |
| hábitos | hábitos angulares |

---

## Design

- **Paleta:** tons escuros, dourado `#C4A882`, blush `#E2B9A8`, fundo `#1C1A17`
- **Tipografia:** Cormorant Garamond (títulos), Inter (corpo)
- **Tom:** acolhedor, nunca punitivo, nunca usa linguagem de culpa
- **Calendário:** dourado = check-in completo · dourado claro = parcial · blush = recuperação · nunca vermelho

---

## Regras para o assistente (Claude)

1. **Nunca reescrever o que já funciona** sem ser solicitado
2. **Testar uma correção por vez** — não mudar várias coisas ao mesmo tempo
3. **Qualquer mudança no Supabase** deve vir acompanhada do SQL correspondente
4. **Para demos:** remover bloqueios de plano temporariamente (cadeados, paywall, tela de pendente)
5. **Commits** devem ter mensagem clara em português descrevendo o que foi corrigido e por quê

---

## Estado atual (atualizado em 2026-06-07)

- Bloqueios de plano **removidos temporariamente** para demo
- Diagnóstico de Sabotadores comentado (não bloqueia entrada)
- Hábitos salvos em `profiles.habito_1/2/3`
- Posts privados agora são salvos no banco e visíveis para a própria aluna
- Botão "Como foi?" no Mural é **opcional**
