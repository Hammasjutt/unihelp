-- Demo organization + department seed data.
-- Run AFTER schema.sql. Edit the email_domain below to match whatever
-- domain you'll actually use for test signups (a real institutional
-- domain won't work for ad hoc local testing with e.g. a gmail.com account).

insert into organizations (name, slug, email_domain)
values ('Demo University', 'demo-university', 'demo-university.test')
on conflict (slug) do nothing;

insert into departments (organization_id, name, head, status)
select id, 'IT Support', 'Mina Patel', 'Active' from organizations where slug = 'demo-university'
union all
select id, 'Facilities', 'Noah Kim', 'Active' from organizations where slug = 'demo-university'
union all
select id, 'Academic Office', 'Alicia Ford', 'Active' from organizations where slug = 'demo-university'
union all
select id, 'Student Finance', null, 'Active' from organizations where slug = 'demo-university'
union all
select id, 'Student Services', null, 'Active' from organizations where slug = 'demo-university'
on conflict (organization_id, name) do nothing;

-- Students' academic departments (programs of study) -- unrelated to the
-- staff/ticket-routing departments above.
insert into academic_departments (organization_id, name)
select id, name from organizations, unnest(array[
  'Information Technology', 'Computer Science', 'Software Engineering',
  'Psychology', 'Nursing', 'MBBS', 'Economics'
]) as name
where slug = 'demo-university'
on conflict (organization_id, name) do nothing;

insert into batches (organization_id, name)
select id, name from organizations, unnest(array['2023', '2024', '2025']) as name
where slug = 'demo-university'
on conflict (organization_id, name) do nothing;

-- ---------------------------------------------------------------------------
-- Demo staff/admin profiles and sample tickets CANNOT be created by plain
-- SQL here: profiles.id references auth.users(id), and Supabase manages
-- auth.users separately from the SQL editor. Two options:
--
--   1. Sign up real accounts through the running app (student self-serve via
--      the email_domain above), then use the app's admin UI to send staff
--      invites -- this exercises the real flow end-to-end.
--
--   2. For a faster local demo, run scripts/seed_demo_users.py (service-role
--      key required) to create a handful of auth.users accounts directly,
--      then insert sample tickets referencing their resulting profile ids.
-- ---------------------------------------------------------------------------
