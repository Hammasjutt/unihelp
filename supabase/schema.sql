-- UniHelp multi-tenant schema
-- Run this once against a fresh Supabase project (SQL editor or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  email_domain text unique,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references organizations (id),
  name text not null,
  email text not null,
  role text not null check (role in ('student', 'staff', 'admin')),
  department text,
  created_at timestamptz not null default now()
);

-- Pending invites created by POST /admin/staff-invite before the invited
-- person completes signup. handle_new_user() consumes and deletes the
-- matching row when the invite is accepted.
create table if not exists pending_invites (
  email text primary key,
  organization_id uuid not null references organizations (id),
  role text not null check (role in ('student', 'staff', 'admin')),
  department text,
  invited_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- Widen the role check in case this table already exists from an earlier
-- run of this script that only allowed ('staff', 'admin').
alter table pending_invites drop constraint if exists pending_invites_role_check;
alter table pending_invites add constraint pending_invites_role_check check (role in ('student', 'staff', 'admin'));

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  name text not null,
  head text,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

-- Students' academic department/program (IT, CS, Nursing, ...) -- a
-- completely separate concept from `departments` above, which is staff's
-- operational/ticket-routing department. Admin-managed, org-scoped.
create table if not exists academic_departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

-- Student cohort/intake year, e.g. "2024", "Fall 2025" -- admin-managed,
-- org-scoped, free-form label.
create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

alter table profiles add column if not exists roll_number text;
alter table profiles add column if not exists academic_department text;
alter table profiles add column if not exists batch text;

-- Column-level grant: any authenticated user may update ONLY these
-- self-service profile fields on a row (enforced by profiles_update_self
-- below via id = auth.uid()). Deliberately excludes role/organization_id/
-- department (staff's operational department) so a student can never
-- self-promote or reassign themselves by calling the client directly.
grant update (name, roll_number, academic_department, batch) on profiles to authenticated;

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  student_name text,
  student_id text,
  title text,
  description text not null,
  category text,
  department text,
  priority text,
  predicted_department text,
  predicted_priority text,
  classification_source text,
  classification_confidence double precision,
  status text not null default 'New',
  assigned_staff_id uuid references profiles (id),
  submitted_by uuid references profiles (id),
  attachment_path text,
  created_at timestamptz not null default now()
);

-- Safe migration path for projects that already have the tickets table.
alter table tickets add column if not exists predicted_department text;
alter table tickets add column if not exists predicted_priority text;
alter table tickets add column if not exists classification_source text;
alter table tickets add column if not exists classification_confidence double precision;

-- Every manual department/priority correction becomes auditable training
-- feedback. The immutable predicted_* values preserve the classifier's first
-- answer even if a ticket is corrected more than once.
create table if not exists classification_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  ticket_id uuid not null references tickets (id) on delete cascade,
  original_predicted_department text,
  original_predicted_priority text,
  previous_department text,
  previous_priority text,
  corrected_department text,
  corrected_priority text,
  corrected_by_user_id uuid references profiles (id) on delete set null,
  corrected_at timestamptz not null default now(),
  check (
    corrected_department is distinct from previous_department
    or corrected_priority is distinct from previous_priority
  )
);

create index if not exists tickets_organization_id_idx on tickets (organization_id);
create index if not exists tickets_assigned_staff_id_idx on tickets (assigned_staff_id);
create index if not exists tickets_submitted_by_idx on tickets (submitted_by);
create index if not exists classification_feedback_organization_id_idx on classification_feedback (organization_id);
create index if not exists classification_feedback_ticket_id_idx on classification_feedback (ticket_id);
create index if not exists departments_organization_id_idx on departments (organization_id);
create index if not exists profiles_organization_id_idx on profiles (organization_id);

-- ---------------------------------------------------------------------------
-- handle_new_user trigger: resolves organization_id/role for every new
-- auth.users row before any RLS policy on profiles could authorize the insert.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite pending_invites%rowtype;
  existing_org organizations%rowtype;
  signup_domain text;
  institution_name text;
  base_slug text;
  candidate_slug text;
  new_org_id uuid;
  is_public_domain boolean;
begin
  -- 1) Invited: the ONLY way to join an EXISTING organization, in any role
  -- (student, staff, or admin). There is no self-serve auto-join anymore --
  -- an org's admin must invite you.
  select * into invite from pending_invites where email = new.email;
  if found then
    insert into profiles (id, organization_id, name, email, role, department)
    values (
      new.id,
      invite.organization_id,
      coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
      new.email,
      invite.role,
      invite.department
    );
    delete from pending_invites where email = new.email;
    return new;
  end if;

  -- 2) Not invited: self-registration only ever creates a BRAND NEW
  -- organization, and the registrant becomes its admin. Reject outright if
  -- no institution name was given -- there is nothing else this signup
  -- could mean.
  institution_name := nullif(trim(new.raw_user_meta_data ->> 'institution_name'), '');
  if institution_name is null then
    raise exception 'You need an invite to join an organization. To register a new institution instead, provide an institution name at signup.';
  end if;

  signup_domain := split_part(new.email, '@', 2);
  is_public_domain := signup_domain = any (array[
    'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
    'msn.com', 'yahoo.com', 'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
    'proton.me', 'zoho.com', 'gmx.com', 'yandex.com', 'mail.com'
  ]);

  -- Only check for a domain collision on real institutional domains --
  -- public providers never claim a domain (see below), so there's nothing
  -- to collide with there.
  if not is_public_domain then
    select * into existing_org from organizations where email_domain = signup_domain;
    if found then
      raise exception 'An organization already exists for this email domain. Ask its admin to invite you instead of registering again.';
    end if;
  end if;

  base_slug := trim(both '-' from lower(regexp_replace(institution_name, '[^a-zA-Z0-9]+', '-', 'g')));
  if base_slug = '' then
    base_slug := 'org';
  end if;
  candidate_slug := base_slug;
  while exists (select 1 from organizations where slug = candidate_slug) loop
    candidate_slug := base_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into organizations (name, slug, email_domain)
  values (institution_name, candidate_slug, case when is_public_domain then null else signup_domain end)
  returning id into new_org_id;

  -- Seed default departments so AI classification has something to choose
  -- from immediately -- these names match get_department()'s fallback
  -- mapping in the backend, so the rule-based fallback stays consistent too.
  insert into departments (organization_id, name, status)
  values
    (new_org_id, 'IT Support', 'Active'),
    (new_org_id, 'Facilities', 'Active'),
    (new_org_id, 'Academic Office', 'Active'),
    (new_org_id, 'Student Finance', 'Active'),
    (new_org_id, 'Student Services', 'Active');

  insert into profiles (id, organization_id, name, email, role)
  values (
    new.id,
    new_org_id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'admin'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helper functions: SECURITY DEFINER + STABLE so they bypass RLS
-- internally (the function owner is the table owner, which is exempt from
-- its own RLS by default) instead of re-triggering the caller's policy.
-- Without this, a policy on `profiles` that queries `profiles` inside its
-- own USING clause recurses infinitely -- Postgres error 42P17.
-- ---------------------------------------------------------------------------

create or replace function public.current_organization_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.current_department()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select department from profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table departments enable row level security;
alter table academic_departments enable row level security;
alter table batches enable row level security;
alter table tickets enable row level security;
alter table classification_feedback enable row level security;
alter table pending_invites enable row level security;

-- organizations: any authenticated user may read the org they belong to
-- (needed for org name/branding lookups); no client writes at all.
drop policy if exists organizations_select on organizations;
create policy organizations_select on organizations
  for select using (
    id = public.current_organization_id()
  );

-- profiles: read own row, OR any row in the same organization.
-- No INSERT policy for the 'authenticated' role at all -- writes only
-- happen via the SECURITY DEFINER trigger and the service-role invite flow.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select using (
    id = auth.uid()
    or organization_id = public.current_organization_id()
  );

-- profiles: a user may update their OWN row -- combined with the column
-- grant above, this only ever lets them touch name/roll_number/
-- academic_department/batch on themselves, never role/org/staff department.
drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- academic_departments / batches: org-scoped read for any member;
-- admin-only writes. Same shape as `departments_select`/`departments_write_admin`.
drop policy if exists academic_departments_select on academic_departments;
create policy academic_departments_select on academic_departments
  for select using (
    organization_id = public.current_organization_id()
  );

drop policy if exists academic_departments_write_admin on academic_departments;
create policy academic_departments_write_admin on academic_departments
  for all using (
    organization_id = public.current_organization_id()
    and public.current_role() = 'admin'
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_role() = 'admin'
  );

drop policy if exists batches_select on batches;
create policy batches_select on batches
  for select using (
    organization_id = public.current_organization_id()
  );

drop policy if exists batches_write_admin on batches;
create policy batches_write_admin on batches
  for all using (
    organization_id = public.current_organization_id()
    and public.current_role() = 'admin'
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_role() = 'admin'
  );

-- departments: org-scoped read for any member; admin-only writes.
drop policy if exists departments_select on departments;
create policy departments_select on departments
  for select using (
    organization_id = public.current_organization_id()
  );

drop policy if exists departments_write_admin on departments;
create policy departments_write_admin on departments
  for all using (
    organization_id = public.current_organization_id()
    and public.current_role() = 'admin'
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_role() = 'admin'
  );

-- tickets: role-scoped visibility within the caller's own organization.
-- Staff are strictly scoped to their own department's tickets (not just
-- ones assigned to them, and not any unassigned ticket org-wide) -- a
-- Facilities staffer never sees an IT Support ticket, assigned or not.
drop policy if exists tickets_select on tickets;
create policy tickets_select on tickets
  for select using (
    organization_id = public.current_organization_id()
    and (
      public.current_role() = 'admin'
      or (
        public.current_role() = 'staff'
        and (
          department = public.current_department()
          or assigned_staff_id = auth.uid()
        )
      )
      or submitted_by = auth.uid()
    )
  );

drop policy if exists tickets_insert on tickets;
create policy tickets_insert on tickets
  for insert with check (
    organization_id = public.current_organization_id()
    and submitted_by = auth.uid()
  );

-- Staff can update tickets in their own department that are either
-- unassigned (to self-assign/pick up) or already assigned to themselves --
-- not a colleague's ticket in the same department, and never another
-- department's ticket even if unassigned.
drop policy if exists tickets_update on tickets;
create policy tickets_update on tickets
  for update using (
    organization_id = public.current_organization_id()
    and (
      public.current_role() = 'admin'
      or (
        public.current_role() = 'staff'
        and department = public.current_department()
        and (assigned_staff_id is null or assigned_staff_id = auth.uid())
      )
    )
  );

drop policy if exists tickets_delete on tickets;
create policy tickets_delete on tickets
  for delete using (
    organization_id = public.current_organization_id()
    and public.current_role() = 'admin'
  );

-- Admins can review classifier corrections for their own organization. Rows
-- are inserted only by the database trigger below, never directly by clients.
grant select on classification_feedback to authenticated;

drop policy if exists classification_feedback_select_admin on classification_feedback;
create policy classification_feedback_select_admin on classification_feedback
  for select using (
    organization_id = public.current_organization_id()
    and public.current_role() = 'admin'
  );

-- Classification provenance must remain the original result. This prevents a
-- later ticket edit from silently rewriting the baseline used for feedback.
create or replace function public.preserve_ticket_classification_origin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.predicted_department := old.predicted_department;
  new.predicted_priority := old.predicted_priority;
  new.classification_source := old.classification_source;
  new.classification_confidence := old.classification_confidence;
  return new;
end;
$$;

drop trigger if exists preserve_ticket_classification_origin_trigger on tickets;
create trigger preserve_ticket_classification_origin_trigger
  before update on tickets
  for each row execute function public.preserve_ticket_classification_origin();

create or replace function public.capture_classification_feedback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.department is distinct from old.department
     or new.priority is distinct from old.priority then
    insert into classification_feedback (
      organization_id,
      ticket_id,
      original_predicted_department,
      original_predicted_priority,
      previous_department,
      previous_priority,
      corrected_department,
      corrected_priority,
      corrected_by_user_id
    ) values (
      new.organization_id,
      new.id,
      coalesce(old.predicted_department, old.department),
      coalesce(old.predicted_priority, old.priority),
      old.department,
      old.priority,
      new.department,
      new.priority,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists capture_classification_feedback_trigger on tickets;
create trigger capture_classification_feedback_trigger
  after update of department, priority on tickets
  for each row execute function public.capture_classification_feedback();

-- pending_invites: readable/writable only via the service-role key
-- (the backend's staff-invite endpoint) -- no policy for 'authenticated' at all.

-- ---------------------------------------------------------------------------
-- Storage: 'attachments' bucket, path convention {organization_id}/{ticket_id}/{filename}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists attachments_read on storage.objects;
create policy attachments_read on storage.objects
  for select using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );

drop policy if exists attachments_write on storage.objects;
create policy attachments_write on storage.objects
  for insert with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );
