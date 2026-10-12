# TAJO TAP — Full Stack V3

Sistema integrado para **QR Code dinâmico + NFC**, com painel administrativo, clientes, portal de cliente, scanner, analytics e motor de redirecionamento.

## Stack

- Frontend: HTML + CSS + JavaScript Vanilla
- Backend: Vercel Functions (Node.js 24)
- Banco: Supabase PostgreSQL
- Auth: Supabase Auth
- Segurança: cookies HttpOnly + autorização no backend + RLS no banco
- Deploy: GitHub + Vercel

## Domínios planejados

- `painel.tajodigital.com.br` → painel TAJO TAP
- `go.tajodigital.com.br` → QR/NFC dinâmico
- `tajodigital.com.br` → site institucional TAJO

O mesmo projeto Vercel pode receber `painel.` e `go.`. As rotas `/q/`, `/n/` e `/t/` são resolvidas por Vercel Functions.

## O que mudou em relação ao frontend antigo

O protótipo antigo guardava plaquinhas no `localStorage`, portanto uma placa criada no computador não existia no celular. Esta versão salva os dados no Supabase e o redirect consulta o banco em cada acesso.

Fluxo real:

```text
painel → cria plaquinha → Supabase
QR/NFC → go.tajodigital.com.br/t/TT-XXXXXX
       → Vercel Function
       → Supabase
       → destino atual
       → redirect
```

## Instalação

Leia **BACKEND-SETUP.md** e siga exatamente a ordem.

## Testes locais de código

```bash
npm test
```

O projeto não possui dependências npm de runtime. Para simular as Functions localmente use Vercel CLI:

```bash
npx vercel dev
```

Crie `.env.local` a partir de `.env.example` somente no ambiente local. Nunca envie segredos ao GitHub.

## Rotas principais

### Públicas

- `GET /q/TT-XXXXXX` — acesso QR
- `GET /n/TT-XXXXXX` — acesso NFC
- `GET /t/TT-XXXXXX` — compatibilidade / link padrão
- `GET /api/health` — teste de backend
- `GET /api/public/plate?code=TT-XXXXXX` — estado público mínimo da placa

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Admin

- `GET/POST /api/admin/clients`
- `GET/POST /api/admin/plates`
- `GET/PATCH /api/admin/plate?code=...`
- `POST /api/admin/destination`

### Cliente

- `GET /api/client/plates`
- `POST /api/client/destination`

## Status da plaquinha

- `inventory` — estoque
- `unconfigured` — criada, aguardando destino
- `active` — redirecionando normalmente
- `paused` — temporariamente pausada
- `archived` — retirada de operação

## Observação sobre ativação do cliente

Nesta versão, clientes podem alterar destinos quando possuem uma conta do Supabase vinculada ao estabelecimento em `client_members`. O vínculo pode ser criado com `supabase/LINK_CLIENT_USER.sql`. A geração automática de convites por e-mail pode ser adicionada depois sem alterar a arquitetura central.
