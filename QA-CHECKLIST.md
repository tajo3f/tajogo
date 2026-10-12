# QA — TAJO TAP Frontend V1

## Validações automatizadas executadas

- `node --check assets/js/config.js`;
- `node --check assets/js/qr-core.js`;
- `node --check assets/js/app.js`;
- verificação de todos os assets locais referenciados pelo HTML;
- verificação de IDs duplicados no HTML estático;
- teste isolado do encoder QR gerando matriz válida.

## Viewports considerados no CSS

- 320px;
- 360px;
- 390px;
- 414px;
- 520px;
- 720px;
- 860px;
- 1180px;
- desktops largos.

## Checklist manual recomendado antes do deploy público

### Mobile
- login em 320/360/390/414px;
- dashboard;
- bottom navigation;
- cards de plaquinha;
- modal de criação;
- modal de destino;
- scanner;
- teclado virtual em inputs;
- safe area em iPhone.

### Tablet
- 768x1024;
- 820x1180;
- modo retrato/paisagem.

### Desktop
- 1024px;
- 1280px;
- 1440px;
- 1920px.

### Scanner
- Chrome Android;
- Safari iPhone;
- Chrome desktop com webcam;
- permissão negada;
- dispositivo sem câmera;
- código inválido;
- código manual.

## Limite conhecido desta etapa

O ambiente de geração bloqueia navegação local pelo Chromium por política organizacional, portanto não foi possível concluir captura visual automatizada real no navegador dentro deste ambiente. O código foi validado estaticamente e o QR encoder foi executado isoladamente. A validação visual final deve ser feita no deploy Vercel/localhost real antes de conectar o backend.
