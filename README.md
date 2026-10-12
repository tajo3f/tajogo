# TAJO TAP — Frontend V1

Frontend profissional do sistema TAJO TAP, criado para gestão de plaquinhas físicas com QR Code e NFC dinâmicos.

## O que esta versão entrega

- identidade oficial TAJO TAP aplicada ao sistema;
- login demonstrativo;
- dashboard administrativo;
- listagem e gestão de plaquinhas;
- criação de nova plaquinha com código exclusivo;
- QR Code real gerado localmente no navegador;
- download do QR em PNG;
- link físico no padrão `https://go.tajodigital.com.br/t/CODIGO`;
- alteração visual de destino;
- pausar/ativar plaquinha;
- painel de clientes;
- analytics responsivo;
- câmera para localizar plaquinhas por QR Code quando o navegador oferece `BarcodeDetector`;
- entrada manual como fallback;
- leitura de QR por imagem nos navegadores compatíveis;
- fluxo de ativação/configuração pelo cliente;
- área do cliente para gerenciar destinos;
- tema claro/escuro;
- layout desktop, tablet e mobile;
- PWA manifest básico;
- headers para Vercel.

## Importante: escopo desta etapa

Esta é a **etapa de frontend**. Os dados demonstrativos ficam no `localStorage` apenas para permitir testar UX, fluxos e interface.

Ainda não estão conectados:

- Supabase Auth;
- PostgreSQL;
- RLS;
- Storage;
- redirect engine real do `go.tajodigital.com.br`;
- analytics persistente;
- vínculo seguro de cliente/plaquinha;
- PIN de ativação;
- auditoria server-side.

Esses itens pertencem à etapa de backend.

## Executar localmente

Como o projeto é estático, não precisa instalar npm.

### Python

```bash
python -m http.server 8080
```

Acesse:

```text
http://localhost:8080/#/login
```

### VS Code

Também pode usar qualquer servidor estático local, como Live Server.

> Para testar a câmera, use `localhost` ou HTTPS. Browsers restringem câmera em origens inseguras.

## Acesso demonstrativo

Na tela de login existem botões para:

- abrir como administrador;
- visualizar a área do cliente.

O e-mail/senha exibidos são apenas demonstração do frontend e não autenticam em servidor.

## Rotas principais

O frontend usa hash routing para funcionar em hospedagem estática sem configuração de rewrite:

```text
#/login
#/dashboard
#/plaques
#/plaque/TT-7K2P9A
#/scanner
#/clients
#/analytics
#/settings
#/activate/TT-V4N8DK
#/portal
```

## Alterar domínios

Edite apenas:

```text
assets/js/config.js
```

Configuração padrão:

```js
window.TAJO_TAP_CONFIG = {
  primaryDomain: 'tajodigital.com.br',
  panelDomain: 'painel.tajodigital.com.br',
  goDomain: 'go.tajodigital.com.br',
  platePath: '/t/'
}
```

Nenhum segredo deve ser colocado nesse arquivo.

## Publicar na Vercel

1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta.
3. Na Vercel, importe o repositório.
4. Framework Preset: **Other**.
5. Build Command: deixe vazio.
6. Output Directory: `.`
7. Deploy.

O `vercel.json` já possui headers básicos para a aplicação.

## Scanner de câmera

O frontend usa a API nativa `BarcodeDetector` quando disponível. A câmera é aberta com preferência pela câmera traseira (`environment`).

Como `BarcodeDetector` ainda não possui suporte uniforme em todos os navegadores, o frontend inclui fallback de código manual e leitura por imagem quando a mesma API estiver disponível. Na etapa de produção, a estratégia recomendada é empacotar uma biblioteca de QR scanner cross-browser no próprio build para ampliar a cobertura, sem depender de CDN externo.

## Arquivos principais

```text
index.html
assets/
  css/app.css
  js/config.js
  js/qr-core.js
  js/app.js
  images/
manifest.webmanifest
vercel.json
README.md
FRONTEND-SCOPE.md
QA-CHECKLIST.md
THIRD-PARTY-NOTICES.md
```

## QR Code

O gerador de QR roda localmente no navegador e utiliza um encoder MIT derivado do QRCode de Kazuhiko Arase, incluído em `assets/js/qr-core.js`.

O QR da plaquinha sempre deve apontar para o link intermediário TAJO, por exemplo:

```text
https://go.tajodigital.com.br/t/TT-7K2P9A
```

O backend futuro decide o destino final.
