-- V5: Credentials for application-managed email/password accounts.
--
-- Supabase Auth keeps owning magic-link and OAuth users. Locally registered
-- users have a row in public.profiles and, when they choose a password, one row
-- here as well. The two rows share the profile UUID.
--
-- BCrypt stores the salt inside the hash string, so there is no separate salt
-- column. The application normalizes emails to lowercase before inserting.

create table if not exists public.app_credentials (
    profile_id    uuid         primary key references public.profiles(id) on delete cascade,
    email         varchar(320) not null,
    password_hash varchar(100) not null,
    created_at    timestamptz  not null default now(),
    constraint app_credentials_email_unique unique (email),
    constraint app_credentials_email_lowercase check (email = lower(email))
);
