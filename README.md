# TAJO TAP — Redirect Patch V1

Corrige o 404 de URLs como:

- `/q/TT-XXXXXXXX`
- `/n/TT-XXXXXXXX`
- `/t/TT-XXXXXX` (alias temporário de compatibilidade)

## Fluxo

- `inventory` / `unconfigured` -> painel de ativação
- `active` -> registra `scan_events` e redireciona para o destino atual
- `paused` -> página neutra de pausa
- `archived` -> HTTP 410
- código inexistente -> HTTP 404 próprio do TAJO TAP

## Vercel

Configure as Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `PANEL_BASE_URL=https://painel.tajodigital.com.br`

`SUPABASE_SECRET_KEY` é segredo de backend. Nunca use prefixo `NEXT_PUBLIC_` e nunca coloque essa chave em HTML ou JavaScript do navegador.

## Atenção

O frontend V1 demonstrativo ainda cria plaquinhas no `localStorage`. A próxima integração deve trocar essa criação local pela RPC `admin_create_plate()` do Supabase. Caso contrário o resolver funcionará, mas a placa criada somente no navegador não existirá no banco.
