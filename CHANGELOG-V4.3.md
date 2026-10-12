# TAJO TAP V4.3 — correção definitiva da ativação

## Causa raiz corrigida
A RPC `tap_activate_plate_v4` retornava uma tabela com campos chamados `plate_id` e `client_id`. Em alguns comandos internos da função, colunas com os mesmos nomes eram usadas sem qualificação. No PL/pgSQL isso pode gerar o erro PostgreSQL `42702` (referência de coluna ambígua). O backend da V4.2 classificava genericamente qualquer HTTP 400 da RPC como se a migration 004 estivesse ausente, por isso a tela continuava pedindo a 004 mesmo quando ela já estava instalada.

## Correções
- Migration incremental `006_activation_v4_3_hotfix.sql`.
- Colunas sensíveis qualificadas com aliases (`ac.plate_id`, `d.plate_id`, etc.).
- `ON CONFLICT` passa a usar `tap_client_members_pkey` explicitamente.
- Reload explícito do schema PostgREST (`notify pgrst, 'reload schema'`).
- Backend diferencia RPC ausente de erro SQL interno.
- Mantém os dados, PINs, clientes, destinos, lotes e analytics existentes.
