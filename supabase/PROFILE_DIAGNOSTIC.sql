-- Diagnóstico do conjunto de tabelas isoladas do TAJO TAP V3.2
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name like 'tap_%'
order by table_name;
