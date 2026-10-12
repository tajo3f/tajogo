# TAJO TAP V4.2

## Gestão de plaquinhas
- Seleção individual por checkbox no desktop e mobile.
- Seleção de todas as plaquinhas.
- Exclusão em massa de até 100 unidades por operação.
- Confirmação destrutiva obrigatória antes da exclusão.
- Auditoria `plate.bulk_delete` no Supabase.

## PIN administrativo
- Novas plaquinhas passam a manter um PIN administrativo de 6 dígitos disponível somente para o backend Super Admin.
- O PIN aparece na listagem de plaquinhas e na tela de detalhes.
- Botão de copiar PIN.
- Lotes mantêm os PINs disponíveis no mapa interno mesmo após fechar o modal de criação.
- Plaquinhas legadas, cujo PIN antigo existia somente em hash, recebem a opção **Gerar PIN visível**. O novo PIN substitui e invalida o anterior.
- A tabela de códigos de ativação continua bloqueada para `anon` e `authenticated`; somente o backend administrativo usa a chave server-side.

## Produção
- O mapa interno do lote pode ser baixado novamente.
- O arquivo destinado à gráfica continua sem PINs: contém somente os dados necessários à impressão.
