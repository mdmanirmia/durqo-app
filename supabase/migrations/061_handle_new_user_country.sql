-- Capture country at signup time.
--
-- RegisterForm.tsx now collects a required Country field (the same ISO
-- 3166-1 alpha-2 <select> as Account Details — see migration 060 and
-- src/lib/countries.ts) and passes it through auth.signUp()'s
-- options.data, alongside the existing full_name/role. This updates
-- handle_new_user() to copy it into profiles.country on insert, so a
-- seller/buyer has a country on their profile from the moment they sign
-- up rather than only after a later trip to Account Details.
--
-- Metadata is caller-supplied on a public, unauthenticated call, so it's
-- format-checked here (exactly two uppercase ASCII letters) rather than
-- trusted outright; anything else is dropped to null instead of failing
-- the signup. This only guards shape, not that the code is a real
-- country — same as the app-side COUNTRY_MAP check, an unrecognized code
-- just never matches a name/flag on display.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta_role text := new.raw_user_meta_data->>'role';
  meta_country text := upper(new.raw_user_meta_data->>'country');
begin
  insert into public.profiles (id, full_name, role, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when meta_role = 'seller' then 'seller' else 'buyer' end,
    case when meta_country ~ '^[A-Z]{2}$' then meta_country else null end
  );
  return new;
end;
$$ language plpgsql security definer;
