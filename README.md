# TAJO TAP Full Stack V4.1

Sistema QR/NFC dinâmico com administração, clientes, ativação única, módulo de vendedores, chat interno, analytics e produção de plaquinhas em lote.

**Sistema desenvolvido por João Paulo Brandão.**

## O que esta versão resolve

A V4.1 corrige o fluxo de ativação que podia terminar em uma mensagem genérica de falha mesmo quando a estrutura do banco estava em versões diferentes. Para eliminar colisões históricas, a ativação passa a usar RPCs novas e exclusivas da V4.1:

- `tap_validate_activation_pin_v4(text,text)`
- `tap_activate_plate_v4(text,text,uuid,text,text,text,text,text,text,text)`

Também separa corretamente o sucesso da ativação do refresh posterior do painel. Se a plaquinha for ativada e o painel falhar ao atualizar, o usuário continua vendo a confirmação de ativação em vez de um falso erro.

## Produção em lote

O Super Admin ganhou a área **Produção**:

- gera de 1 a 100 plaquinhas por lote;
- cria códigos exclusivos `TT-XXXXXX`;
- cria PINs exclusivos de 6 dígitos;
- grava somente o hash do PIN no banco;
- QR permanente: `https://go.tajodigital.com.br/q/TT-XXXXXX`;
- NFC permanente: `https://go.tajodigital.com.br/n/TT-XXXXXX`;
- ativação: `https://go.tajodigital.com.br/atv/TT-XXXXXX`;
- histórico de lotes;
- impressão/Salvar PDF;
- arquivo HTML vetorial com QRs de alto contraste e margem de segurança;
- mapa interno CSV de PINs disponível apenas na criação do lote.

## Stack

- Frontend: HTML5 + CSS + JavaScript Vanilla
- Backend: Node.js em Vercel Functions
- Banco/Auth: Supabase
- Deploy: GitHub + Vercel
- API consolidada em **1 Serverless Function** (`api/index.js`)

## Atualização a partir da V4

Execute primeiro no Supabase:

`supabase/migrations/004_activation_v4_and_batches.sql`

Não execute novamente as migrations 001, 002 e 003 se elas já estiverem aplicadas.

Depois publique os arquivos da V4.1 no mesmo repositório GitHub ligado ao mesmo projeto Vercel.

Leia `V4.1-INSTALACAO.md` antes do deploy.

## Rotas principais

### Públicas

- `/q/TT-XXXXXX` — QR físico
- `/n/TT-XXXXXX` — NFC físico
- `/atv/TT-XXXXXX` — ativação inicial única
- `/t/TT-XXXXXX` — compatibilidade
- `/api/health` — saúde do backend

### Admin

- `/api/admin/plates`
- `/api/admin/plate`
- `/api/admin/clients`
- `/api/admin/sellers`
- `/api/admin/batches`

### Vendedores

- `/api/seller/hub`
- `/api/seller/chat`

### Cliente

- `/api/client/plates`
- `/api/client/destination`

## Segurança

- chaves privilegiadas permanecem apenas na Vercel;
- cookies de sessão HttpOnly;
- autorização server-side por perfil;
- validação de URLs HTTPS;
- PIN protegido por SHA-256 e limite de tentativas;
- ativação pública bloqueada depois da primeira configuração;
- vendedor vê somente sua própria carteira e seus próprios resultados;
- PINs em texto puro de lotes não são armazenados para recuperação posterior.

## Testes locais

```bash
npm test
```

A suíte verifica sintaxe JavaScript, assets, encoder QR, exposição de segredos e quantidade de Vercel Functions.
