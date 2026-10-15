# TAJO TAP V7 — Modelo Wi‑Fi Connect

## Modo Smart Page + Wi‑Fi (recomendado)

O QR físico principal continua sendo:

```text
https://go.tajodigital.com.br/q/TT-XXXXXX
```

Ele abre a Smart Page. Nela o visitante pode visualizar a rede, copiar a senha e abrir o QR Wi‑Fi direto.

O sistema também gera um segundo QR nativo:

```text
WIFI:T:WPA;S:MinhaRede;P:MinhaSenha;H:false;;
```

Esse segundo QR pode ser impresso numa área própria da plaquinha ou em um adesivo substituível.

## Modo Wi‑Fi Connect

O QR principal abre uma Smart Page focada em Wi‑Fi. O sistema continua gerando o segundo QR nativo para conexão em uma leitura.

## Por que existem dois QRs?

Um QR dinâmico contém uma URL da TAJO e pode mudar de destino sem ser reimpresso. Um QR Wi‑Fi nativo contém diretamente SSID/senha. Não é tecnicamente possível mudar o conteúdo físico desse QR depois que ele é impresso.

A V7 não promete conexão silenciosa: o sistema operacional do aparelho decide como apresentar a confirmação de conexão.

## Segurança recomendada

Use uma rede de visitantes isolada da rede administrativa, PDV, câmeras, servidores e equipamentos internos. Alterar a senha da rede invalida o QR Wi‑Fi antigo, portanto gere um novo código e substitua apenas a área/adesivo de Wi‑Fi.
