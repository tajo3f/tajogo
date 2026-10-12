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

A V3.3 usa um único projeto/domínio operacional: `go.tajodigital.com.br`. As rotas `/q/` e `/n/` resolvem QR/NFC e `/atv/TT-XXXXXX` abre a ativação única do cliente. `/t/` permanece apenas por compatibilidade.

## O que mudou em relação ao frontend antigo

O protótipo antigo guardava plaquinhas no `localStorage`, portanto uma placa criada no computador não existia no celular. Esta versão salva os dados no Supabase e o redirect consulta o banco em cada acesso.

Fluxo real:

```text
painel → cria plaquinha → Supabase
QR → go.tajodigital.com.br/q/TT-XXXXXX
NFC → go.tajodigital.com.br/n/TT-XXXXXX
Ativação → go.tajodigital.com.br/atv/TT-XXXXXX
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
- `GET /q/TT-XXXXXX` — QR físico
- `GET /n/TT-XXXXXX` — NFC físico
- `GET /atv/TT-XXXXXX` — ativação inicial única
- `GET /t/TT-XXXXXX` — compatibilidade legada
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

Nesta versão, clientes podem alterar destinos quando possuem uma conta do Supabase vinculada ao estabelecimento em `tap_client_members`. O vínculo pode ser criado com `supabase/LINK_CLIENT_USER.sql`. A geração automática de convites por e-mail pode ser adicionada depois sem alterar a arquitetura central.


## V3.3 — isolamento das tabelas TAJO TAP

A migration principal agora usa `public.profiles.id` como referência ao `auth.users.id`, padrão compatível com projetos Supabase que já possuíam a tabela `tap_profiles`. Ela também adiciona de forma não destrutiva os campos `full_name`, `phone`, `created_at` e `updated_at` quando ausentes. Isso corrige o erro `column user_id of relation profiles does not exist`.


## V3.3 — ativação única pelo cliente

A V3.3 adiciona `supabase/migrations/002_plate_self_activation.sql`. O cliente recebe a plaquinha e o PIN, acessa automaticamente `/atv/TT-XXXXXX`, cria ou entra na conta, escolhe o destino e confirma. A ativação pública é então bloqueada no banco. Alterações futuras são feitas apenas pelo painel autenticado.

**Ordem de publicação:** execute primeiro a migration `002`, depois publique o código V3.3 e faça o redeploy na Vercel.
