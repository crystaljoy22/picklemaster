 "use client";
import { useEffect, useMemo, useState } from "react";

type Existing = { start_hour: number; duration: number; status: string };
const money = (n: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
const timeLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;

export default function Home() {
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [bookings, setBookings] = useState<Existing[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{text:string;kind:"success"|"error"}|null>(null);
  const [form, setForm] = useState({fullName:"",phone:"",email:"",paymentMethod:"GCash",reference:"",notes:""});
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  useEffect(() => {
    if (!date) return;
    let live = true;
    setLoadingSlots(true); setStartHour(null);
    fetch(`/api/bookings?date=${encodeURIComponent(date)}`).then(async r => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load times.");
      if (live) setBookings(d.bookings || []);
    }).catch(e => { if(live) setMessage({text:e.message,kind:"error"}); })
      .finally(() => { if(live) setLoadingSlots(false); });
    return () => { live = false; };
  }, [date]);

  const hours = Array.from({length:14},(_,i)=>i+8);
  const unavailable = (h:number) => bookings.some(b => h < b.start_hour+b.duration && h+duration > b.start_hour);
  const total = duration * 350;
  const end = startHour === null ? null : startHour + duration;

  function update<K extends keyof typeof form>(key:K,value:typeof form[K]) { setForm(old=>({...old,[key]:value})); }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/bookings", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,date,startHour,duration})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit booking.");
      setMessage({text:`${data.message} Booking ID: ${data.booking.id}. Total: ${money(data.booking.amount)}.`,kind:"success"});
      setForm({fullName:"",phone:"",email:"",paymentMethod:"GCash",reference:"",notes:""});
      const refresh = await fetch(`/api/bookings?date=${encodeURIComponent(date)}`).then(r=>r.json());
      setBookings(refresh.bookings || []);
      setStartHour(null);
    } catch(e) { setMessage({text:e instanceof Error?e.message:"Something went wrong.",kind:"error"}); }
    finally { setBusy(false); }
  }

  return <main className="wrap">
    <nav className="nav"><a className="brand" href="#">PICKLE<span>MASTER</span></a><span className="navtag">COURT BOOKINGS · PLAY YOUR GAME</span></nav>
    <section className="hero">
      <div><div className="eyebrow">Your next game starts here</div><h1>Book a court.<br/>Bring your game.</h1><p>Choose your date, tap the hourly slots you want, and send your reservation request. We’ll confirm once your full payment is verified.</p></div>
      <div className="price"><span className="pill">COURT RENTAL</span><div><div className="big">₱350<small style={{fontSize:18,letterSpacing:0}}>/hour</small></div><div style={{opacity:.8}}>One court · Flexible hourly booking</div></div></div>
    </section>
    <section className="section">
      <div className="sectionhead"><div><h2>Reserve your time</h2><p>Pick a date and start time, then select consecutive hourly blocks.</p></div><span className="muted">Daily schedule: 8:00 AM – 10:00 PM</span></div>
      <div className="layout">
        <div className="panel">
          <h3>01 / Choose your slot</h3><p className="muted">Select the date first. Unavailable times will be disabled based on saved bookings.</p>
          <div className="field"><label htmlFor="date">Booking date *</label><input id="date" type="date" min={minDate} value={date} onChange={e=>{setDate(e.target.value);setMessage(null)}} required/></div>
          <div className="field"><label>Start time *</label></div>
          {!date ? <div className="notice">Choose a date to see available start times.</div> : loadingSlots ? <p className="muted">Checking availability…</p> :
            <div className="slots">{hours.filter(h=>h<22).map(h=><button type="button" key={h} className={`slot ${startHour===h?"selected":""}`} disabled={h+duration>22||unavailable(h)} onClick={()=>setStartHour(h)}>{timeLabel(h)}</button>)}</div>}
          <div className="field"><label>How many hours? *</label><p className="muted">Choose a duration. The selected consecutive hours must all be available.</p></div>
          <div className="duration">{[1,2,3,4].map(n=><button type="button" key={n} className={duration===n?"selected":""} onClick={()=>{setDuration(n);setStartHour(null)}}>{n} {n===1?"hour":"hours"}</button>)}</div>
          {startHour!==null&&<div className="summary"><div className="summaryrow"><span>Selected time</span><strong>{timeLabel(startHour)} – {timeLabel(end===24?0:end!) }{end===24?" (next day)":""}</strong></div><div className="summaryrow"><span>Duration</span><strong>{duration} {duration===1?"hour":"hours"}</strong></div><div className="summaryrow"><span>Total</span><strong className="total">{money(total)}</strong></div></div>}
          <div className="notice">Your request is not confirmed until staff checks your payment and approves the booking. Avoid sending a second request for the same slot.</div>
        </div>
        <form className="panel" onSubmit={submit}>
          <h3>02 / Your details</h3><p className="muted">Use accurate contact details so the team can reach you about your reservation.</p>
          <div className="field"><label htmlFor="name">Full name *</label><input id="name" value={form.fullName} onChange={e=>update("fullName",e.target.value)} autoComplete="name" required maxLength={100}/></div>
          <div className="field"><label htmlFor="phone">Phone number *</label><input id="phone" type="tel" value={form.phone} onChange={e=>update("phone",e.target.value)} autoComplete="tel" required maxLength={30}/></div>
          <div className="field"><label htmlFor="email">Email address *</label><input id="email" type="email" value={form.email} onChange={e=>update("email",e.target.value)} autoComplete="email" required maxLength={200}/></div>
          <div className="field"><label htmlFor="payment">Payment method *</label><select id="payment" value={form.paymentMethod} onChange={e=>update("paymentMethod",e.target.value)}><option>GCash</option><option>Maya</option></select></div>
          <div className="notice">Pay the full amount using your selected e-wallet, then enter the transaction/reference number below. Add your official GCash/Maya payment instructions or QR code before publishing this site.</div>
          <div className="field"><label htmlFor="reference">Payment reference number *</label><input id="reference" value={form.reference} onChange={e=>update("reference",e.target.value)} required maxLength={100} placeholder="Enter transaction reference"/></div>
          <div className="field"><label htmlFor="notes">Additional notes (optional)</label><textarea id="notes" value={form.notes} onChange={e=>update("notes",e.target.value)} rows={3} maxLength={500} placeholder="Any requests for the team?"/></div>
          <div className="summary"><div className="summaryrow"><span>Rate</span><strong>₱350 / hour</strong></div><div className="summaryrow"><span>Selected hours</span><strong>{startHour===null?"Not selected":`${duration} ${duration===1?"hour":"hours"}`}</strong></div><div className="summaryrow"><span>Amount due</span><strong className="total">{money(total)}</strong></div></div>
          {message&&<div role="status" className={`notice ${message.kind}`}>{message.text}</div>}
          <button className="btn" type="submit" disabled={busy||!date||startHour===null}>{busy?"Submitting…":"Submit booking request"}</button>
          <p className="muted" style={{marginTop:12}}>By submitting, you agree that your details will be used to process this reservation.</p>
        </form>
      </div>
    </section>
    <footer className="footer"><span>© {new Date().getFullYear()} Pickle Master</span><span>Play fair. Play often.</span></footer>
  </main>;
}