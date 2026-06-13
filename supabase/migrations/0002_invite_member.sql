-- ============================================================
-- 0002 — 旅伴邀請函式
-- users 表 RLS 只允許讀自己，無法用 email 查其他使用者，
-- 因此用 security definer RPC 完成「owner 以 email 邀請已註冊使用者」。
-- ============================================================

drop function if exists public.invite_member_by_email(uuid, text, text);

create function public.invite_member_by_email(
  p_trip_id uuid,
  p_email text,
  p_nickname text default null,
  p_avatar_color text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users%rowtype;
  v_member_id uuid;
begin
  -- 僅 trip owner 可邀請
  if not exists (
    select 1 from public.trips
    where id = p_trip_id and owner_id = auth.uid()
  ) then
    raise exception '只有行程建立者可以邀請旅伴';
  end if;

  select * into v_user
  from public.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_user.id is null then
    raise exception '找不到這個 Email 的使用者，請確認對方已註冊';
  end if;

  if exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = v_user.id
  ) then
    raise exception '這位使用者已經是旅伴了';
  end if;

  insert into public.trip_members (trip_id, user_id, nickname, avatar_color, is_owner)
  values (
    p_trip_id,
    v_user.id,
    coalesce(nullif(trim(p_nickname), ''), v_user.display_name, split_part(v_user.email, '@', 1)),
    p_avatar_color,
    false
  )
  returning id into v_member_id;

  return v_member_id;
end;
$$;
