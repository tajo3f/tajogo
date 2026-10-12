# Escopo funcional — Frontend V1

## Administrador

### Dashboard
- métricas principais;
- atividade recente;
- atalhos de operação;
- acesso rápido ao scanner.

### Plaquinhas
- busca;
- filtro por status;
- visualização desktop e mobile;
- código exclusivo;
- link físico;
- QR real;
- download PNG;
- destino atual;
- pausar/ativar;
- alterar destino.

### Scanner
- solicitação de câmera somente após ação explícita do usuário;
- preferência por câmera traseira;
- leitura de QR em navegadores com Barcode Detection API;
- campo manual de fallback;
- seletor de imagem;
- extração de código no formato `TT-XXXXXX` ou `/t/CODIGO`.

### Clientes
- listagem responsiva;
- cadastro demonstrativo;
- quantidade de placas e acessos.

### Analytics
- métricas;
- gráfico SVG sem biblioteca externa;
- origem QR x NFC;
- destinos mais usados.

### Configurações
- identidade oficial;
- domínios;
- tema.

## Cliente

### Ativação
1. escolher objetivo;
2. informar destino;
3. revisar;
4. concluir.

### Portal
- ver suas placas;
- status;
- destino atual;
- acessos;
- alterar destino.

## Regras de UX aplicadas

- mobile-first;
- largura mínima suportada de 320px;
- grids fluidos;
- `clamp()` em tipografia crítica;
- system fonts, sem dependência de Google Fonts;
- alvos de toque com aproximadamente 44px ou mais;
- estados de foco visíveis;
- sem navegação dependente apenas de hover;
- `prefers-reduced-motion` respeitado;
- tabelas substituídas por cards no mobile;
- modais viram bottom-sheet em telas pequenas;
- menu lateral vira drawer;
- navegação inferior em smartphones.
