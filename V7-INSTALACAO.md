# Instalação / atualização — TAJO TAP V7.0

Este roteiro considera que o ambiente atual já está funcionando na V6.2. Não apague tabelas e não execute novamente migrations antigas em um banco já atualizado.

## 1. Faça backup antes da atualização

No Supabase, faça um backup/export adequado ao seu plano e confirme que está trabalhando no projeto correto.

## 2. Supabase

Abra **SQL Editor → New query** e execute somente:

```text
supabase/migrations/010_v7_wifi_connect.sql
```

A migration cria `public.tap_wifi_profiles` e não apaga plaquinhas, clientes, vendas, lotes ou Smart Pages.

Depois execute:

```text
supabase/VERIFY_V7.sql
```

O resultado deve confirmar `tap_wifi_profiles` e as colunas cifradas.

## 3. Nova variável na Vercel

Em **Project → Settings → Environment Variables**, adicione em Production:

```env
TAJO_WIFI_ENCRYPTION_KEY=<segredo aleatório estável com no mínimo 32 caracteres>
```

Exemplo de geração local:

```bash
openssl rand -hex 32
```

Não compartilhe essa chave, não salve no GitHub e não use prefixo `NEXT_PUBLIC_`.

**Importante:** mantenha esse valor estável. Se ele for perdido ou alterado sem uma migração de recifragem, as senhas Wi‑Fi já salvas não poderão ser descriptografadas.

## 4. GitHub

Substitua os arquivos do repositório pela V7 e registre também exclusões:

```bash
git add -A
git commit -m "TAJO TAP V7 - Wi-Fi Connect e Smart Page hibrida"
git push origin main
```

Confirme no GitHub que `/api` contém somente:

```text
api/index.js
```

## 5. Vercel

Aguarde o deployment de Production ficar **Ready**.

Confira:

```text
https://go.tajodigital.com.br/api/health
```

O esperado na V7 é algo equivalente a:

```json
{
  "ok": true,
  "service": "tajo-tap-backend",
  "database": "connected",
  "auth": "connected",
  "wifiConnect": "ready"
}
```

Se `wifiConnect` retornar `config_required`, a variável `TAJO_WIFI_ENCRYPTION_KEY` não chegou ao deployment de Production ou possui menos de 32 caracteres. Corrija e faça Redeploy.

## 6. Teste funcional recomendado

Crie uma plaquinha de teste e valide, nesta ordem:

1. ativação com destino Smart Page comum;
2. ativação com `Smart Page + Wi‑Fi`;
3. rede WPA com SSID e senha válidos;
4. Smart Page pública abre;
5. botão `Copiar senha` funciona;
6. `Mostrar QR Wi‑Fi` renderiza o segundo QR;
7. download do QR Wi‑Fi funciona;
8. leia o QR Wi‑Fi com outro celular e confira se o sistema operacional oferece a conexão;
9. altere SSID/senha no painel e confirme que o QR direto é atualizado;
10. confirme que o QR principal `/q/TT-XXXXXX` não muda;
11. teste rede aberta;
12. teste senha inválida e confirme bloqueio da gravação;
13. confirme isolamento de admin, vendedor e cliente.

## 7. Observação física importante

O QR principal TAJO TAP e o QR Wi‑Fi direto têm funções diferentes:

```text
QR principal /q/TT-XXXXXX
→ dinâmico, analytics, Smart Page, não precisa reimprimir ao trocar links.

QR Wi‑Fi WIFI:...
→ conexão nativa direta, contém a configuração da rede, precisa ser regenerado/reimpresso se SSID/senha mudar.
```

Para a plaquinha 10 × 8 cm, use o QR principal como elemento principal e o QR Wi‑Fi como segundo código menor ou adesivo substituível.

## 8. Testes do pacote

No projeto:

```bash
npm test
```

Esses testes são locais/estáticos e unitários. O teste final de integração ainda deve ser feito no seu Supabase/Vercel real após o deploy.
