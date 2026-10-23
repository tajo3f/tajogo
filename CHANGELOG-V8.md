# TAJO TAP V8.0 — Business Operator / Licensed Operations

A V8 cria a base técnica para o **TAJO TAP BUSINESS** sem transferir código-fonte ou propriedade intelectual. O comprador do treinamento/licença passa a ser tratado como **operador**: ele utiliza a plataforma TAJO TAP para criar e administrar QR Codes Dinâmicos, clientes e bio-sites da própria carteira dentro de um ambiente logicamente isolado.

## Principais mudanças

- Novo papel de acesso: `operator`.
- Licença operacional com início, vencimento, suspensão e plano.
- Limites configuráveis de clientes, QRs e Smart Pages.
- Isolamento multi-tenant por `operator_id`.
- QR Code Dinâmico digital criado já ativo, sem depender do fluxo físico de PIN/produção.
- `asset_kind` diferencia `dynamic_qr` de `smart_plate`.
- Portal do operador com visão geral, clientes, QRs, bio-sites, playbook e licença.
- Administração TAJO passa a cadastrar/suspender operadores BUSINESS e definir cotas.
- Smart Pages respeitam propriedade do operador e licença ativa.
- Rotas novas:
  - `GET/POST/PATCH /api/operator/hub`
  - `GET/POST/PATCH /api/admin/operators`
- Migration incremental `011_v8_business_operator.sql`.
- Verificação de banco `supabase/VERIFY_V8.sql`.
- Teste estático `tests/v8_check.mjs`.

## Princípio comercial preservado

A V8 **não transforma o TAJO TAP em software revendido**. O operador recebe acesso operacional licenciado para atender clientes próprios, conforme os limites do plano. Código-fonte, propriedade intelectual e infraestrutura central permanecem pertencentes à TAJO Digital.

## Compatibilidade

A migration preserva registros anteriores. Clientes, plaquinhas, vendedores e Smart Pages existentes permanecem com `operator_id = null`, continuando sob a operação direta da TAJO.
