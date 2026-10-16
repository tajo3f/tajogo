# TAJO TAP V7.1 — Correção do motor de troca de destino

## Correções
- remove a dependência de `tap_set_plate_destination()` nas alterações feitas por administrador e cliente;
- unifica admin, cliente e vendedor no mesmo motor server-side de troca de destino;
- preserva a Smart Page quando a plaquinha muda temporariamente para Instagram, WhatsApp, Google, localização ou link externo;
- permite voltar para a Smart Page existente sem recriá-la;
- atualiza o estado do painel após cada alteração, evitando dados antigos no modal;
- adiciona formulários específicos por destino:
  - Instagram aceita `@perfil`;
  - WhatsApp aceita número + mensagem;
  - Localização aceita endereço ou link HTTPS;
  - Google e link personalizado validam HTTPS;
  - Smart Page usa a página já vinculada à plaquinha.

## Robustez do backend
O novo `server/_destination.js` cria o novo destino antes de trocar o ponteiro da plaquinha. Se a atualização da plaquinha falhar, o novo registro é removido. O destino anterior só é desativado depois que o novo ponteiro foi salvo.

Isso evita deixar a plaquinha sem destino funcional durante uma troca.
