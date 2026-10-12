# TAJO TAP V4.1 — Ativação estável + Produção em lote

**Sistema desenvolvido por João Paulo Brandão.**

## Correções de ativação

- novas RPCs exclusivas da V4.1 (`tap_validate_activation_pin_v4` e `tap_activate_plate_v4`) para evitar colisões com contratos antigos das funções da V3.x;
- `retry_after` do bloqueio de PIN usa `timestamptz`;
- comparação de PIN usa `IS DISTINCT FROM`, evitando o caso de hash nulo escapar da validação;
- ativação continua atômica e bloqueia a configuração pública depois da confirmação;
- falha ao atualizar o painel **depois** de uma ativação bem-sucedida não exibe mais falso erro de ativação;
- erros do backend agora recebem uma referência segura para diagnóstico nos logs;
- quando a migration 004 não está instalada, o sistema informa explicitamente que o banco precisa ser atualizado;
- a plaquinha existente continua válida: se estiver pendente, pode ser ativada pela V4.1; se já tiver sido gravada como ativa, `/atv/TT-XXXXXX` passa a mostrar “já ativada”.

## Produção em lote

- nova área **Produção** no painel administrativo;
- geração de 1 a 100 plaquinhas por lote;
- cada unidade recebe código `TT-XXXXXX`, QR `/q/TT-XXXXXX`, NFC `/n/TT-XXXXXX` e ativação `/atv/TT-XXXXXX`;
- PIN de 6 dígitos exclusivo, salvo apenas como hash no banco;
- tabela `tap_plate_batches` e vínculo do lote com cada plaquinha;
- histórico de lotes para reimpressão dos QRs;
- arquivo vetorial HTML com QR preto, fundo branco, margem de segurança e QR de 50 mm para impressão;
- opção **Imprimir / Salvar PDF** pelo navegador;
- mapa interno CSV com código + PIN + links, disponível somente na sessão em que o lote é criado.

## Infraestrutura

- mantém apenas **1 Vercel Function** (`api/index.js`), compatível com o limite tratado no plano Hobby;
- nenhuma chave secreta vai para o navegador;
- a migration nova é incremental: `004_activation_v4_and_batches.sql`.
