import { NextResponse } from "next/server";
import { getSupabase, getAdminSupabase } from "@/lib/supabase";

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const RATE = 350;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Choose a date." }, { status: 400 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Booking database is not configured yet." }, { status: 503 });
  const { data, error } = await supabase.from("bookings")
    .select("booking_date,start_hour,duration,status")
    .eq("booking_date", date)
    .in("status", ["pending", "confirmed"]);
  if (error) return NextResponse.json({ error: "Could not load availability." }, { status: 500 });
  return NextResponse.json({ bookings: data ?? [], openHour: OPEN_HOUR, closeHour: CLOSE_HOUR, rate: RATE });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { fullName, phone, email, date, startHour, duration, paymentMethod, reference, notes } = body;
  if (!fullName || !phone || !email || !date || startHour === undefined || !duration || !paymentMethod || !reference) {
    return NextResponse.json({ error: "Please complete all required fields, including payment reference." }, { status: 400 });
  }
  if (!["GCash", "Maya"].includes(paymentMethod)) return NextResponse.json({ error: "Choose GCash or Maya." }, { status: 400 });
  if (!Number.isInteger(startHour) || !Number.isInteger(duration) || startHour < OPEN_HOUR || duration < 1 || startHour + duration > CLOSE_HOUR) {
    return NextResponse.json({ error: "Choose a valid time and duration." }, { status: 400 });
  }
  const bookingDate = new Date(`${date}T00:00:00+08:00`);
  if (Number.isNaN(bookingDate.getTime()) || bookingDate.getTime() < new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })).setHours(0,0,0,0)) {
    return NextResponse.json({ error: "Choose today or a future date." }, { status: 400 });
  }
  const supabase = getAdminSupabase();
  if (!supabase) return NextResponse.json({ error: "Server database credentials are not configured yet." }, { status: 503 });

  // Check overlapping reservations. For production, also add a database exclusion/locking strategy to prevent simultaneous requests.
  const { data: existing, error: checkError } = await supabase.from("bookings")
    .select("start_hour,duration")
    .eq("booking_date", date)
    .in("status", ["pending", "confirmed"]);
  if (checkError) return NextResponse.json({ error: "Could not verify availability." }, { status: 500 });
  const overlaps = (existing ?? []).some((b: {start_hour:number;duration:number}) =>
    startHour < b.start_hour + b.duration && startHour + duration > b.start_hour
  );
  if (overlaps) return NextResponse.json({ error: "That time overlaps with another reservation. Please choose another time." }, { status: 409 });

  const { data, error } = await supabase.from("bookings").insert({
    full_name: String(fullName).trim(), phone: String(phone).trim(), email: String(email).trim(),
    booking_date: date, start_hour: startHour, duration, payment_method: paymentMethod,
    payment_reference: String(reference).trim(), notes: notes ? String(notes).trim() : null,
    amount: duration * RATE, status: "pending"
  }).select("id,amount,status").single();
  if (error) return NextResponse.json({ error: "Could not save booking. Please try again." }, { status: 500 });
  return NextResponse.json({ booking: data, message: "Booking request submitted. It remains pending until staff verifies your payment." }, { status: 201 });
}