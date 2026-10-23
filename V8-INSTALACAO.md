# Instalação / atualização — TAJO TAP V8.0

Este roteiro pressupõe um ambiente TAJO TAP já atualizado até a V7.1. **Faça backup do Supabase antes de qualquer migration.**

## 1. Atualize as variáveis existentes

A V8 não exige nova secret obrigatória além das já usadas pelo sistema. Confirme que Production possui, no mínimo, as variáveis descritas em `.env.example`.

A chave `TAJO_WIFI_ENCRYPTION_KEY` continua necessária para os recursos Wi-Fi da V7.

## 2. Supabase

No **SQL Editor** execute somente:

```text
supabase/migrations/011_v8_business_operator.sql
```

Depois execute:

```text
supabase/VERIFY_V8.sql
```

A verificação deve confirmar:

- `tap_business_operators`;
- `tap_operator_admin_view`;
- `operator_id` em clientes, plaquinhas e Smart Pages;
- `asset_kind` em plaquinhas/QRs.

## 3. Deploy

Suba os arquivos V8 para o repositório e faça o deploy normal na Vercel.

```bash
git add -A
git commit -m "TAJO TAP V8 - Business Operator"
git push origin main
```

A arquitetura continua usando uma única Vercel Function (`api/index.js`).

## 4. Criar o primeiro operador BUSINESS

Nesta V8 inicial o provisionamento é manual e seguro:

1. crie a conta do comprador/operador no Supabase Auth (ou deixe-o criar pelo fluxo de conta, se habilitado);
2. entre como administrador TAJO;
3. abra **Operadores BUSINESS**;
4. clique em **Liberar operador**;
5. informe o mesmo e-mail da conta Auth;
6. escolha plano, validade e limites;
7. salve.

Ao fazer login, a conta passa a abrir o portal de operador.

> A automação Kiwify → operador é uma etapa posterior. Não coloque chaves/webhooks de produção antes de validar o fluxo manual de ponta a ponta.

## 5. Teste funcional obrigatório

Use uma conta de teste separada da conta admin:

1. login retorna papel `operator`;
2. dashboard mostra validade e limites;
3. crie um cliente;
4. crie um QR Dinâmico para esse cliente;
5. escaneie `/q/TT-XXXXXX` e confirme o destino;
6. altere o destino e escaneie novamente;
7. crie um bio-site e selecione-o como destino;
8. pause e reative o QR;
9. confirme que o operador não visualiza clientes/QRs de outro operador;
10. atinja uma cota em ambiente de teste e confirme o erro `OPERATOR_LIMIT_REACHED`;
11. expire/suspenda a licença e confirme bloqueio de operações;
12. confirme que admin, seller e client continuam funcionando.

## 6. Regras de segurança

- Nunca exponha `SUPABASE_SECRET_KEY` no navegador.
- Operadores não recebem acesso direto às tabelas de backend.
- Toda consulta operacional deve ser filtrada por `operator_id` no servidor.
- Não reutilize conta admin como operador para testes de isolamento.
- Não entregue o repositório/código-fonte como parte da licença BUSINESS.

## 7. Testes locais

```bash
npm test
```

A suíte V8 valida a migration, isolamento por operador, cotas, licença, Smart Pages, frontend e roteamento serverless.
