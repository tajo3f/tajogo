# Instalação — TAJO TAP V5

Esta versão parte de uma instalação V4.4/V4.x já funcional.

## 1. Supabase

No SQL Editor execute **somente**:

`supabase/migrations/007_v5_distribution_and_operations.sql`

Não execute novamente as migrations 001–006.

Depois execute opcionalmente:

`supabase/VERIFY_V5.sql`

O V5 adiciona metadados de produção/distribuição e não apaga clientes, vendedores, plaquinhas, PINs, destinos, scans ou vendas existentes.

## 2. GitHub

Substitua o conteúdo do repositório atual pelos arquivos desta versão e registre também exclusões:

```bash
git add -A
git commit -m "TAJO TAP V5 - operacao producao e distribuicao"
git push origin main
```

## 3. Vercel

Use o mesmo projeto já conectado a `go.tajodigital.com.br`.

A pasta `/api` deve continuar contendo somente `index.js`.

Variáveis esperadas:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `PANEL_BASE_URL=https://go.tajodigital.com.br`

## 4. Ordem de teste recomendada

1. Login Super Admin.
2. Central de Produção → criar lote de 3 unidades.
3. Informar o e-mail de um vendedor ativo.
4. Confirmar que o vendedor vê o lote em **Meus lotes** e não vê lotes de terceiros.
5. Admin: mudar lote para `Enviada para impressão`, `Produzida` e `Em estoque`.
6. Vendedor: registrar venda escolhendo uma unidade em estoque.
7. Admin: aprovar a venda.
8. Vendedor: marcar a unidade como entregue.
9. Cliente: ativar a plaquinha; confirmar que o status físico vira `Ativada`.
10. Dashboard Admin: conferir os cartões de decisão operacional.

## Regra importante

Vendedores não possuem rota nem permissão backend para criar plaquinhas. Apenas administradores geram unidades e lotes.
