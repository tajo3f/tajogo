# TAJO TAP V6

TAJO TAP é uma plataforma operacional para produção, distribuição e gestão de plaquinhas inteligentes com QR/NFC dinâmicos, ativação por PIN, vendedores, clientes, analytics e Smart Pages.

## V6

A V6 adiciona a **TAJO Smart Page**: um biosite comercial editável pelo cliente e pelo vendedor responsável, com URL pública no formato:

```text
https://go.tajodigital.com.br/bio/nome-do-negocio
```

O vendedor continua sem permissão para criar plaquinhas. Ele recebe lotes da administração, vende uma unidade, informa o e-mail do comprador e o sistema cria/vincula a Smart Page e o acesso do cliente.

## Stack

- HTML/CSS/JavaScript Vanilla
- Vercel
- Supabase Auth + PostgreSQL
- Uma única Vercel Function (`/api/index.js`)

## Atualização do banco

Quem já está na V5 deve executar somente:

```text
supabase/migrations/008_v6_smart_page_and_customer_access.sql
```

Veja `V6-INSTALACAO.md`.

## Testes

```bash
npm test
```

## Crédito

**Sistema desenvolvido por João Paulo Brandão**
