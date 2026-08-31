# Clube do Auge — Instruções do Projeto

## O que é este projeto

App mobile de bem-estar e longevidade para mulheres 40+, criado para **Dra. Isadora Zaniboni** (médica geriatra, Florianópolis). Desenvolvido por **Vitória Zaniboni** sem experiência prévia em programação, com apoio do Claude.

Publicado no **Android**, em processo de envio para o **iOS**.

---

## Links essenciais

| O quê | Onde |
|---|---|
| App ao vivo | https://auge-club-2.vercel.app |
| Repositório | https://github.com/vitoriazanibonizaniboni-bot/Auge-Club-2 |
| Vercel | time `clubedoauge`, projeto `auge-club-2` |
| Supabase | projeto `clube-do-auge` |
| Arquivo principal | `artifacts/jornada-auge/src/AugeApp.jsx` (~13.000 linhas) |

---

## Stack técnica

- **Frontend:** React/JSX, Vite 7, Tailwind CSS, componentes shadcn/ui
- **Backend/Auth/Dados:** Supabase (auth + PostgreSQL + Storage)
- **Deploy:** Vercel, conectado ao GitHub — todo push no `main` publica automaticamente
- **App nativo:** Capacitor 8 — `appId: com.clubedoauge.jornada`, nome "Clube do Auge"
- **Push:** OneSignal (SDK web no navegador + plugin Cordova no app nativo)
- **ISA:** Anthropic API, modelo `claude-haiku-4-5-20251001`, via `api/isa.mjs`
- **Pacotes:** pnpm workspace

> **Não é mais Replit.** O projeto migrou para GitHub + Vercel. `.replit`, `.replitignore` e `replit.md` são resíduo da fase antiga e não afetam o deploy — `replit.md` inclusive ainda está com o texto de exemplo em branco.

---

## Estrutura do repositório

```
artifacts/jornada-auge/    ← APP ATIVO (APP_MODE = "jornada"). É o que a Vercel publica.
artifacts/clube-do-auge/   ← app irmão (APP_MODE = "clube"). NÃO está sendo publicado.
artifacts/api-server/      ← servidor Express (não usado no deploy atual)
api/                       ← funções serverless da Vercel: isa.mjs, notificar.mjs, push.mjs
```

O `vercel.json` da raiz builda **apenas** `@workspace/jornada-auge` e serve `artifacts/jornada-auge/dist/public`. Editar o `clube-do-auge` não muda nada no ar.

---

## Modelo de dois apps

`AugeApp.jsx` tem uma constante `APP_MODE` no topo:

- `"jornada"` → Jornada AUGE, programa de 12 semanas, tudo liberado, **sem** aba "encontrar amigas"
- `"clube"` → Clube do Auge, conteúdo semanal, **com** aba "Amigas", Jornada como vitrine trancada

`FORCED_PLANO` deriva daí: **o nível de acesso é definido pelo app instalado, não pelo Supabase.**

O campo `profiles.plano` ainda controla a **entrada**: `admin` vira mentora; `jornada` ou `comunidade` liberam o app; qualquer outro valor cai na tela "Aguardando liberação". A Dra. Isadora libera as alunas manualmente no Supabase (ou pelo Painel da Mentora, seção "Aguardando liberação").

---

## Como fazer mudanças

1. Editar `artifacts/jornada-auge/src/AugeApp.jsx`
2. **Rodar o build antes de publicar:**
   `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/jornada-auge build`
   (as duas variáveis são exigidas pelo `vite.config.ts` e o build falha sem elas)
3. Commit + push no `main`
4. A Vercel builda e publica sozinha (~1 minuto)
5. **O app do Android e do iOS pega a mudança na hora** — o `capacitor.config.ts` usa `server.url` apontando para a Vercel, então o app nativo carrega o site ao vivo

**Só exigem novo build e reenvio às lojas:** ícone, splash, permissões e plugins nativos.

### Publicando a partir de uma sessão do Claude na nuvem

O ambiente na nuvem do Claude **não consegue** dar push neste repositório — um filtro só autoriza repositórios registrados na sessão, e ele descarta qualquer token antes de usá-lo. O caminho que funciona é pelo **MacBook da Vitória**, conectado à sessão:

1. Clonar o repositório numa área temporária da máquina dela (`device_bash`)
2. Aplicar a alteração lá e conferir o checksum contra a versão testada
3. Push com token do GitHub de escopo fino, com **`Contents: Read and write`** e o repositório `Auge-Club-2` selecionado
4. Conferir o deploy pela ferramenta da Vercel
5. Pedir para a Vitória revogar o token depois

> Token sem `Contents: Read and write` falha com 403 mesmo pertencendo à dona do repositório. A resposta do GitHub traz o cabeçalho `x-accepted-github-permissions` dizendo o que faltou.

---

## Tabelas no Supabase

`profiles` · `checkins` · `registros` · `feed` · `comentarios` · `posts` · `porques` · `vitorias` · `cartas` / `carta_futuro` · `ancora` · `kit_emergencia` · `kit_usos` · `videos` · `guias` · `config` · `conexoes` · `mensagens` · `denuncias` · `bloqueios` · `habitos_angulares` · `habitos_metas` · `metas_historico` · `roda_auge` · `diagnostico` · `desafio_registros` · `avatars`

Migrações em `artifacts/jornada-auge/migrations/`.

Boa parte das leituras e escritas administrativas passa por **funções RPC** (`get_profiles_admin`, `get_pendentes_admin`, `admin_set_ancora`, `admin_set_porques`, `admin_set_metas`, `admin_set_perfil_auge`, `set_aluna_plano`, `toggle_comment_like`, `delete_my_account`, entre outras), não por SELECT direto — as políticas de segurança dependem disso. Ao mexer em algo administrativo, verificar se já existe RPC antes de criar consulta nova.

> **Hábitos angulares** ficam em `profiles.habito_1/2/3` — NÃO em tabela separada.

---

## Check-in diário (ordem obrigatória)

1. **Hábitos angulares** — 3 hábitos personalizados definidos pela aluna
2. **Chips emocionais** — até 2 de 5: Cansada 😮‍💨 · Ansiosa 🌀 · Energizada 🔋 · Forte ⚡ · Progredindo 📈
3. **Microdiário** — texto livre opcional, botão "Pular" sem culpa
4. **Fechamento** — percentual em itálico dourado + pontos + resposta da ISA

---

## Vocabulário obrigatório do produto

| ❌ Nunca usar | ✓ Usar sempre |
|---|---|
| treino / exercício | movimento |
| chatbot / IA | ISA |
| usuária | aluna |
| hábitos | hábitos angulares |

A ISA é baseada no método da Dra. Isadora e **não a impersona**. Aparece após o check-in, no Protocolo de Retomada e no Kit de Emergência.

---

## Design

- **Paleta:** fundo `#1C1A17`, creme `#FAF6EE`, dourado `#C4A882`, dourado escuro `#A8865A`, blush `#E2B9A8`
- **Dourado de texto:** `C.ouroTxt` (`#7E6038`) é a ÚNICA cor dourada permitida para texto sobre fundo claro — 5,39:1 no creme e 4,86:1 nas pastilhas douradas. `C.ouro` e `C.ouroDk` ficam para bordas, ícones e fundos; como texto dão 2,10:1 e 3,13:1, abaixo do mínimo de 4,5:1
- **Botão de fundo dourado leva texto escuro** (`C.obs`), nunca branco ou creme
- **Legibilidade (público 40+):** peso mínimo 400 em texto de até 19px; sem itálico em texto corrido (a única exceção é o percentual de 56px do fechamento do check-in); Cormorant Garamond só em título — texto corrido é sempre Inter
- **Tipografia:** Cormorant Garamond (títulos), Inter (corpo)
- **Tom:** acolhedor, nunca punitivo, nunca linguagem de culpa
- **Calendário:** dourado = completo · dourado claro = parcial · blush = recuperação · **nunca vermelho**
- **Navegação:** 5 abas fixas — Início · Mural · Jornada · Conteúdo · Perfil
- **Mural:** a reação é **"Curtir"** com coração. O antigo "💛 Te entendo" foi removido do código.
- **Mural, card do feed:** a foto usa proporção fixa 4:5 com `object-fit: cover`; título e tempo ficam **abaixo** da foto, em texto escuro sobre o creme do card. Não voltar a sobrepor texto branco na imagem — o container em `display:flex` empurrava a legenda para fora do card e ela sumia.

---

## Regras para o assistente (Claude)

1. **Nunca reescrever o que já funciona** sem ser solicitado
2. **Testar antes de implementar** — reproduzir o problema, validar a correção isoladamente e rodar o build. Já houve um caso de mudança não testada que quebrou o app
3. **Uma correção por vez** — não empilhar mudanças no mesmo commit
4. **Pedir autorização antes do push** — o `main` publica direto para as alunas
5. **Qualquer mudança no Supabase** vem acompanhada do SQL correspondente
6. **Commits em português**, descrevendo o que foi corrigido e por quê
7. **Vitória não é desenvolvedora** — explicar em linguagem simples, sem jargão, e dizer onde a mudança vai aparecer
8. **Cuidado com o `pnpm install`:** ele altera `pnpm-lock.yaml` e `pnpm-workspace.yaml` sozinho. Reverter esses arquivos antes do commit
9. **Para demos:** remover bloqueios de plano temporariamente

---

## Gotchas

- O build falha sem `PORT` e `BASE_PATH` definidos
- `pnpm --filter ... build` pode abortar por causa dos build scripts do esbuild; rodar o binário do vite direto contorna
- A indentação do `AugeApp.jsx` é irregular (props com um espaço só). Ao editar por substituição de texto, casar a string exatamente
- O app tem service worker (`public/sw.js`): depois de publicar, fechar e reabrir o app para ver a mudança
