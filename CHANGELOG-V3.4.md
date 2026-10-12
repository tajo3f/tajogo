# TAJO TAP V3.4 — Operação + Vendas

## Sessão
- Logout visível no sidebar.
- Logout também disponível em Configurações.
- Continua usando `/api/auth/logout` com cookies HTTP-only removidos pelo backend.

## Exclusão de plaquinhas
- Admin abre a plaquinha e usa **Excluir plaquinha**.
- É obrigatório digitar o código exato da unidade.
- O backend exige autenticação de administrador e valida a confirmação.
- Antes da exclusão é criado um audit log `plate.delete`.
- O registro da plaquinha é removido; destinos, PIN e scans vinculados são removidos pelas regras `ON DELETE CASCADE` já existentes.

> Exclusão é irreversível e foi pensada principalmente para unidades de teste. Para uma unidade real que precisa apenas sair de operação, prefira pausar ou arquivar.

## Área Vendas
Rota: `#/sales`

Conteúdo:
- cliente ideal e score de lead;
- onde buscar leads;
- auditoria de 5 minutos;
- fluência cognitiva, redução de fricção, aversão à perda com uso ético, prova concreta, ancoragem e microcompromissos;
- scripts de WhatsApp, Instagram, áudio, presencial, demonstração, proposta, fechamento e follow-up;
- objeções;
- rotina diária de prospecção;
- busca e botões de copiar.

## Responsividade
- cards da área comercial reorganizam de 4→2→1 colunas;
- scripts e objeções passam de 2→1 coluna no mobile;
- sidebar suporta rolagem e oculta ajuda secundária em alturas/larguras menores;
- botão de exclusão vira largura total no celular;
- navegação móvel inclui acesso direto a Vendas.
