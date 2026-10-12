# TAJO TAP V4.4 — motor de ativação resiliente

## Correção principal
A ativação pública `/atv/TT-XXXXXX` não depende mais das RPCs `tap_validate_activation_pin_v4` e `tap_activate_plate_v4` do PostgREST. O backend da Vercel agora executa a validação do PIN e o claim da plaquinha diretamente pela Data API usando a chave secreta server-side.

Isso elimina o erro recorrente `PGRST202 / function not found` causado por cache/assinatura de RPC no Data API.

## Segurança e concorrência
- PIN continua armazenado/validado por SHA-256.
- 5 tentativas incorretas bloqueiam por 15 minutos.
- o claim final usa atualização condicional: `configuration_locked=false`, `setup_status=pending`, `owner_user_id IS NULL`, status `inventory/unconfigured`.
- duas ativações concorrentes não conseguem assumir a mesma plaquinha; apenas a primeira atualização condicional vence.
- operações temporárias do pedido perdedor são removidas.
- chave secreta permanece somente no backend.

## Banco
Não há nova migration obrigatória para o motor V4.4. As estruturas já existentes de V3.3/V4.1/V4.2 continuam sendo usadas.
