# TAJO TAP V3.1 — correção da migration `profiles`

## Erro corrigido

```text
ERROR: 42703: column "user_id" of relation "profiles" does not exist
```

## Causa

O projeto Supabase já possuía `public.profiles` com a identidade do usuário na coluna `id`.
A migration V3 original usava `profiles.user_id`. Como `CREATE TABLE IF NOT EXISTS` não altera uma tabela já existente, a tabela antiga foi mantida e o backfill falhou.

## O que mudou

- `public.profiles.id` passa a ser a identidade (`auth.users.id`).
- `full_name`, `phone`, `created_at` e `updated_at` são adicionados somente se não existirem.
- trigger de criação de perfil usa `id`.
- backfill usa `id`.
- policies RLS de perfil usam `id = auth.uid()`.
- `/api/auth/me` consulta `profiles?id=eq.<uuid>`.

## Como aplicar

1. Não apague `public.profiles`.
2. Use os arquivos da V3.1 juntos; não misture `api/auth/me.js` antigo com a nova migration.
3. No Supabase SQL Editor, execute novamente `supabase/migrations/001_tajo_tap_backend.sql` desde a primeira linha.
4. Se surgir outro erro, pare e copie a mensagem completa antes de executar comandos destrutivos.
