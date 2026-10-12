# TAJO TAP V3.3.1 — ativação única `/atv/`

## 1. Banco
No Supabase SQL Editor, execute **somente depois da V3.2**:

`supabase/migrations/002_plate_activation_flow.sql`

Não apague as tabelas existentes e não reexecute a migration 001 para fazer esta atualização.

## 2. Vercel
Mantenha as variáveis já configuradas:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `PANEL_BASE_URL=https://go.tajodigital.com.br`

Publique esta versão e faça Redeploy.

## 3. Fluxo
Ao criar uma plaquinha no TAJO Command, o sistema gera:

- QR permanente: `https://go.tajodigital.com.br/q/TT-XXXXXX`
- NFC permanente: `https://go.tajodigital.com.br/n/TT-XXXXXX`
- ativação: `https://go.tajodigital.com.br/atv/TT-XXXXXX`
- PIN de seis dígitos (exibido na criação)

Enquanto pendente, `/q/` e `/n/` encaminham para `/atv/`. Após a ativação, `/q/` e `/n/` redirecionam para o destino escolhido pelo cliente.

## 4. Segurança da ativação
- PIN armazenado apenas como SHA-256.
- 5 erros de PIN geram bloqueio temporário de 15 minutos.
- A ativação pública é consumida uma única vez.
- A conclusão é feita por função transacional no PostgreSQL.
- Depois de ativada, mudanças de destino exigem conta autenticada.
- A `SUPABASE_SECRET_KEY` continua exclusivamente no backend.

## 5. Teste recomendado
1. Crie uma nova plaquinha no painel.
2. Guarde o PIN mostrado.
3. Abra `/atv/TT-XXXXXX` em janela anônima/celular.
4. Crie a conta do cliente, informe PIN e destino.
5. Confirme a ativação.
6. Abra o QR `/q/TT-XXXXXX`: ele deve ir ao destino final.
7. Abra `/atv/TT-XXXXXX` novamente: deve informar que a ativação inicial já foi concluída.


### Se apareceu erro 42P13

Não rode a 001 novamente. Use a versão V3.3.1 da `002_plate_activation_flow.sql`; ela contém `DROP FUNCTION IF EXISTS` das RPCs antes de recriá-las e pode ser executada mesmo após uma tentativa parcial da 002.
