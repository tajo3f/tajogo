-- TAJO TAP V3.3.1 — diagnóstico/correção pontual do erro PostgreSQL 42P13.
-- Normalmente NÃO é necessário executar este arquivo se você usar a migration
-- 002_plate_activation_flow.sql da V3.3.1, pois ela já faz estes DROP FUNCTION.
--
-- Se quiser limpar as RPCs antigas manualmente antes da 002, execute somente:

drop function if exists public.tap_check_activation_pin(text, text);

drop function if exists public.tap_claim_plate_once(
  text, text, uuid, text, text, text, text, text, text, text
);
