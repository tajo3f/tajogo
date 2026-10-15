# TAJO TAP V7.0 — Wi‑Fi Connect + Smart Page

TAJO TAP é a plataforma operacional da TAJO para produção, distribuição e gestão de plaquinhas inteligentes, com QR dinâmico, ativação por PIN, lotes, vendedores, clientes, analytics e Smart Pages.

**Sistema desenvolvido por João Paulo Brandão.**

## Novidades da V7.0

A V7 adiciona **Wi‑Fi Connect** de duas formas complementares:

- **Smart Page + Wi‑Fi (recomendado):** o QR principal permanente da plaquinha continua apontando para `https://go.tajodigital.com.br/q/TT-XXXXXX`, abre a Smart Page e exibe os dados Wi‑Fi do negócio.
- **QR Wi‑Fi direto:** o sistema gera um segundo QR com o padrão nativo `WIFI:...`. Ao escanear esse QR compatível, o próprio celular oferece a conexão à rede sem exigir digitação manual da senha.

O segundo QR é propositalmente separado do QR principal. Um QR Wi‑Fi nativo contém SSID/senha no próprio código e, por isso, **não é dinâmico**. Se a rede ou senha mudar, gere novamente somente esse QR Wi‑Fi. O QR principal TAJO TAP continua permanente.

## Segurança do Wi‑Fi

Novas senhas Wi‑Fi não são gravadas em texto puro no banco. A V7 usa **AES‑256‑GCM** no backend e armazena somente ciphertext, IV e authentication tag em `public.tap_wifi_profiles`.

Configure na Vercel, em Production:

```env
TAJO_WIFI_ENCRYPTION_KEY=<segredo forte com pelo menos 32 caracteres>
```

Gere uma chave aleatória, por exemplo:

```bash
openssl rand -hex 32
```

Não coloque essa chave no GitHub, frontend ou variável `NEXT_PUBLIC_*`. Guarde uma cópia segura: trocar/perder a chave impede a leitura das senhas já cifradas.

Para estabelecimentos, prefira uma **rede de visitantes** separada da rede administrativa/PDV.

## Banco Supabase

Todas as migrations do backend estão em:

```text
supabase/migrations/
```

O pacote V7 contém as migrations `001` até `010`. Se o ambiente já está atualizado até a V6.2, execute **somente**:

```text
010_v7_wifi_connect.sql
```

Depois rode:

```text
supabase/VERIFY_V7.sql
```

## Stack

- HTML/CSS/JavaScript Vanilla
- Vercel
- Supabase Auth + PostgreSQL
- Uma única Vercel Function: `/api/index.js`
- Node 24.x
- Sem dependências npm de runtime

## URLs principais

```text
QR dinâmico:  https://go.tajodigital.com.br/q/TT-XXXXXX
NFC:          https://go.tajodigital.com.br/n/TT-XXXXXX
Ativação:     https://go.tajodigital.com.br/atv/TT-XXXXXX
Smart Page:   https://go.tajodigital.com.br/bio/nome-do-negocio
```

## Testes locais

```bash
npm test
```

A suíte valida sintaxe JS, assets, encoder QR, exposição de secrets, limite do Vercel Hobby, compatibilidade das versões anteriores, payload Wi‑Fi, migration V7 e integração estática Smart Page/Wi‑Fi.

Consulte `V7-INSTALACAO.md` antes do deploy.
