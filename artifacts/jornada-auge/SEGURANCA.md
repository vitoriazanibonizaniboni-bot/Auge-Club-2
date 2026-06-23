# Clube do Auge — Relatório de Segurança

Data: 12/06/2026 · Revisão do código do app, das políticas do Supabase e do servidor da ISA.

## Resumo

O app está em boa forma para o estágio atual: autenticação pelo Supabase, RLS ativada nas tabelas principais, chave da Anthropic guardada no servidor (nunca no navegador) e consentimento LGPD no cadastro. Os pontos que encontrei estão corrigidos na `migrations/006_seguranca.sql` ou listados abaixo como recomendação.

## O que está bem

A chave da API da ISA fica só no servidor (`ANTHROPIC_API_KEY` em variável de ambiente); o navegador nunca a vê. A chave `anon` do Supabase aparece no app, mas isso é o desenho correto — ela só funciona dentro das regras de RLS. Senhas são gerenciadas pelo Supabase Auth (nunca passam pelo seu código). Dados sensíveis de comportamento (check-ins, microdiário, chips emocionais, Roda AUGE, porquês, cartas) têm política "own": cada aluna só lê e escreve o que é dela. O texto de termos cita a LGPD e o tratamento como dado sensível.

## O que foi corrigido agora (rodar `006_seguranca.sql`)

1. **Mensagens via API sem conexão** — o app só mostra o chat entre conexões aceitas, mas a API aceitava enviar mensagem para qualquer pessoa. Agora o banco também exige conexão aceita.
2. **Edição de mensagem recebida** — a política que permite "marcar como lida" tecnicamente permitia alterar o texto de uma mensagem recebida. Um trigger agora bloqueia qualquer mudança que não seja o campo `lida`.
3. **Comentários em posts privados** — era possível, via API, ler e criar comentários ligados a posts privados de outra pessoa. Agora comentário só em post público (ou no próprio post).
4. **Abuso do endpoint da ISA** — sem limite, qualquer pessoa poderia gerar custo de API em massa. Adicionei limite de 20 mensagens por minuto por IP e tamanho máximo de mensagem (já no código, vai junto com o deploy).

## Recomendações (não urgentes, decidir depois)

**Fotos são públicas por URL.** Os buckets `posts` e `avatars` usam URL pública: quem tiver o link vê a foto, mesmo sem login. Para um mural comunitário isso é aceitável, mas vale avisar as alunas (ex.: no momento do upload, "sua foto fica visível para a comunidade"). A alternativa (URLs assinadas) é uma mudança maior.

**Endpoint da ISA não exige login.** O limite por IP reduz o risco de custo, mas o ideal futuramente é validar o token de sessão do Supabase no servidor antes de chamar a Anthropic.

**Exclusão de dados (LGPD).** Os termos prometem exclusão definitiva mediante pedido. Hoje isso é manual (a Dra. Isadora apaga no Supabase). Documente o passo a passo: apagar a aluna em Authentication → Users (o `on delete cascade` limpa quase tudo) e conferir storage (fotos em `posts/` e `avatars/` com o id dela).

**Microdiário no campo `nota`.** É o dado mais íntimo do app. Está protegido por RLS "own", o que é correto. Apenas evite criar no futuro qualquer RPC `security definer` que exponha `checkins` de outras alunas.

**Painel da Mentora.** Confira que as ações administrativas (ativar plano, editar vídeos/config) só funcionam para a conta admin também no banco (política por `plano = 'admin'` nas tabelas `videos` e `config`), não apenas pela tela. Use a consulta 4b do arquivo 006 para listar as políticas atuais e me mostre o resultado se quiser que eu revise.

**Tokens e contas.** Revogue o Personal Access Token do GitHub usado hoje e mantenha o repositório privado. As contas de teste (vanessa@, vitoria@) usam senha fraca — troque ou apague antes de divulgar o app.

## Auditoria rápida (cole no SQL Editor quando quiser conferir)

```sql
-- Tabelas sem RLS (resultado ideal: nenhuma das suas tabelas)
select tablename from pg_tables
where schemaname = 'public' and rowsecurity = false;

-- Todas as políticas por tabela
select tablename, policyname, cmd from pg_policies
where schemaname = 'public' order by tablename, cmd;
```
