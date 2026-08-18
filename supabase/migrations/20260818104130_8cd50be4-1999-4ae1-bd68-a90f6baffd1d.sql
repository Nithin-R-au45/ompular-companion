create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, age, bio)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, 'friend@'), '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'age', '')::int, 0),
    coalesce(new.raw_user_meta_data ->> 'bio', '')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;