-- Culture Diagnosis Platform schema
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.employees (
  employee_id text primary key,
  name text,
  surname text,
  nickname text,
  email text,
  bu text,
  department text,
  section text,
  job_level text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('employee','admin')),
  employee_id text,
  success boolean not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists login_events_created_at_idx on public.login_events(created_at desc);
create index if not exists login_events_employee_id_idx on public.login_events(employee_id);

-- Stores only completion status for tracking non-responders.
create table if not exists public.participant_completions (
  employee_id text primary key references public.employees(employee_id) on update cascade on delete restrict,
  survey_version text not null,
  submitted_at timestamptz not null default now()
);

-- Deliberately contains no employee_id. Demographic snapshots are stored for aggregate analysis.
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  submission_code text not null unique default encode(gen_random_bytes(8), 'hex'),
  survey_version text not null,
  bu text,
  department text,
  section text,
  job_level text,
  answers jsonb not null,
  current_scores jsonb not null,
  desired_scores jsonb not null,
  gaps jsonb not null,
  current_top jsonb not null,
  desired_top jsonb not null,
  submitted_at timestamptz not null default now()
);
create index if not exists survey_responses_submitted_at_idx on public.survey_responses(submitted_at desc);
create index if not exists survey_responses_bu_idx on public.survey_responses(bu);
create index if not exists survey_responses_department_idx on public.survey_responses(department);

alter table public.employees enable row level security;
alter table public.login_events enable row level security;
alter table public.participant_completions enable row level security;
alter table public.survey_responses enable row level security;

-- No anon/authenticated policies are created. The browser cannot access tables directly.
-- All database access happens from trusted Next.js Route Handlers with the service role key.

create or replace function public.submit_culture_survey(
  p_employee_id text,
  p_survey_version text,
  p_answers jsonb,
  p_current_scores jsonb,
  p_desired_scores jsonb,
  p_gaps jsonb,
  p_current_top jsonb,
  p_desired_top jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee public.employees%rowtype;
  v_response_id uuid;
begin
  select * into v_employee
  from public.employees
  where employee_id = p_employee_id and status = 'active'
  for update;

  if not found then
    raise exception 'EMPLOYEE_NOT_FOUND';
  end if;

  if exists (select 1 from public.participant_completions where employee_id = p_employee_id) then
    raise exception 'ALREADY_SUBMITTED';
  end if;

  insert into public.survey_responses (
    survey_version, bu, department, section, job_level,
    answers, current_scores, desired_scores, gaps, current_top, desired_top
  ) values (
    p_survey_version, v_employee.bu, v_employee.department, v_employee.section, v_employee.job_level,
    p_answers, p_current_scores, p_desired_scores, p_gaps, p_current_top, p_desired_top
  ) returning id into v_response_id;

  insert into public.participant_completions (employee_id, survey_version)
  values (p_employee_id, p_survey_version);

  return jsonb_build_object('ok', true, 'responseId', v_response_id);
end;
$$;

revoke all on function public.submit_culture_survey(text,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) from public;
grant execute on function public.submit_culture_survey(text,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) to service_role;
