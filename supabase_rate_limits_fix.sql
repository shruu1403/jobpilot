-- Fix the insert statement to include v_today
create or replace function public.increment_usage(
  p_identifier text,
  p_identifier_type text,
  p_feature text,
  p_limit integer
) returns json language plpgsql security definer as $$
declare
  v_count integer;
  v_today date := current_date;
begin
  -- Try to find existing record for today
  select usage_count into v_count
  from public.daily_usage
  where identifier = p_identifier
    and identifier_type = p_identifier_type
    and feature = p_feature
    and date = v_today;

  -- If no record exists, they haven't used it today
  if v_count is null then
    if p_limit > 0 then
      -- FIXED: added v_today to the values list!
      insert into public.daily_usage (identifier, identifier_type, feature, date, usage_count)
      values (p_identifier, p_identifier_type, p_feature, v_today, 1);
      return json_build_object('allowed', true, 'count', 1);
    else
      return json_build_object('allowed', false, 'count', 0);
    end if;
  end if;

  -- If record exists, check limit
  if v_count >= p_limit then
    return json_build_object('allowed', false, 'count', v_count);
  end if;

  -- Increment usage
  update public.daily_usage
  set usage_count = usage_count + 1
  where identifier = p_identifier
    and identifier_type = p_identifier_type
    and feature = p_feature
    and date = v_today;

  return json_build_object('allowed', true, 'count', v_count + 1);
end;
$$;
