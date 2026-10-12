# TAJO TAP V3.4.1 — Compatibilidade Vercel Hobby

## Motivo
O Vercel Hobby limita a quantidade de funções serverless por implantação. A V3.4 colocava cada endpoint e helper dentro de `/api`, fazendo o projeto ultrapassar o limite do plano.

## Correção
- Todos os handlers e helpers foram movidos para `/server`.
- `/api/index.js` passou a ser a única Vercel Function.
- `vercel.json` mantém as URLs públicas antigas através de rewrites.
- Nenhuma URL usada pelo frontend foi alterada.
- `/q/:code`, `/n/:code`, `/t/:code` e `/atv/:code` continuam funcionando com o mesmo formato.
- Não exige nova migration no Supabase.

## Resultado esperado
O deploy passa a usar 1 função serverless, ficando abaixo do limite do plano Hobby.
