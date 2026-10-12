# TAJO TAP — Redirect Patch V2

Corrige o erro 503 **“Não foi possível abrir esta plaquinha”** que pode ocorrer quando uma chave nova `sb_secret_...` do Supabase é enviada incorretamente como `Authorization: Bearer`.

## Correção principal

As chaves `sb_secret_...` são API keys opacas, não JWTs. Esta versão envia a chave nova somente no header:

```text
apikey: sb_secret_...
```

O header `Authorization: Bearer ...` só é usado automaticamente se a chave configurada for uma chave legada JWT `service_role` iniciada por `eyJ`.

## Rotas

- `/q/TT-XXXXXXXX` → QR
- `/n/TT-XXXXXXXX` → NFC
- `/t/TT-XXXXXXXX` → compatibilidade com links já gerados
- `/api/health` → testa a função **e a conexão real com o Supabase**

## Variáveis Vercel

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
PANEL_BASE_URL=https://painel.tajodigital.com.br
```

Depois de alterar Environment Variables, faça um **Redeploy**.

## Teste obrigatório

Abra:

```text
https://go.tajodigital.com.br/api/health
```

Resultado esperado:

```json
{
  "ok": true,
  "service": "tajo-tap-redirect",
  "supabase": "connected"
}
```

Se `supabase` aparecer como `disconnected`, confira o campo `error` e os Runtime Logs da Vercel.

## Fluxo

- `inventory` / `unconfigured` → painel de ativação
- `active` + destino válido → registra analytics e redireciona
- `paused` → página de pausa
- `archived` → HTTP 410
- inexistente → 404 TAJO TAP

## Segurança

`SUPABASE_SECRET_KEY` é segredo de backend e ignora RLS. Nunca coloque esta chave em HTML, JavaScript do navegador, `NEXT_PUBLIC_*` ou repositório público.
