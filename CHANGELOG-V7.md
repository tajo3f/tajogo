# TAJO TAP V7.0 — Changelog

## Wi‑Fi Connect

- novo modo `Wi‑Fi Connect`;
- novo modo `Smart Page + Wi‑Fi`;
- geração do QR Wi‑Fi nativo `WIFI:...`;
- SSID, WPA/WPA2/WPA3, WEP, rede aberta e rede oculta;
- download do segundo QR direto após ativação e pelo editor da Smart Page;
- Smart Page pública com cartão Wi‑Fi, copiar senha e mostrar QR;
- modo Wi‑Fi focado para negócios que querem uma página simples de conexão;
- QR principal dinâmico preservado e separado do QR Wi‑Fi nativo.

## Segurança

- nova tabela `tap_wifi_profiles`;
- senha cifrada com AES‑256‑GCM no backend;
- chave de cifra exclusivamente em `TAJO_WIFI_ENCRYPTION_KEY`;
- RLS habilitado;
- acesso direto de `anon` e `authenticated` revogado;
- validação de SSID em até 32 bytes;
- validação de WPA/WPA2/WPA3 e WEP;
- caracteres de controle rejeitados;
- nenhum secret novo enviado ao frontend administrativo além da senha que o usuário autorizado precisa visualizar/editar;
- `/api/health` informa apenas `wifiConnect: ready|config_required`, nunca a chave.

## Smart Page

- integração de Wi‑Fi no editor do cliente/vendedor autorizado/admin;
- badge de Wi‑Fi nas Smart Pages do painel;
- QR direto renderizado sem script inline, compatível com CSP atual;
- senha legada V6 deixa de receber novas gravações; V7 usa o cofre `tap_wifi_profiles`.

## Ativação

- motor `REST_V7`;
- Smart Page, Wi‑Fi e modo híbrido disponíveis no seletor;
- pré-validação da chave de criptografia antes de criar conta/claim;
- QR Wi‑Fi direto disponibilizado após ativação quando habilitado;
- mensagem clara explicando que o QR Wi‑Fi direto é um segundo código e precisa ser regenerado se a senha da rede mudar.

## Infra

- continua com uma única Vercel Function;
- migration `010_v7_wifi_connect.sql`;
- `VERIFY_V7.sql`;
- testes específicos `wifi_check.mjs` e `v7_check.mjs`;
- versão do pacote: `7.0.0`.
