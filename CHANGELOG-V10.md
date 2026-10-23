# CHANGELOG — V10.0

## Smart Page Premium

A V10 redesenha completamente a Smart Page / bio-page pública para ficar mais próxima de uma página comercial moderna, mantendo compatibilidade com os dados e links já existentes.

### Novo visual público
- Hero premium com capa, logomarca circular, nome, subtítulo e identidade visual do cliente.
- Chips automáticos dos principais serviços cadastrados.
- Localização em destaque no topo.
- Faixa dinâmica de comunicação entre o hero e os atalhos.
- WhatsApp transformado em CTA principal com destaque de "Atendimento rápido".
- Demais canais exibidos como cards comerciais com título, descrição, ícone e seta.
- Seções de serviços, horário, endereço e Pix reorganizadas para leitura mobile.
- Wi-Fi Connect preservado e redesenhado para o novo padrão visual.
- Rodapé TAJO TAP / TAJO DIGITAL 3F preservado.
- Animações leves e suporte a `prefers-reduced-motion`.

### Editor
- Identificação do editor atualizada para V10.
- Serviços agora aceitam `Nome | Descrição`.
- Links extras agora aceitam `Rótulo | URL | Descrição`.
- Descrições são sanitizadas no backend e exibidas abaixo do título do card.

### Compatibilidade
- Não há alteração de rota pública: `/bio/:slug` continua igual.
- Tracking de cliques continua em `/bio/:slug/go/:key`.
- Analytics de visualização e clique continuam ativos.
- Smart Page + Wi-Fi, QR dinâmico, vendedores, clientes e operadores BUSINESS continuam compatíveis.
- A correção móvel da V8.1 foi preservada.

### Banco de dados
**Nenhuma migration nova é necessária na V10.**
A V10 utiliza os campos e JSONB já existentes em `tap_smart_pages`.

### Segurança
- URLs continuam validadas como HTTPS pelo backend.
- Conteúdo do cliente continua escapado antes de entrar no HTML.
- A capa passou a ser renderizada como `<img>` sanitizada, evitando interpolação de URL dentro de CSS inline.
