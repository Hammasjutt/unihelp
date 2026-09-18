-- Drops old/disposable scaffolding tables (confirmed no real data worth
-- keeping) before applying the UniHelp multi-tenant schema fresh.
-- Run this FIRST, then schema.sql, then seed.sql.

drop table if exists ai_responses cascade;
drop table if exists webhooks cascade;
drop table if exists notifications cascade;
drop table if exists ticket_history cascade;
drop table if exists complaints cascade;
drop table if exists sla_rules cascade;
drop table if exists categories cascade;
drop table if exists departments cascade;
drop table if exists profiles cascade;

-- Also drop any existing auth.users trigger/function using names we're
-- about to (re)create, in case the old scaffolding used the same ones.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
