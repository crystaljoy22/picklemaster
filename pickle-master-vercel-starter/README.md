# Pickle Master booking starter (Vercel + Supabase)

A Next.js starter for Pickle Master: ₱350/court/hour, customer chooses a date/start time/duration, booking details are full name + phone + email, notes optional, and payment methods are GCash or Maya only. Booking requests should remain pending until staff verifies full payment.

## Important before going live

This is a starter, not a finished payment or staff-admin system. Booking writes use a server-only Supabase service-role key in the API route; never expose that key in browser code or a `NEXT_PUBLIC_` variable. Add rate limiting / abuse protection and database-level protection against overlapping simultaneous requests before relying on this for public launch.

Recommended production setup:
- Vercel for hosting.
- Supabase for database.
- Add a staff-only admin page with authenticated login so staff can verify payments and change status from `pending` to `confirmed` or `rejected`.
- Add a staff-only admin page with authenticated login so staff can verify payments and change status from `pending` to `confirmed` or `rejected`.
- Add database-level protection against overlapping simultaneous bookings.
- Add your real GCash/Maya account details or QR images. This starter only asks for a payment reference and does not itself process or verify payments.
- Add your actual venue address, phone/contact information, operating schedule and cancellation/refund policy.

## Run locally

1. Install Node.js LTS and Git.
2. Extract this folder and open a terminal in it.
3. Run `npm install`.
4. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key.
5. In Supabase, open SQL Editor and run `supabase/schema.sql`.
6. Run `npm run dev`, then open `http://localhost:3000`.

The public availability request uses the anon key and the table's read policy. Booking submission uses the server-only service-role key. Keep that key private, add rate limiting and database-level overlap protection before public launch.

## Deploy on Vercel

1. Push this project to a new GitHub repository.
2. Sign in to Vercel and choose **Add New → Project**.
3. Import the GitHub repository. Framework preset should be Next.js.
4. In Vercel → Project Settings → Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only secret; never use a `NEXT_PUBLIC_` prefix)
5. Deploy. Every time you push to the connected GitHub branch, Vercel can redeploy.

## Main files

- `app/page.tsx` — booking UI.
- `app/api/bookings/route.ts` — availability and booking endpoints.
- `supabase/schema.sql` — initial database table and availability read policy.
- `.env.example` — required public Supabase configuration keys.

## Current starter assumptions

- Court opens 8:00 AM and last booking ends at 10:00 PM.
- Rate is ₱350 per hour.
- Booking durations shown are 1–4 consecutive hours.
- GCash and Maya only; full payment and staff verification required.
- No pay-at-venue option.
