-- Culture Diagnosis v5: single survey + identifiable admin response view.
-- Run once in Supabase SQL Editor BEFORE deploying the v5 application.
-- Existing Pilot data is preserved. New responses will store employee_id for authorized Admin use.

begin;

alter table public.survey_responses
  add column if not exists employee_id text;

-- Add FK only when it does not already exist.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'survey_responses_employee_id_fkey'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_employee_id_fkey
      foreign key (employee_id)
      references public.employees(employee_id)
      on update cascade
      on delete restrict;
  end if;
end $$;

create index if not exists survey_responses_version_employee_idx
  on public.survey_responses(survey_version, employee_id, submitted_at desc);

-- Keep legacy scenario/simple columns and tables so historical Pilot data remains readable,
-- but v5 application submits only survey_type='scenario'.

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
  if p_survey_type <> 'scenario' then
    raise exception 'INVALID_SURVEY_TYPE';
  end if;
  if p_survey_mode <> 'side_by_side' then
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
      and survey_type = 'scenario'
  ) then
    raise exception 'ALREADY_SUBMITTED';
  end if;

  insert into public.survey_responses (
    employee_id,
    survey_version, survey_type, survey_mode, order_group, duration_seconds,
    bu, department, section, job_level,
    answers, current_scores, desired_scores, gaps, current_top, desired_top
  ) values (
    p_employee_id,
    p_survey_version, 'scenario', 'side_by_side', null, p_duration_seconds,
    v_employee.bu, v_employee.department, v_employee.section, v_employee.job_level,
    p_answers, p_current_scores, p_desired_scores, p_gaps, p_current_top, p_desired_top
  ) returning id into v_response_id;

  insert into public.participant_completions (
    employee_id, survey_version, survey_type
  ) values (
    p_employee_id, p_survey_version, 'scenario'
  );

  return jsonb_build_object('ok', true, 'responseId', v_response_id);
end;
$$;

revoke all on function public.submit_culture_survey(text,text,text,text,text,integer,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) from public;
grant execute on function public.submit_culture_survey(text,text,text,text,text,integer,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) to service_role;

commit;
