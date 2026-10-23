# TAJO TAP BUSINESS V10 — Publicação

## 1. Banco de dados
Se o projeto já está na V8/V8.1 e a migration `011_v8_business_operator.sql` já foi aplicada, **não execute nenhuma migration nova**.

A V10 altera principalmente a experiência visual da Smart Page e reaproveita a estrutura já existente.

## 2. Publicação
1. Faça backup do projeto atual.
2. Substitua os arquivos da aplicação pela V10.
3. Preserve as variáveis de ambiente atuais da Vercel/Supabase.
4. Faça novo deploy.
5. Limpe cache do navegador/PWA se estiver comparando com uma versão antiga.

## 3. Testes obrigatórios após o deploy
- Abra uma Smart Page já existente em iPhone e Android.
- Confirme logo, capa, nome e subtítulo.
- Teste WhatsApp, Instagram, Site, Localização e Avaliação Google.
- Teste um link extra com descrição.
- Teste o botão Compartilhar.
- Se houver Wi-Fi Connect, teste copiar senha e exibir QR Wi-Fi.
- Confirme que analytics registram visualização e clique.
- Abra o editor e salve a Smart Page sem alterar nada para validar compatibilidade.

## 4. Formato recomendado de conteúdo
### Serviços
Use uma linha por item:
`Revisão completa | Freios, suspensão e alinhamento`

Os primeiros serviços também aparecem como chips no hero.

### Links extras
Use:
`Ver catálogo | https://exemplo.com/catalogo | Conheça nossa coleção`

A terceira informação vira a descrição menor do card.

## 5. Identidade visual
- `Logo (URL HTTPS)`: imagem quadrada funciona melhor.
- `Capa (URL HTTPS)`: prefira imagem horizontal com boa área central.
- `Cor principal`: controla chips, destaques, CTA e faixa.
- `Fundo`: controla o fallback do hero quando não houver capa.
- `Texto`: controla o texto principal do hero.

## 6. Testes locais
Execute:

```bash
npm test
```

A suíte precisa finalizar com `V10 Smart Page premium checks passed.`
