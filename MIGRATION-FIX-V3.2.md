# TAJO TAP V3.2 — correção definitiva de conflitos de schema

## Erros corrigidos

As versões anteriores podiam colidir com tabelas que já existiam no mesmo projeto Supabase, por exemplo `profiles`, `clients` e `plates`. Isso gerou erros como:

```text
column "user_id" of relation "profiles" does not exist
column "client_id" does not exist
```

A V3.2 isola o backend usando o prefixo `tap_` em todas as tabelas, views, funções e triggers do TAJO TAP. Exemplos:

- `tap_profiles`
- `tap_platform_admins`
- `tap_clients`
- `tap_client_members`
- `tap_plates`
- `tap_plate_destinations`
- `tap_plate_activation_codes`
- `tap_scan_events`
- `tap_audit_logs`
- `tap_plate_admin_view`
- `tap_client_admin_view`
- `tap_set_plate_destination`

Assim o TAJO TAP deixa de depender da estrutura de tabelas de outros sistemas no mesmo Supabase.

## O que fazer agora

1. Não apague tabelas existentes.
2. Use somente a migration V3.2 em `supabase/migrations/001_tajo_tap_backend.sql`.
3. Depois execute `supabase/VERIFY_BACKEND.sql`.
4. Execute `supabase/ADMIN_BOOTSTRAP.sql` com o UUID do seu usuário.
5. Publique também o código V3.2, pois as APIs agora consultam as tabelas `tap_*`.

As tabelas antigas/parciais ficam sem uso e podem ser avaliadas para limpeza somente depois que o sistema estiver funcionando em produção.
