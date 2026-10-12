# TAJO TAP V4.3
## Hotfix V4.3
A V4.3 corrige a causa raiz do erro de ativação que era reportado incorretamente como migration 004 ausente. Em instalações V4.2 existentes, execute apenas `supabase/migrations/006_activation_v4_3_hotfix.sql`. Consulte `V4.3-INSTALACAO.md` e `CHANGELOG-V4.3.md`.


Sistema de QR/NFC dinâmico da TAJO Digital, com ativação única, Super Admin, painel de cliente, módulo de vendedores, chat da equipe, produção em lote, analytics, PIN administrativo e gestão em massa de plaquinhas.

## Atualização V4.2

Execute primeiro `supabase/migrations/005_admin_pin_and_bulk_management.sql` e depois publique o código no mesmo repositório/Vercel já usado por `go.tajodigital.com.br`.

Principais novidades: seleção/exclusão em massa, PIN visível para administradores, regeneração segura de PIN para unidades legadas e mapa de PINs de lotes recuperável pelo painel.

Consulte `V4.2-INSTALACAO.md` e `CHANGELOG-V4.2.md`.

---

**Sistema desenvolvido por João Paulo Brandão**