# TAJO TAP V5 — Operação, Produção e Distribuição

## Principais mudanças

- Dashboard operacional orientado a decisão:
  - plaquinhas aguardando ativação;
  - vendas aguardando aprovação;
  - leads sem contato há mais de 3 dias;
  - unidades físicas em estoque;
  - PINs temporariamente bloqueados;
  - plaquinhas ativas sem acessos nos últimos 30 dias.
- Central de Produção completa com linha física por unidade:
  `Gerada → Enviada para impressão → Produzida → Em estoque → Vendida → Entregue → Ativada`.
- Metadados de lote: quantidade, data, modelo, largura, altura, custo unitário, fornecedor, responsável e arquivo de impressão.
- Lote pode ser vinculado pelo e-mail de login de um vendedor ativo. O vínculo de segurança é gravado pelo UUID do vendedor no Supabase Auth.
- Vendedor não pode criar plaquinhas. Ele enxerga apenas lotes e unidades vinculados ao seu `seller_id`.
- Área **Meus lotes** no painel do vendedor com estoque, PIN, status físico e kit de ativação.
- Venda do vendedor passa a exigir uma unidade em estoque pertencente a um lote dele.
- Ao registrar venda, a unidade passa para `Vendida`; o vendedor pode registrar `Entregue`; a ativação real muda automaticamente para `Ativada`.
- Transferência de lote bloqueada se já houver unidades vendidas, entregues ou ativadas, preservando histórico comercial.
- Arquivo de impressão do lote usa o tamanho configurado (padrão 10 × 8 cm) e QR permanente `/q/TT-XXXXXX`.
- Mantida arquitetura de 1 Serverless Function para compatibilidade com Vercel Hobby.

## Segurança

- Separação de vendedor é aplicada no backend, não apenas na interface.
- `seller_id` é validado em consultas e alterações comerciais.
- PINs são entregues ao vendedor apenas para unidades de lotes vinculados a ele.
- Criação de plaquinhas e lotes continua exclusiva de Super Admin.
