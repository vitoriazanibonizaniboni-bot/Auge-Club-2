---
name: Supabase auth pattern
description: Como auth e sync estão implementados em AugeApp.jsx; decisões que devem ser consistentes nas sessões futuras
---

## Padrão de auth

- `loadingAuth` (useState) guarda a sessão enquanto `getSession()` resolve — renderizar spinner até completar
- `loadUserData(userId)` busca 7 tabelas em Promise.all e popula todo o estado local
- `onAuthStateChange` escuta mudanças de sessão (SIGNED_IN / SIGNED_OUT)
- `lgpdOk` vem de `profiles.lgpd_aceito` — se false após login, mostra AvisoLegal antes do app
- `perfil` ('comunidade' | 'jornada') lido de `profiles.plano`
- `dataCadastro` lido de `profiles.data_cadastro` (datetime ISO → Date object)

## syncDB / syncInsert (helpers de módulo)

```js
// fire-and-forget; pega userId da sessão cacheada do Supabase
const syncDB = (table, data, options = {}) => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user) return;
    supabase.from(table).upsert({ user_id: session.user.id, ...data }, options).then(() => {});
  });
};
const syncInsert = (table, data) => { /* similar mas insert */ };
```

**Why:** Não precisa passar authUserId como prop por toda a árvore. getSession() usa cache local — é síncrono em prática.

**How to apply:** Chamar após qualquer mutação de estado local. Não bloquear UI.

## Mapeamento de tabelas

| Estado local | Tabela Supabase | Método |
|---|---|---|
| historico (checkins diários) | checkins | upsert (onConflict: user_id,data) |
| habAngulares | habitos_angulares | upsert (PK: user_id) |
| anc | ancora | upsert (PK: user_id) |
| kitMin/kitApoio | kit_emergencia | upsert (PK: user_id) |
| vit[] | vitorias | insert |
| carta | carta_futuro | upsert (PK: user_id) |
| roda | roda_auge | insert (NÃO implementado ainda) |

## SQL DDL

O DDL completo das 8 tabelas está em `.local/tasks/task-1.md`. Deve ser executado pelo usuário no SQL Editor do Supabase Dashboard antes de qualquer teste de prod.

## TelaAuth

Componente em AugeApp.jsx com mode: "login" | "cadastro" | "esqueci". `handleCadastro` também faz upsert em `profiles` com plano='comunidade' e lgpd_aceito=true.
