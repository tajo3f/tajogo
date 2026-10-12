# Instalação TAJO TAP V4

1. Supabase SQL Editor: execute `supabase/migrations/003_seller_module.sql`.
2. Rode `supabase/VERIFY_SELLER_V4.sql`.
3. Substitua o projeto GitHub pelos arquivos V4. A pasta `/api` deve continuar contendo somente `index.js`.
4. Commit/push e aguarde o deploy Vercel.
5. Confirme `/api/health`.
6. Para cada vendedor, a conta precisa existir em Supabase Auth. No Super Admin abra **Vendedores → Vincular vendedor**, informe o mesmo e-mail, nome e comissão.
7. Faça login com a conta do vendedor. Ele verá somente a área comercial individual e o chat da equipe.

O chat usa sincronização automática de 3 segundos através do backend e persiste cada mensagem em `tap_seller_chat_messages`.
