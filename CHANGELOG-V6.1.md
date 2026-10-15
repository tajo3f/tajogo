# TAJO TAP V6.1 — Smart Page na ativação

Correção e evolução do fluxo de ativação da TAJO Smart Page.

## O que mudou
- Smart Page não pede mais um link HTTPS externo.
- O cliente informa o nome público do negócio e escolhe o endereço `/bio/slug`.
- O sistema verifica a disponibilidade do slug ao sair do campo e sugere outro quando necessário.
- Ao confirmar a ativação, o backend cria ou reutiliza a Smart Page da plaquinha e usa a URL interna como destino.
- Instagram passa a aceitar `@perfil` e monta o link automaticamente.
- Localização aceita endereço comum ou link HTTPS do Google Maps.
- WhatsApp continua gerando `wa.me` com mensagem opcional.
- O QR/NFC físico continua permanente.

## Banco de dados
Não há nova migration obrigatória para quem já executou a migration V6 `008_v6_smart_page_and_customer_access.sql`.
