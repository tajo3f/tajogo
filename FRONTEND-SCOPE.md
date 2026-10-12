# Escopo funcional — TAJO TAP Full Stack V3

## Administrador

- login real via Supabase Auth;
- dashboard com dados persistidos;
- cadastro de clientes no Supabase;
- criação de plaquinhas com código único;
- QR físico em `go.tajodigital.com.br/q/TT-XXXXXX`;
- alteração de destino persistente;
- pausar/ativar plaquinhas;
- scanner por câmera + busca manual;
- analytics de QR x NFC a partir de `tap_scan_events`;
- download do QR em PNG;
- acesso protegido por `tap_platform_admins`.

## Cliente

- login com conta vinculada a `tap_client_members`;
- portal mostrando somente suas plaquinhas;
- alteração de destino das próprias unidades;
- acesso a contadores de uso já agregados pelo backend.

## Redirect Engine

- `/q/:code` registra origem QR;
- `/n/:code` registra origem NFC;
- `/t/:code` mantém compatibilidade com o link padrão;
- `active` redireciona para o destino atual;
- `unconfigured` encaminha para a configuração no painel;
- `paused` exibe página neutra;
- `archived` retorna 410;
- códigos inexistentes retornam 404;
- falhas de infraestrutura retornam 503 com referência de suporte.

## Persistência

O `localStorage` agora guarda somente a preferência de tema. Clientes, placas, destinos, permissões e analytics ficam no Supabase.

## Segurança

- Secret key somente server-side;
- cookies HttpOnly;
- autorização em Vercel Functions;
- RLS no Supabase como defesa adicional;
- URLs de destino HTTPS;
- headers CSP / frame protection / permissions policy;
- nenhum IP bruto salvo em analytics.


## V3.3
- ativação limpa em `/atv/TT-XXXXXX`;
- QR em `/q/TT-XXXXXX`;
- NFC em `/n/TT-XXXXXX`;
- cliente configura uma única vez e depois gerencia pelo painel autenticado.
