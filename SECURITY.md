# Segurança — TAJO TAP V3

## Princípios

- senha é gerenciada pelo Supabase Auth;
- sessão do navegador usa cookies `HttpOnly`;
- chave `sb_secret_...` existe somente na Vercel;
- frontend chama somente APIs do próprio domínio;
- APIs administrativas validam `tap_platform_admins`;
- APIs de cliente validam `tap_client_members`;
- tabelas possuem RLS para proteção adicional;
- alteração de destino é executada por RPC transacional;
- redirects aceitam somente URLs HTTPS;
- códigos de placa possuem formato restrito;
- códigos de ativação são armazenados como SHA-256, não em texto puro;
- analytics não armazena IP bruto;
- headers de CSP, frame protection e Permissions Policy estão configurados.

## Importante sobre a Secret key

A Secret key do Supabase mapeia para `service_role` e ignora RLS. Por isso, cada Vercel Function faz autorização antes de executar operações privilegiadas.

Nunca publique essa chave.

## Modelo de permissão

### Admin TAJO

Pode:

- criar clientes;
- criar plaquinhas;
- alterar destinos;
- pausar/ativar;
- consultar analytics;
- localizar placas pelo scanner.

### Cliente

Pode:

- ver somente clientes/plaquinhas aos quais foi vinculado;
- alterar o destino das próprias plaquinhas.

### Visitante do QR/NFC

Não acessa o painel nem o banco. O visitante passa pela Vercel Function de redirect.

## V6 — Smart Pages e vinculação por e-mail

- O e-mail informado na venda é usado como referência de vinculação, mas a autorização final continua vinculada ao `auth.users.id`.
- Plaquinhas pré-vendidas exigem, na ativação, o mesmo e-mail informado na compra.
- Vendedores não recebem acesso global: cada alteração de destino/Smart Page é revalidada no backend contra o `seller_id` da plaquinha/lote.
- Clientes recebem apenas Smart Pages cujo `client_id` esteja em `tap_client_members` para seu usuário autenticado.
- Tabelas de Smart Page e convites têm acesso direto de `anon` e `authenticated` revogado; operações passam pelo backend.
- Analytics da Smart Page não armazena IP ou fingerprint.
