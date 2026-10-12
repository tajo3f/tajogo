# QA — TAJO TAP Full Stack V3

## Automatizado neste pacote

- sintaxe de todos os arquivos JS/MJS próprios;
- referências de assets do frontend;
- encoder QR gerando matriz válida;
- integridade do ZIP final;
- verificação de imports internos;
- checagem de que o frontend não contém `SUPABASE_SECRET_KEY`;
- checagem de que dados de negócio não usam mais `tajoTapState` no `localStorage`.

Execute novamente a qualquer momento:

```bash
npm test
```

## Checklist após configurar o Supabase

1. `/api/health` retorna `ok: true`.
2. Login do super admin funciona.
3. Criar cliente grava uma linha em `tap_clients`.
4. Criar plaquinha grava uma linha em `tap_plates`.
5. QR gerado possui o mesmo código salvo no banco.
6. Alterar destino cria `tap_plate_destinations` e ativa `current_destination_id`.
7. Abrir `/q/TT-XXXXXX` em placa pendente envia para `/atv/TT-XXXXXX`; depois da ativação redireciona ao destino.
8. Abrir `/q/` e `/n/` incrementa analytics com origens diferentes.
9. Pausar a placa impede redirect.
10. Usuário de cliente não consegue acessar `/api/admin/*`.
11. Cliente enxerga apenas placas do próprio `client_id`.
12. Secret key nunca aparece em View Source/DevTools Network do navegador.

## Viewports

Testar no deploy real em:

- 320px;
- 360px;
- 390px;
- 414px;
- 768px;
- 1024px;
- 1280px;
- 1440px;
- 1920px.

## Scanner

Testar em HTTPS:

- Chrome Android;
- Safari iPhone;
- Chrome desktop com webcam;
- permissão negada;
- dispositivo sem câmera;
- QR válido;
- código manual;
- imagem com QR.

A API `BarcodeDetector` não é uniforme em todos os navegadores; o campo manual e leitura por imagem permanecem como fallback onde suportado.


## Ativação V3.3
- `/atv/TT-XXXXXX` abre com assets corretamente;
- PIN errado conta tentativa e bloqueia temporariamente após 5 falhas;
- PIN correto + nova conta conclui a ativação uma única vez;
- reabrir `/atv/TT-XXXXXX` mostra “já ativada”;
- QR `/q/` e NFC `/n/` passam a redirecionar ao destino;
- cliente autenticado consegue alterar o destino pelo painel;
- nenhuma chave secreta aparece no navegador.
