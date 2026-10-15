# Instalação — TAJO TAP V6

Este pacote parte da V5 operacional.

## 1. Supabase

Se o banco já possui as migrations `001` até `007`, execute **somente**:

```text
supabase/migrations/008_v6_smart_page_and_customer_access.sql
```

Não execute novamente as migrations antigas.

Depois, opcionalmente, execute:

```text
supabase/VERIFY_V6.sql
```

O resultado deve encontrar:

- `public.tap_smart_pages`
- `public.tap_smart_page_events`
- `public.tap_client_access_invites`
- coluna `tap_sales.customer_email`

## 2. GitHub

Substitua o conteúdo do projeto atual pelo conteúdo da V6 e registre também arquivos removidos:

```bash
git add -A
git commit -m "TAJO TAP V6 - Smart Page e painel do cliente"
git push origin main
```

## 3. Vercel

Use o mesmo projeto conectado a `go.tajodigital.com.br`.

A pasta `/api` deve continuar contendo apenas:

```text
/api/index.js
```

A V6 segue usando **1 Serverless Function**.

As variáveis permanecem:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
PANEL_BASE_URL=https://go.tajodigital.com.br
```

## 4. Teste recomendado

1. Entre como Super Admin.
2. Confirme que `Smart Pages` aparece no menu.
3. Entre como vendedor com lote em estoque.
4. Registre uma venda informando nome, e-mail e valor.
5. Confirme que a Smart Page é criada.
6. Abra `Meus lotes` e teste `Destino` na plaquinha vendida.
7. Abra `Smart Pages` no painel do vendedor e edite a página.
8. Abra a URL pública `/bio/<slug>` em aba anônima.
9. Ative a plaquinha usando `/atv/TT-XXXXXX` e o **mesmo e-mail da venda**.
10. Entre como cliente e confirme que a Smart Page aparece no painel.
11. Altere WhatsApp/Instagram/cores e confirme a atualização pública.
12. Clique em botões da Smart Page e confirme o crescimento do analytics após recarregar o painel.

## Regra de permissão

- **Admin:** toda a operação.
- **Vendedor:** somente lotes, plaquinhas, vendas e Smart Pages vinculados à sua operação.
- **Cliente:** somente seus próprios clientes/plaquinhas/Smart Pages.

A autorização é validada no backend; não depende apenas de esconder elementos na interface.
