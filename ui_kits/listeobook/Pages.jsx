// Page-level scenes & demo data
const DEMO_CATEGORIES = [
  { id: 'c-w', slug: 'wellness', name: 'Wellness' },
  { id: 'c-b', slug: 'beauty',   name: 'Beauty' },
  { id: 'c-f', slug: 'fitness',  name: 'Fitness' },
];

const DEMO_SERVICES = [
  { id: 's1', name: 'Deep Tissue Massage', business: { name: 'Riverside Spa' }, category: DEMO_CATEGORIES[0], price: 8500, duration_minutes: 60, avg_rating: 4.9, review_count: 142, next_slot_label: 'Today 4:00 PM', urgent: false },
  { id: 's2', name: 'Signature Manicure',  business: { name: 'Glow Nail Studio' }, category: DEMO_CATEGORIES[1], price: 4800, duration_minutes: 45, avg_rating: 4.7, review_count: 86, next_slot_label: 'Tomorrow', urgent: false },
  { id: 's3', name: 'Personal Training Session', business: { name: 'Anchor Fitness' }, category: DEMO_CATEGORIES[2], price: 7000, duration_minutes: 60, avg_rating: 4.8, review_count: 53, next_slot_label: 'Today 6:30 PM', urgent: false },
  { id: 's4', name: 'Hot Stone Therapy', business: { name: 'Riverside Spa' }, category: DEMO_CATEGORIES[0], price: 11000, duration_minutes: 90, avg_rating: 5.0, review_count: 71, next_slot_label: 'Wed, May 1', urgent: false },
  { id: 's5', name: 'Hair Color & Cut', business: { name: 'Forma Salon' }, category: DEMO_CATEGORIES[1], price: 14500, duration_minutes: 120, avg_rating: 4.6, review_count: 204, next_slot_label: 'Fully booked', urgent: true },
  { id: 's6', name: 'Yoga Class — Vinyasa', business: { name: 'Anchor Fitness' }, category: DEMO_CATEGORIES[2], price: 2500, duration_minutes: 60, avg_rating: 4.9, review_count: 318, next_slot_label: 'Today 5:30 PM', urgent: false },
];

function generateSlots() {
  const times = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  return times.map((t, i) => ({
    time: t,
    label: new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    available: i !== 1 && i !== 6,
  }));
}

const DEMO_BOOKINGS = [
  { id: 'b1', reference: 'BK-7Y3X92', status: 'confirmed', service: DEMO_SERVICES[0], business: DEMO_SERVICES[0].business, date_label: 'May 4, 2026', time_label: '2:00 PM', price: 8500, can_cancel: true, can_reschedule: true },
  { id: 'b2', reference: 'BK-A1F4QQ', status: 'pending', service: DEMO_SERVICES[2], business: DEMO_SERVICES[2].business, date_label: 'May 6, 2026', time_label: '6:30 PM', price: 7000, can_cancel: true, can_reschedule: true },
  { id: 'b3', reference: 'BK-Z9P0LM', status: 'completed', service: DEMO_SERVICES[5], business: DEMO_SERVICES[5].business, date_label: 'Apr 22, 2026', time_label: '5:30 PM', price: 2500, can_cancel: false, can_reschedule: false },
];

// Hero + listing
const ServicesPage = ({ onOpenService }) => {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState(null);
  const [sort, setSort] = useState('soonest');
  let services = DEMO_SERVICES.filter(s =>
    (!cat || s.category.id === cat) &&
    (!query || s.name.toLowerCase().includes(query.toLowerCase()) || s.business.name.toLowerCase().includes(query.toLowerCase()))
  );
  if (sort === 'price_asc') services = [...services].sort((a,b) => a.price - b.price);
  if (sort === 'price_desc') services = [...services].sort((a,b) => b.price - a.price);

  return (
    <>
      <div className="hero">
        <div className="hero-dots" />
        <div className="hero-inner">
          <h1>Find &amp; Book Local Services</h1>
          <p>Wellness, beauty, fitness and more — book your next appointment in seconds.</p>
          <div className="hero-search">
            <span className="ic"><LbIcon name="search" size={20} /></span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search services or businesses..." />
          </div>
        </div>
      </div>
      <div className="container">
        <div className="controls">
          <div className="pills">
            <button className={`pill ${!cat ? 'active' : ''}`} onClick={() => setCat(null)}>All</button>
            {DEMO_CATEGORIES.map(c => (
              <button key={c.id} className={`pill ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>{c.name}</button>
            ))}
          </div>
          <div className="right">
            <span className="muted" style={{ fontSize: 13 }}>{services.length} found</span>
            <select className="select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="soonest">Soonest available</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="duration_asc">Duration</option>
            </select>
          </div>
        </div>
        <div className="svc-grid">
          {services.map(s => <ServiceCard key={s.id} service={s} onClick={() => onOpenService(s.id)} />)}
        </div>
        <div style={{ height: 32 }} />
      </div>
    </>
  );
};

const ServiceDetailPage = ({ serviceId, onBook, onBack }) => {
  const service = DEMO_SERVICES.find(s => s.id === serviceId) || DEMO_SERVICES[0];
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [time, setTime] = useState(null);
  const slots = generateSlots();
  const grad = { wellness: 'linear-gradient(135deg,#5dc6d3,#1fa8be)', beauty: 'linear-gradient(135deg,#fda4af,#be123c)', fitness: 'linear-gradient(135deg,#fcd34d,#b45309)' }[service.category.slug];

  return (
    <div className="container" style={{ padding: '24px 16px 0' }}>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: 0, marginBottom: 16 }}>
        <LbIcon name="arrow-left" size={14} /> Back to services
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
        <div>
          <div style={{ height: 320, background: grad, borderRadius: 16, position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ position: 'absolute', top: 16, left: 16 }}>
              <CategoryPill slug={service.category.slug}>{service.category.name}</CategoryPill>
            </div>
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.015em' }}>{service.name}</h1>
          <div className="muted" style={{ fontSize: 15, marginTop: 4 }}>{service.business.name}</div>
          <div className="row mt-2" style={{ marginBottom: 24 }}>
            <span style={{ color: '#f59e0b' }}>★</span>
            <span style={{ fontWeight: 600 }}>{service.avg_rating}</span>
            <span className="muted">({service.review_count} reviews)</span>
            <span className="muted" style={{ margin: '0 8px' }}>·</span>
            <span className="row" style={{ gap: 6 }}><LbIcon name="clock" size={14} /><span>{service.duration_minutes} min</span></span>
          </div>
          <div className="card card-padded" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>About this service</h3>
            <p style={{ margin: 0, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              Relieve deep muscle tension with our signature treatment. Our certified therapists tailor pressure and technique to your needs. Towels, oils, and a quiet private room are provided.
            </p>
          </div>
          <div className="card card-padded">
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Reviews</h3>
            {[
              { n: 'Sarah M.', r: 5, t: 'Absolutely incredible — felt brand new afterwards.' },
              { n: 'Daniel K.', r: 5, t: 'Easy to book, friendly staff, beautiful space.' },
              { n: 'Priya R.', r: 4, t: 'Great experience, will rebook for next month.' },
            ].map((r, i) => (
              <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div className="row gap-2"><span style={{ fontWeight: 600 }}>{r.n}</span><span style={{ color: '#f59e0b' }}>{'★'.repeat(r.r)}</span></div>
                <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>{r.t}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'sticky', top: 80 }}>
          <BookingPanel
            slots={slots}
            selectedDate={date}
            selectedTime={time}
            onPickDate={d => { setDate(d); setTime(null); }}
            onPickTime={setTime}
            onContinue={() => onBook(service.id, date, time)}
          />
          <div className="card card-padded" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="muted">Price per session</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 22 }}>${(service.price/100).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 48 }} />
    </div>
  );
};

const BookWizard = ({ serviceId, date, time, onConfirm, onBack }) => {
  const service = DEMO_SERVICES.find(s => s.id === serviceId) || DEMO_SERVICES[0];
  const [step, setStep] = useState(1);
  const [reference] = useState('BK-' + Math.random().toString(36).slice(2, 8).toUpperCase());

  return (
    <div className="container" style={{ padding: '32px 16px' }}>
      <div className="steps">
        {['Date & time', 'Review', 'Confirmed'].map((lbl, i) => (
          <React.Fragment key={lbl}>
            <div className={`step ${step === i+1 ? 'active' : step > i+1 ? 'done' : ''}`}>
              <div className="step-dot">{step > i+1 ? '✓' : i+1}</div>
              <span className="lbl">{lbl}</span>
            </div>
            {i < 2 && <div className={`step-bar ${step > i+1 ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {step === 1 && (
          <div className="card card-padded">
            <h2 style={{ margin: '0 0 6px' }}>Confirm your slot</h2>
            <div className="muted mb-4">{service.name} · {service.business.name}</div>
            <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="field"><span>Date</span><b>{date}</b></div>
              <div className="field"><span>Time</span><b>{time}</b></div>
            </div>
            <div className="row mt-6" style={{ justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={onBack}>Change</Button>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card card-padded">
            <h2 style={{ margin: '0 0 6px' }}>Review &amp; book</h2>
            <div className="muted mb-4">Verify your details before confirming.</div>
            <div className="row gap-4 mb-4" style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: 'linear-gradient(135deg,#5dc6d3,#1fa8be)' }} />
              <div>
                <div style={{ fontWeight: 600 }}>{service.name}</div>
                <div className="muted" style={{ fontSize: 13 }}>{service.business.name}</div>
              </div>
              <div className="right" style={{ fontWeight: 700, color: 'var(--primary)' }}>${(service.price/100).toFixed(0)}</div>
            </div>
            <div className="summary-grid mb-4">
              <div className="field"><span>Date</span><b>{date}</b></div>
              <div className="field"><span>Time</span><b>{time}</b></div>
              <div className="field"><span>Duration</span><b>{service.duration_minutes} min</b></div>
              <div className="field"><span>Total</span><b>${(service.price/100).toFixed(2)}</b></div>
            </div>
            <div style={{ background: 'var(--accent)', color: 'var(--fg)', padding: 12, borderRadius: 10, fontSize: 13 }}>
              <b>Cancellation:</b> Free cancellation up to 24 hours before your appointment.
            </div>
            <div className="row mt-6" style={{ justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Confirm booking</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="confirm">
            <div className="check"><LbIcon name="check" size={36} /></div>
            <h2>Booking confirmed</h2>
            <p>You're all set. We've sent a confirmation to your inbox.</p>
            <div className="ref">Ref: {reference}</div>
            <div className="row mt-6" style={{ justifyContent: 'center', gap: 12 }}>
              <Button variant="outline" onClick={onBack}>Browse more</Button>
              <Button onClick={() => onConfirm(reference)}>View my bookings</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AccountBookings = ({ onBook }) => {
  const [tab, setTab] = useState('upcoming');
  const [bookings, setBookings] = useState(DEMO_BOOKINGS);
  const filtered = bookings.filter(b => {
    if (tab === 'upcoming') return b.status === 'confirmed' || b.status === 'pending';
    if (tab === 'past') return b.status === 'completed';
    if (tab === 'cancelled') return b.status === 'cancelled';
    return true;
  });
  const cancel = (id) => setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'cancelled', can_cancel: false, can_reschedule: false } : b));

  return (
    <div className="container" style={{ padding: '32px 16px' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 700 }}>My Bookings</h1>
      <div className="muted mb-4">Manage your appointments.</div>
      <div className="stats">
        <div className="stat"><div className="lbl">Upcoming</div><div className="val">{bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length}</div></div>
        <div className="stat"><div className="lbl">Completed</div><div className="val">{bookings.filter(b => b.status === 'completed').length}</div></div>
        <div className="stat"><div className="lbl">Total spent</div><div className="val">${(bookings.filter(b => b.status === 'completed').reduce((a,b) => a+b.price, 0)/100).toFixed(0)}</div></div>
      </div>
      <div className="tabs">
        {['upcoming','past','cancelled'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.length === 0 && (
          <div className="card card-padded" style={{ textAlign:'center', padding: 48 }}>
            <div className="muted" style={{ marginBottom: 16 }}>Nothing here yet.</div>
            <Button onClick={onBook}>Browse services</Button>
          </div>
        )}
        {filtered.map(b => <BookingCard key={b.id} booking={b} onCancel={() => cancel(b.id)} onReschedule={() => {}} />)}
      </div>
    </div>
  );
};

const SignInPage = ({ onSignIn }) => {
  const [email, setEmail] = useState('demo@listeobook.com');
  const [pw, setPw] = useState('demo1234');
  return (
    <div className="auth">
      <div className="auth-left">
        <div className="dots" />
        <div className="auth-left-inner">
          <div className="auth-left-tile">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to manage your bookings, view upcoming appointments, and discover new services.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h1>Sign in</h1>
          <div className="sub">Enter your credentials to continue</div>
          <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
          <Button className="btn-block" size="lg" onClick={() => onSignIn({ fullName: 'Alex Morgan', email })}>Sign In</Button>
          <div className="auth-divider">or continue with</div>
          <Button variant="outline" className="btn-block" size="lg">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>
          <p style={{ textAlign:'center', fontSize: 14, color: 'var(--fg-muted)', marginTop: 18 }}>
            Don't have an account? <a style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

window.ServicesPage = ServicesPage;
window.ServiceDetailPage = ServiceDetailPage;
window.BookWizard = BookWizard;
window.AccountBookings = AccountBookings;
window.SignInPage = SignInPage;
