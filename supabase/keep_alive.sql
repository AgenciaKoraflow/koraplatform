-- Opcional: reforço de keep-alive dentro do próprio banco via pg_cron.
-- Rode no SQL Editor do Supabase. Execute uma query leve todo dia às 12:00 UTC.
-- Obs.: o ping externo (GitHub Actions) é o mais confiável, pois gera
-- atividade real na API; este é um complemento.

create extension if not exists pg_cron;

select cron.unschedule('keep-alive')
where exists (select 1 from cron.job where jobname = 'keep-alive');

select cron.schedule(
  'keep-alive',
  '0 12 * * *',
  $$ select count(*) from public.clients $$
);

-- Verificar:  select * from cron.job;
-- Histórico:  select * from cron.job_run_details order by start_time desc limit 10;
