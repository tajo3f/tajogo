# TAJO TAP V4

## Módulo de vendedores
- Perfil `seller` isolado de admin e cliente.
- Dashboard individual: leads, vendas pagas, comissão e pipeline.
- CRM individual de leads.
- Registro individual de vendas; comissão calculada no backend pela taxa configurada pelo admin.
- Playbook comercial e scripts existentes liberados ao vendedor.
- Chat interno da equipe persistido no Supabase, sincronizado automaticamente a cada 3 segundos.
- Administração de vendedores: vínculo por conta existente no Supabase Auth, taxa de comissão, ativar/desativar e métricas individuais.
- Vendedor nunca recebe visão de leads/vendas de outro vendedor.
- Rotas protegidas no backend; esconder interface não é usado como mecanismo de autorização.
- Crédito: Sistema desenvolvido por João Paulo Brandão.

## Banco
Execute somente `supabase/migrations/003_seller_module.sql` em uma instalação V3.3+ já migrada.
Não reexecute 001/002 apenas para instalar o módulo V4.
