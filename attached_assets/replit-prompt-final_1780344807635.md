# PROMPT COMPLETO — CLUBE DO AUGE
## Para o Replit Agent — Execute na ordem exata

---

## CONTEXTO DO PROJETO

App mobile chamado Clube do Auge para mulheres 40+, da Dra. Isadora Zaniboni, médica geriatra.
O app JÁ ESTÁ FUNCIONANDO com visual completo, ISA integrada, checkin, calendário, protocolo de retomada, kit de emergência, PWA e notificações push.

**NÃO REFAÇA** o que já existe. Implemente APENAS o que está neste documento.

---

## PARTE 1 — AUTENTICAÇÃO E PERFIS (PRIORIDADE MÁXIMA)

### 1.1 Supabase — configurar autenticação real

Conecte o app ao Supabase com:
- Autenticação por email e senha
- Tabela `profiles` com os campos:
  - `id` (uuid, referencia auth.users)
  - `nome` (text)
  - `email` (text)
  - `plano` (text) — valores: 'comunidade' ou 'jornada'
  - `data_cadastro` (timestamp)
  - `lgpd_aceito` (boolean)
  - `lgpd_data` (timestamp)

O campo `plano` é definido pelo sistema após o pagamento — NUNCA pela usuária no login.
Para o protótipo: ao criar conta, o padrão é 'comunidade'. Para testar a Jornada, o admin muda manualmente no Supabase.

### 1.2 Fluxo de entrada

```
1. Splash (logo AUGE + estrelinhas douradas)
2. Se primeiro acesso → Tela de LGPD (aceite obrigatório)
3. Login único (email + senha) — SEM opção de escolher plano
4. Após login: sistema lê o campo `plano` do Supabase
5. Se plano = 'jornada' e primeiro acesso → Diagnóstico de Sabotadores
6. Home (tela inicial)
```

### 1.3 Tela de LGPD

Aparece UMA ÚNICA VEZ no primeiro acesso. Nunca mais depois.
Salva `lgpd_aceito = true` e `lgpd_data = now()` no Supabase.
O botão "Continuar" só ativa após rolar o texto até o fim E marcar o checkbox.

Texto do aviso legal:
"Este aplicativo é um programa de desenvolvimento de hábitos e estilo de vida. Não substitui consulta médica, acompanhamento clínico individual, avaliação de exames ou prescrição de medicamentos de qualquer natureza. A formação médica da facilitadora, Dra. Isadora Zaniboni, informa a profundidade do conteúdo — não caracteriza ato médico. Seus dados são tratados conforme a LGPD (Lei 13.709/2018) e nunca compartilhados com terceiros. Você pode solicitar a exclusão de todos os seus dados a qualquer momento."

### 1.4 Tela de Login

- Campo: E-mail (input underline, sem borda)
- Campo: Senha (input underline, sem borda)
- Link: "Esqueceu sua senha?"
- Botão pill principal (#EAD8B8): "Entrar"
- Link: "Criar novo cadastro"
- SEM cards de "Comunidade" ou "Jornada" — login é único para todas

---

## PARTE 2 — CADEADOS (COMUNIDADE VÊ TUDO COM BLOQUEIO)

### 2.1 Princípio

Assinante da Comunidade VÊ todas as 5 abas. Ao tocar na aba Jornada, entra normalmente mas vê o conteúdo com cadeados dourados. O cadeado nunca é punição — é uma promessa visual do que existe.

Aluna da Jornada: acesso completo, sem cadeados.

### 2.2 Tela de convite (abre quando Comunidade toca em qualquer cadeado)

Design: fundo obsidiana, borda ouro suave.

```
Título: "Isso é da Jornada AUGE"
Subtítulo em itálico Cormorant: "12 semanas. Método. Transformação real."

4 benefícios em cards:
• Check-in diário com seus 3 hábitos angulares personalizados
• Roda AUGE: acompanhe sua evolução em S1, S6 e S12
• Protocolo de Retomada com Kit de Emergência personalizado
• Espaços de escrita: Vitórias, Âncora, Porquês e Carta para o Futuro

Depoimento em itálico:
"Em 12 semanas criei uma rotina que achei que nunca seria possível pra mim."
— Maria, 54 anos · Florianópolis

Botão pill principal (#EAD8B8):
"Quero entrar na lista de espera"
→ Abre WhatsApp: https://wa.me/5548999999999

Botão outline:
"Saber mais sobre a Jornada"
```

### 2.3 Mapa completo de cadeados para Comunidade

ABA JORNADA:
- Checkin detalhado com 3 hábitos angulares: BLOQUEADO com cadeado
- Roda AUGE S1: LIBERADA para todas
- Roda AUGE S6 e S12: BLOQUEADAS com cadeado + texto "Exclusivo da Jornada AUGE"
- Protocolo de Retomada: tela explicativa VISÍVEL, Kit de Emergência personalizado BLOQUEADO
- Espaços de escrita (Vitórias, Âncora, Porquês, Carta): BLOQUEADOS
- Calendário das 12 semanas: VISÍVEL como vitrine com cadeado
- Pontos AUGE e medalhas: versão básica visível, versão completa BLOQUEADA

ABA CONTEÚDO — sub-aba "Minha Jornada":
- Todos os guias e mini guias: BLOQUEADOS com cadeado dourado (#C4A882)
- Ao tocar em qualquer item bloqueado: abre tela de convite

---

## PARTE 3 — VOCABULÁRIO (substituições obrigatórias em TODO o app)

Faça busca e substituição em todos os arquivos:

| Texto atual | Substituir por |
|---|---|
| "O que você treinou hoje?" | "O que você fez por você hoje?" |
| "Registrar treino" | "Registrar movimento" |
| "Encontrar parceira de treino" | "Encontre mulheres como você" |
| "Treinos: X" (contador) | "Registros: X" |
| "Vamos treinar juntas?" | "Vamos nos mover juntas?" |
| "Treino registrado" | "Registro salvo" |
| qualquer outra ocorrência de "treino" | "movimento" |
| "Feed" (nome da aba) | "Mural" |
| "Feed de posts" | "Mural do 1%" |

---

## PARTE 4 — MURAL DO 1% (antigo Feed)

### 4.1 Mudanças obrigatórias

- Renomear aba "Feed" para "Mural" em toda a interface
- Posts de exemplo devem mostrar micro-ações comportamentais, NÃO performance física:

```
Post 1 — Mariana Costa:
"Sentei pra ler 15 min em vez de scrollar antes de dormir."

Post 2 — Cecília Alves:
"Hoje almocei sentada, sem pressa e sem tela. Primeira vez na semana."

Post 3 — Você:
"Voltei depois de 3 dias parada. Caminhei 10 min. Conta."
```

### 4.2 Sistema de reações

- Substituir "curtidas" com coração e contagem grande por:
- Botão: "💛 Me identifico"
- Exibição discreta: "3 mulheres se identificaram" (sem número grande)
- Remover contagem competitiva de curtidas

---

## PARTE 5 — CARTA PARA O FUTURO (remover FutureMe)

A carta deve funcionar 100% dentro do app. Remover completamente o link para futureme.org.

Funcionamento:
1. Campo de texto para escrever livremente dentro do app
2. Ao salvar: guarda no Supabase com `user_id`, `texto` e `data_escrita`
3. Ela pode reler quando quiser — não precisa travar
4. Na semana 12 (calculado por `data_cadastro + 84 dias`): banner especial no topo da Home
   - Texto: "Você tem uma carta esperando por você ✉️ — escrita por você mesma na Semana 1"
   - Botão: "Abrir minha carta"
5. Ao abrir na semana 12: exibe a carta com a data + mensagem da ISA:
   "Você chegou. 12 semanas de protagonismo. Isso é o seu auge. 💖"

---

## PARTE 6 — REESCRITA DO PROTOCOLO DE RETOMADA

Substitua todas as cópias abaixo exatamente como escrito:

**Título principal:**
- ATUAL: "Você pode voltar agora. Não do zero. De onde você parou."
- NOVO: "Caiu. Faz parte. Agora você volta."

**As 4 regras dos 2 dias:**

Regra 1:
- ATUAL: "Nunca dois dias seguidos sem o hábito"
- NOVO: "Dois dias é o limite. No terceiro, você já não é mais a mesma."

Regra 2:
- ATUAL: "Se ontem não aconteceu, hoje acontece com metade"
- NOVO: "Ontem não conta. Hoje conta com metade — e isso já é tudo."

Regra 3:
- ATUAL: "Nunca compensar — retomada é com menos, não com mais"
- NOVO: "Não compensa. Não é hora de provar nada. É hora de voltar."

Regra 4:
- ATUAL: "O dia de retomada conta tanto quanto qualquer outro"
- NOVO: "O dia que você volta vale igual ao dia perfeito. Às vezes vale mais."

**Botão de finalização:**
- ATUAL: "Registrar minha retomada"
- NOVO: "Estou voltando agora"

**Placeholder do campo "O que aconteceu?":**
- NOVO: "Sem julgamento. E sem rodeio. Escreve curto, pra você ver com clareza."

---

## PARTE 7 — ASSINATURA DE MARCA

A frase abaixo deve aparecer obrigatoriamente em 4 momentos:
```
"O auge não é o que você foi. É o que você está construindo."
```

Design: Cormorant Garamond 300, itálico, cor #C4A882, com borda esquerda dourada fina (1px).

ONDE:
1. Tela de resultado da Roda AUGE — após o gráfico, antes do botão "Salvar resultado"
2. Após salvar uma Vitória nos Espaços de Escrita
3. Após clicar "Estou voltando agora" no Protocolo de Retomada
4. Tela da Carta para o Futuro na Semana 12

---

## PARTE 8 — PERSISTÊNCIA DE DADOS NO SUPABASE

Salvar no Supabase (não só localStorage):

Tabela `checkins`:
- user_id, data, hab_feitos (array), hab_nao_feitos (array), total_feitos, total, percentual, chips (array), nota, retomada (boolean)

Tabela `habitos_angulares`:
- user_id, hab1, hab2, hab3

Tabela `roda_auge`:
- user_id, momento (S1/S6/S12), data, respostas (json), nota_energia, nota_consciencia, nota_organizacao, nota_autocuidado, nota_protagonismo, indice_auge

Tabela `kit_emergencia`:
- user_id, min_viavel, onde_apoio

Tabela `ancora`:
- user_id, texto

Tabela `vitorias`:
- user_id, sem, texto, data

Tabela `carta_futuro`:
- user_id, texto, data_escrita

---

## O QUE NÃO MUDAR

- Visual: fundo obsidiana, ouro #C4A882, Cormorant Garamond + Inter
- ISA já integrada nos 3 momentos — não altere o system prompt
- Calendário com gradiente de cores e legenda
- PWA e notificações push já configurados
- Checkin com hábitos angulares, chips e microdiário
- Medalhas e pontos AUGE
- Radar de amigas e chat
- Logo AUGE com estrelinhas

---

*"O auge não é o que você foi. É o que você está construindo."*
*Clube do Auge · Dra. Isadora Zaniboni · Florianópolis*
