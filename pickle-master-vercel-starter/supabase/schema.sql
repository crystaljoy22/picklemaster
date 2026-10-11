-- Run this in Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  email text not null,
  booking_date date not null,
  start_hour integer not null check (start_hour >= 8 and start_hour < 22),
  duration integer not null check (duration >= 1 and duration <= 14),
  payment_method text not null check (payment_method in ('GCash','Maya')),
  payment_reference text not null,
  notes text,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','confirmed','rejected','cancelled')),
  constraint valid_booking_hours check (start_hour + duration <= 22)
);

create index if not exists bookings_date_status_idx
  on public.bookings (booking_date, status);

-- Public visitors can only read the time blocks and status fields used for availability.
alter table public.bookings enable row level security;

drop policy if exists "public can read booking availability" on public.bookings;
create policy "public can read booking availability"
on public.bookings for select to anon
using (status in ('pending','confirmed'));

-- Intentionally do NOT add an anonymous INSERT/UPDATE policy.
-- The included API route uses the public anon key, so before live launch you must
-- replace that route with a trusted server-side write using a server-only service-role
-- key and server-side validation, or use a Supabase Edge Function. Never expose the
-- service-role key in NEXT_PUBLIC_* variables or browser code.
