-- Upgrade an existing Culture Diagnosis prototype to Pilot Comparison v4.
-- Run once in Supabase SQL Editor before deploying the new code.

begin;

alter table public.participant_completions
  add column if not exists survey_type text;
update public.participant_completions
  set survey_type = 'scenario'
  where survey_type is null;
alter table public.participant_completions
  alter column survey_type set not null;

alter table public.participant_completions
  drop constraint if exists participant_completions_survey_type_check;
alter table public.participant_completions
  add constraint participant_completions_survey_type_check
  check (survey_type in ('scenario','simple'));

alter table public.participant_completions
  drop constraint if exists participant_completions_pkey;
alter table public.participant_completions
  add primary key (employee_id, survey_version, survey_type);

create index if not exists participant_completions_version_idx
  on public.participant_completions(survey_version, survey_type, submitted_at desc);

alter table public.survey_responses
  add column if not exists survey_type text not null default 'scenario',
  add column if not exists survey_mode text not null default 'side_by_side',
  add column if not exists order_group text,
  add column if not exists duration_seconds integer;

alter table public.survey_responses
  drop constraint if exists survey_responses_survey_type_check;
alter table public.survey_responses
  add constraint survey_responses_survey_type_check
  check (survey_type in ('scenario','simple'));

alter table public.survey_responses
  drop constraint if exists survey_responses_survey_mode_check;
alter table public.survey_responses
  add constraint survey_responses_survey_mode_check
  check (survey_mode in ('side_by_side','sequential'));

alter table public.survey_responses
  drop constraint if exists survey_responses_order_group_check;
alter table public.survey_responses
  add constraint survey_responses_order_group_check
  check (order_group is null or order_group in ('scenario_first','simple_first'));

alter table public.survey_responses
  drop constraint if exists survey_responses_duration_seconds_check;
alter table public.survey_responses
  add constraint survey_responses_duration_seconds_check
  check (duration_seconds is null or duration_seconds between 1 and 14400);

create index if not exists survey_responses_version_type_idx
  on public.survey_responses(survey_version, survey_type, submitted_at desc);

create table if not exists public.survey_experience_feedback (
  employee_id text not null references public.employees(employee_id) on update cascade on delete restrict,
  survey_version text not null,
  survey_type text not null check (survey_type in ('scenario','simple')),
  easy_to_understand smallint not null check (easy_to_understand between 1 and 5),
  reflects_reality smallint not null check (reflects_reality between 1 and 5),
  current_desired_clear smallint not null check (current_desired_clear between 1 and 5),
  appropriate_length smallint not null check (appropriate_length between 1 and 5),
  suitable_for_all_levels smallint not null check (suitable_for_all_levels between 1 and 5),
  confusion_text text,
  submitted_at timestamptz not null default now(),
  primary key (employee_id, survey_version, survey_type)
);

create table if not exists public.pilot_final_feedback (
  employee_id text not null references public.employees(employee_id) on update cascade on delete restrict,
  survey_version text not null,
  preferred_survey text not null check (preferred_survey in ('scenario','simple','hybrid','no_difference')),
  survey_reason text,
  preferred_mode text not null check (preferred_mode in ('side_by_side','sequential','no_difference')),
  clearer_mode text not null check (clearer_mode in ('side_by_side','sequential','no_difference')),
  completion_mode text not null check (completion_mode in ('side_by_side','sequential','no_difference')),
  mode_reason text,
  submitted_at timestamptz not null default now(),
  primary key (employee_id, survey_version)
);

alter table public.survey_experience_feedback enable row level security;
alter table public.pilot_final_feedback enable row level security;

create index if not exists survey_experience_feedback_version_idx
  on public.survey_experience_feedback(survey_version, survey_type);
create index if not exists pilot_final_feedback_version_idx
  on public.pilot_final_feedback(survey_version, submitted_at desc);

drop function if exists public.submit_culture_survey(text,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb);

create or replace function public.submit_culture_survey(
  p_employee_id text,
  p_survey_version text,
  p_survey_type text,
  p_survey_mode text,
  p_order_group text,
  p_duration_seconds integer,
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
  if p_survey_type not in ('scenario','simple') then
    raise exception 'INVALID_SURVEY_TYPE';
  end if;
  if p_survey_mode not in ('side_by_side','sequential') then
    raise exception 'INVALID_SURVEY_MODE';
  end if;

  select * into v_employee
  from public.employees
  where employee_id = p_employee_id and status = 'active'
  for update;

  if not found then
    raise exception 'EMPLOYEE_NOT_FOUND';
  end if;

  if exists (
    select 1 from public.participant_completions
    where employee_id = p_employee_id
      and survey_version = p_survey_version
      and survey_type = p_survey_type
  ) then
    raise exception 'ALREADY_SUBMITTED';
  end if;

  insert into public.survey_responses (
    survey_version, survey_type, survey_mode, order_group, duration_seconds,
    bu, department, section, job_level,
    answers, current_scores, desired_scores, gaps, current_top, desired_top
  ) values (
    p_survey_version, p_survey_type, p_survey_mode, p_order_group, p_duration_seconds,
    v_employee.bu, v_employee.department, v_employee.section, v_employee.job_level,
    p_answers, p_current_scores, p_desired_scores, p_gaps, p_current_top, p_desired_top
  ) returning id into v_response_id;

  insert into public.participant_completions (
    employee_id, survey_version, survey_type
  ) values (
    p_employee_id, p_survey_version, p_survey_type
  );

  return jsonb_build_object('ok', true, 'responseId', v_response_id);
end;
$$;

revoke all on function public.submit_culture_survey(text,text,text,text,text,integer,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) from public;
grant execute on function public.submit_culture_survey(text,text,text,text,text,integer,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) to service_role;

commit;
