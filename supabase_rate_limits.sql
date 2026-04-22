-- 1. Create the daily usage table
create table if not exists public.daily_usage (
  id uuid primary key default gen_random_uuid(),
  identifier text not null, -- IP address or User ID
  identifier_type text not null check (identifier_type in ('ip', 'user')),
  feature text not null, -- 'analyzer' or 'referral'
  date date not null default current_date,
  usage_count integer not null default 0,
  unique (identifier, identifier_type, feature, date)
);

-- 2. Secure it so clients can't just edit it directly
alter table public.daily_usage enable row level security;

-- 3. Create a Postgres function to safely increment usage
-- SECURITY DEFINER means it bypasses RLS so our backend API can run it securely
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
      insert into public.daily_usage (identifier, identifier_type, feature, date, usage_count)
      values (p_identifier, p_identifier_type, p_feature, 1);
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

-- 4. Create a Postgres function to simply check usage without incrementing
create or replace function public.get_usage(
  p_identifier text,
  p_identifier_type text,
  p_feature text
) returns integer language plpgsql security definer as $$
declare
  v_count integer;
begin
  select usage_count into v_count
  from public.daily_usage
  where identifier = p_identifier
    and identifier_type = p_identifier_type
    and feature = p_feature
    and date = current_date;

  return coalesce(v_count, 0);
end;
$$;
