# TAJO TAP — Passo a passo do backend

Siga a ordem abaixo. Não pule etapas.

## 1. Criar o projeto no Supabase

1. Entre no Supabase.
2. Crie um projeto para o TAJO TAP.
3. Aguarde o banco ficar disponível.
4. Abra **SQL Editor**.

## 2. Criar o banco

Abra o arquivo:

```text
supabase/migrations/001_tajo_tap_backend.sql
```

Copie **todo o conteúdo**, cole no SQL Editor e execute.

Ele cria:

- `profiles`
- `platform_admins`
- `clients`
- `client_members`
- `plates`
- `plate_destinations`
- `plate_activation_codes`
- `scan_events`
- `audit_logs`
- views administrativas
- índices
- triggers
- RLS
- função transacional para troca de destino

## 3. Criar sua conta administrativa

No Supabase:

```text
Authentication → Users → Add user
```

Cadastre seu e-mail e sua senha.

Depois copie o UUID do usuário.

Abra:

```text
supabase/ADMIN_BOOTSTRAP.sql
```

Troque:

```text
SEU-UUID-AQUI
```

pelo UUID real e execute no SQL Editor.

Essa conta passa a ser `super_admin`.

## 4. Copiar as chaves corretas

No Supabase abra o painel de API/Connect e copie:

```text
Project URL
Publishable key  (sb_publishable_...)
Secret key       (sb_secret_...)
```

A **Secret key é privada**. Nunca coloque em:

- `assets/js/config.js`
- `index.html`
- GitHub público
- variáveis com prefixo `NEXT_PUBLIC_`
- código do navegador

## 5. Adicionar as variáveis na Vercel

Abra:

```text
Vercel
→ Projeto TAJO TAP
→ Settings
→ Environment Variables
```

Cadastre:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxx
PANEL_BASE_URL=https://painel.tajodigital.com.br
```

Marque pelo menos **Production**. Para testar Preview, marque Preview também.

Depois faça **Redeploy**.

## 6. Node.js na Vercel

O projeto já contém:

```json
"engines": {
  "node": "24.x"
}
```

Não volte para Node 20.

## 7. Conectar os subdomínios

No mesmo projeto da Vercel, em **Settings → Domains**, adicione:

```text
painel.tajodigital.com.br
go.tajodigital.com.br
```

O painel será acessado em:

```text
https://painel.tajodigital.com.br
```

O QR/NFC usará:

```text
https://go.tajodigital.com.br/t/TT-XXXXXX
```

Opcionalmente você também pode usar:

```text
/q/TT-XXXXXX
/n/TT-XXXXXX
```

para medir QR e NFC separadamente.

## 8. Testar a conexão

Depois do deploy abra:

```text
https://go.tajodigital.com.br/api/health
```

O esperado é algo semelhante a:

```json
{
  "ok": true,
  "service": "tajo-tap-backend",
  "database": "connected",
  "auth": "connected"
}
```

Se aparecer `503`, abra **Vercel → Logs** e confira principalmente as Environment Variables.

## 9. Entrar no painel

Abra:

```text
https://painel.tajodigital.com.br
```

Entre com o mesmo e-mail/senha criado no Supabase Auth.

O backend valida sua conta em `platform_admins` antes de liberar a administração.

## 10. Cadastrar o primeiro cliente

No painel:

```text
Clientes → Novo cliente
```

O registro agora é salvo em `public.clients` no Supabase.

## 11. Criar a primeira plaquinha

No painel:

```text
Plaquinhas → Nova plaquinha
```

O sistema salva a unidade no Supabase e retorna:

```text
TT-XXXXXX
```

e um código de ativação de reserva, exibido somente naquele momento. Nesta V3 o acesso do cliente é liberado pelo vínculo em `client_members`; o PIN fica preparado para uma futura etapa de auto-reivindicação da placa.

O QR físico usa:

```text
https://go.tajodigital.com.br/t/TT-XXXXXX
```

## 12. Configurar o destino

Abra a plaquinha e clique em **Alterar destino**.

Escolha:

- Google
- WhatsApp
- Instagram
- Smart Page
- Localização
- Link personalizado

O sistema grava o novo destino em `plate_destinations` e atualiza `plates.current_destination_id` em uma operação transacional.

## 13. Testar o QR em outro celular

Abra:

```text
https://go.tajodigital.com.br/t/TT-XXXXXX
```

Agora a Vercel consulta o Supabase. Portanto a plaquinha funciona em qualquer aparelho — não depende mais de `localStorage`.

## 14. Diferenciar QR e NFC

Se quiser analytics separado, use:

```text
QR  → https://go.tajodigital.com.br/q/TT-XXXXXX
NFC → https://go.tajodigital.com.br/n/TT-XXXXXX
```

Ambos usam a mesma plaquinha e o mesmo destino, mas `scan_events.source` registra `qr` ou `nfc`.

## 15. Criar acesso para um cliente

1. Cadastre o cliente normalmente no TAJO TAP.
2. No Supabase, crie um usuário para o cliente em **Authentication → Users**.
3. Copie o UUID do usuário.
4. Copie o UUID do estabelecimento em `public.clients`.
5. Abra `supabase/LINK_CLIENT_USER.sql`.
6. Substitua os dois UUIDs e execute.

Quando esse usuário fizer login, ele entra no portal do cliente e vê apenas as plaquinhas vinculadas ao estabelecimento dele.

## 16. Fluxo de segurança

```text
Browser
  ↓ cookie HttpOnly
Vercel Function
  ↓ valida usuário no Supabase Auth
  ↓ valida admin ou vínculo com cliente
Supabase
  ↓ grava / lê dados
```

A Secret key nunca chega ao navegador.

## 17. Se aparecer “Plaquinha não encontrada”

Confira nesta ordem:

1. o código existe em `public.plates`?
2. o link usa `TT-` exatamente?
3. `/api/health` está `ok: true`?
4. `SUPABASE_URL` está correto?
5. `SUPABASE_SECRET_KEY` está configurada?
6. você fez Redeploy após alterar as variáveis?
7. o SQL da migration foi executado?

## 18. Se aparecer “Não foi possível abrir esta plaquinha”

Olhe o `REF:` exibido na página e abra os Runtime Logs da Vercel. O backend também envia `X-Tajo-Error` com um código resumido.


## Correção V3.1 — tabela `profiles` já existente

Se seu projeto Supabase já possui `public.profiles`, não apague a tabela. A migration V3.1 foi preparada para reutilizar `profiles.id = auth.users.id` e acrescentar somente os campos necessários que estiverem ausentes. Execute novamente `supabase/migrations/001_tajo_tap_backend.sql` desde o início. Os comandos foram escritos para reexecução segura nas partes de criação/trigger/policies.
