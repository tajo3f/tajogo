# TAJO TAP BUSINESS V10

> Versão atual: **10.0.0** — Smart Page Premium + compatibilidade integral com V8.1.
> Consulte `V10-INSTALACAO.md`, `CHANGELOG-V10.md` e `RELEASE-CHECKLIST-V10.md`.

# TAJO TAP V8.0 — QR Dinâmico + Operações Licenciadas

TAJO TAP é a plataforma operacional da TAJO Digital para QR Codes Dinâmicos, Smart Pages/bio-sites, plaquinhas inteligentes, NFC, Wi‑Fi Connect, analytics, clientes, vendedores e produção física.

A **V8.0** adiciona a base do **TAJO TAP BUSINESS**: compradores/licenciados podem receber um ambiente operacional isolado para atender a própria carteira sem receber código-fonte ou propriedade do software.

**Sistema desenvolvido por João Paulo Brandão.**

## V8 — Operador BUSINESS

Novo papel `operator` com:

- carteira própria de clientes;
- criação de QR Codes Dinâmicos permanentes;
- troca de destino sem trocar o QR;
- criação e gestão de Smart Pages/bio-sites;
- QR digital ou ativo do tipo plaquinha inteligente;
- métricas básicas de scans;
- cotas de clientes, QRs e Smart Pages;
- licença com início, validade e suspensão;
- isolamento lógico por `operator_id`;
- portal próprio separado de admin, seller e cliente.

O operador **não compra o software**. A TAJO licencia acesso operacional conforme o plano contratado.

## V7.1 preservada

A troca repetida de destinos continua usando o motor compartilhado da V7.1. A Smart Page permanece vinculada mesmo quando o destino muda temporariamente para Instagram, WhatsApp, Google, localização ou link externo.

## Wi‑Fi Connect

A V7 segue disponível de duas formas:

- **Smart Page + Wi‑Fi:** o QR principal dinâmico abre a Smart Page e mostra os dados da rede;
- **QR Wi‑Fi direto:** QR separado no padrão `WIFI:...`, destinado à conexão nativa do aparelho.

O QR Wi‑Fi direto não é dinâmico porque contém SSID/senha no próprio payload. O QR principal TAJO TAP continua permanente.

### Segurança Wi‑Fi

Configure no backend/Vercel:

```env
TAJO_WIFI_ENCRYPTION_KEY=<segredo forte e estável com pelo menos 32 caracteres>
```

As senhas novas são cifradas com AES‑256‑GCM e não devem ser expostas no frontend ou GitHub.

## Banco Supabase

As migrations incrementais estão em:

```text
supabase/migrations/
```

Para quem já está na **V7.1**, execute somente:

```text
011_v8_business_operator.sql
```

Depois rode:

```text
supabase/VERIFY_V8.sql
```

Registros antigos permanecem válidos; dados não pertencentes a operadores continuam com `operator_id = null`.

## Stack

- HTML/CSS/JavaScript Vanilla
- Vercel
- Supabase Auth + PostgreSQL
- uma única Vercel Function: `/api/index.js`
- Node 24.x
- sem dependências npm de runtime

## URLs principais

```text
Painel:       https://go.tajodigital.com.br
QR dinâmico:  https://go.tajodigital.com.br/q/TT-XXXXXX
NFC:          https://go.tajodigital.com.br/n/TT-XXXXXX
Ativação:     https://go.tajodigital.com.br/atv/TT-XXXXXX
Smart Page:   https://go.tajodigital.com.br/bio/nome-do-negocio
```

## Rotas V8

```text
/api/operator/hub       portal operacional do licenciado
/api/admin/operators    gestão dos operadores pela TAJO
```

O navegador nunca recebe a chave secreta do Supabase. As operações multi-tenant passam pelo backend e são filtradas por `operator_id`.

## Provisionamento inicial

Na V8.0 o fluxo é propositalmente manual para validar a operação antes de automatizar vendas:

1. a conta Auth do comprador precisa existir;
2. o admin TAJO abre **Operadores BUSINESS**;
3. vincula o e-mail;
4. define plano, validade e cotas;
5. o usuário passa a entrar como `operator`.

A integração automática com Kiwify deve ser feita depois de capturar/testar o payload real de webhook da conta de produção.

## Testes locais

```bash
npm test
```

A suíte valida compatibilidade V4–V7.1 e, na V8, migration, licença, cotas, isolamento, Smart Pages, frontend e roteamento serverless.

## Documentação de atualização

- `V7-INSTALACAO.md` — Wi‑Fi Connect
- `V7.1-INSTALACAO.md` — troca de destinos
- `V8-INSTALACAO.md` — Operador BUSINESS
- `CHANGELOG-V8.md` — resumo técnico da versão
