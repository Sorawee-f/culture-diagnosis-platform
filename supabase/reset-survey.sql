-- DANGER: Use only when starting a completely new pilot test round.
-- This removes all survey answers, experience feedback, final preferences and login logs.
truncate table public.pilot_final_feedback;
truncate table public.survey_experience_feedback;
truncate table public.participant_completions;
truncate table public.survey_responses;
truncate table public.login_events;
