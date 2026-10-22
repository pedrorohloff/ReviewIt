-- Auto-provision a public profile for every Supabase Auth user.
--
-- Supabase Auth owns `auth.users`; the application owns `public.profiles`.
-- The two rows share the same UUID. This migration:
--   1. Adds `profiles.onboarded` so the frontend can ask first-time users to
--      choose their display name and avatar.
--   2. Creates a collision-safe username generator.
--   3. Creates an AFTER INSERT trigger on `auth.users`.
--   4. Backfills existing auth users that have no profile yet.
--
-- Apply with a role that can create objects in `auth` (the Supabase `postgres`
-- role does). The application never inserts into `auth.users` itself.

alter table public.profiles
    add column if not exists onboarded boolean not null default false;

create or replace function public.generate_unique_username(base text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    normalized text;
    candidate text;
    suffix integer := 0;
begin
    normalized := lower(coalesce(base, ''));
    normalized := translate(
        normalized,
        'áàâãäéèêëíìîïóòôõöúùûüçñ',
        'aaaaaeeeeiiiiooooouuuucn'
    );
    normalized := regexp_replace(normalized, '\s+', '.', 'g');
    normalized := regexp_replace(normalized, '[^a-z0-9._-]+', '', 'g');
    normalized := regexp_replace(normalized, '[._-]{2,}', '.', 'g');
    normalized := trim(both '._-' from normalized);

    if char_length(normalized) < 3 then
        normalized := 'leitor';
    end if;

    normalized := left(normalized, 50);
    candidate := normalized;

    while exists (
        select 1
        from public.profiles
        where lower(username) = candidate
    ) loop
        suffix := suffix + 1;
        candidate := left(normalized, greatest(1, 50 - char_length(suffix::text) - 1))
                     || '-' || suffix;
    end loop;

    return candidate;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    base text;
    avatar text;
begin
    base := coalesce(
        new.raw_user_meta_data ->> 'username',
        new.raw_user_meta_data ->> 'full_name',
        split_part(new.email, '@', 1),
        new.id::text
    );
    avatar := nullif(left(coalesce(new.raw_user_meta_data ->> 'avatar_url', ''), 500), '');

    insert into public.profiles (id, username, avatar_url, role, account_status, onboarded)
    values (
        new.id,
        public.generate_unique_username(base),
        avatar,
        'Regular',
        'Active',
        false
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_auth_user();

-- Backfill users created before the trigger existed. The loop matters: each
-- insert must be visible to the username generator before the next row runs.
do $$
declare
    auth_user record;
begin
    for auth_user in
        select u.id,
               coalesce(
                   u.raw_user_meta_data ->> 'username',
                   u.raw_user_meta_data ->> 'full_name',
                   split_part(u.email, '@', 1),
                   u.id::text
               ) as base,
               nullif(left(coalesce(u.raw_user_meta_data ->> 'avatar_url', ''), 500), '') as avatar_url
        from auth.users u
        where not exists (
            select 1
            from public.profiles p
            where p.id = u.id
        )
    loop
        insert into public.profiles (id, username, avatar_url, role, account_status, onboarded)
        values (
            auth_user.id,
            public.generate_unique_username(auth_user.base),
            auth_user.avatar_url,
            'Regular',
            'Active',
            false
        );
    end loop;
end;
$$;
