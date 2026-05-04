// ServiceCard, BookingPanel, BookingCard
const SAMPLE_IMG_GRADIENTS = {
  wellness: 'linear-gradient(135deg,#5dc6d3,#1fa8be)',
  beauty:   'linear-gradient(135deg,#fda4af,#be123c)',
  fitness:  'linear-gradient(135deg,#fcd34d,#b45309)',
};

const ServiceCard = ({ service, onClick }) => {
  const grad = SAMPLE_IMG_GRADIENTS[service.category.slug] || SAMPLE_IMG_GRADIENTS.wellness;
  return (
    <div className="svc-card" onClick={onClick}>
      <div className="svc-img" style={{ background: grad }}>
        <div className="ph">{service.category.name.charAt(0)}</div>
        <CategoryPill slug={service.category.slug}>{service.category.name}</CategoryPill>
      </div>
      <div className="svc-body">
        <div className="svc-title">{service.name}</div>
        <div className="svc-biz">{service.business.name}</div>
        <div className="svc-rating">
          <span className="star">★</span>
          <span style={{ fontWeight: 600 }}>{service.avg_rating?.toFixed(1) ?? '5.0'}</span>
          <span className="muted">({service.review_count ?? 0})</span>
        </div>
        <div className="svc-foot">
          <span className="duration"><LbIcon name="clock" size={14} /> {service.duration_minutes} min</span>
          <span className="meta">
            <span className={`svc-slot ${service.urgent ? 'urgent' : ''}`}>{service.next_slot_label}</span>
            <span className="svc-price">${(service.price/100).toFixed(0)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const BookingPanel = ({ slots, selectedDate, selectedTime, onPickDate, onPickTime, onContinue }) => {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    return { iso: d.toISOString().slice(0,10), day: dayLabels[d.getDay()], date: d.getDate() };
  });
  return (
    <div className="card bp listeo-shadow">
      <div>
        <h3>Select Date &amp; Time</h3>
        <div className="sub">Choose an available slot for your appointment.</div>
      </div>
      <div className="bp-days">
        {days.map(d => (
          <button key={d.iso} className={`bp-day ${selectedDate === d.iso ? 'on' : ''}`} onClick={() => onPickDate(d.iso)}>
            <div className="d">{d.day}</div>
            <span className="n">{d.date}</span>
          </button>
        ))}
      </div>
      <div className="bp-slots">
        {slots.map(s => (
          <button
            key={s.time}
            className={`bp-slot ${selectedTime === s.time ? 'on' : ''}`}
            disabled={!s.available}
            onClick={() => onPickTime(s.time)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <Button variant="default" size="lg" disabled={!selectedDate || !selectedTime} onClick={onContinue} className="btn-block">
        Continue to booking
      </Button>
    </div>
  );
};

const BookingCard = ({ booking, onCancel, onReschedule }) => {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const grad = SAMPLE_IMG_GRADIENTS[booking.service.category.slug] || SAMPLE_IMG_GRADIENTS.wellness;
  return (
    <div className="card">
      <div style={{ padding: '24px 24px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 16 }}>
          <div className="row">
            <div style={{ width: 56, height: 56, borderRadius: 10, background: grad, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{booking.service.name}</div>
              <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>{booking.business.name}</div>
            </div>
          </div>
          <Badge status={booking.status} />
        </div>
        <div className="summary-grid">
          <div className="field"><span>Date</span><b>{booking.date_label}</b></div>
          <div className="field"><span>Time</span><b>{booking.time_label}</b></div>
          <div className="field"><span>Duration</span><b>{booking.service.duration_minutes} min</b></div>
          <div className="field"><span>Amount</span><b>${(booking.price/100).toFixed(2)}</b></div>
        </div>
        <div className="ref-line">Ref: {booking.reference}</div>
      </div>
      {(booking.status === 'confirmed' || booking.status === 'pending') && !confirmCancel && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 16, display:'flex', gap: 12, alignItems:'center', background: 'rgba(238,241,245,.4)' }}>
          {booking.can_reschedule && <Button variant="outline" size="sm" onClick={onReschedule}>Reschedule</Button>}
          {booking.can_cancel && <Button variant="danger-outline" size="sm" onClick={() => setConfirmCancel(true)}>Cancel Booking</Button>}
          <Button variant="ghost" size="sm" className="right">View service</Button>
        </div>
      )}
      {confirmCancel && (
        <div style={{ borderTop: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.05)', padding: 16, display:'flex', justifyContent:'space-between', alignItems:'center', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--destructive)', marginBottom: 2 }}>Are you sure you want to cancel?</div>
            <div className="muted" style={{ fontSize: 13 }}>You will receive a full refund of ${(booking.price/100).toFixed(2)}.</div>
          </div>
          <div className="row">
            <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>Keep booking</Button>
            <Button variant="destructive" size="sm" onClick={() => { onCancel(); setConfirmCancel(false); }}>Yes, cancel booking</Button>
          </div>
        </div>
      )}
      {booking.status === 'completed' && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 16, display:'flex', gap: 12, alignItems:'center', background: 'rgba(238,241,245,.4)' }}>
          <Button variant="outline" size="sm">Leave a review</Button>
          <Button variant="ghost" size="sm" className="right">Book again</Button>
        </div>
      )}
    </div>
  );
};

window.ServiceCard = ServiceCard;
window.BookingPanel = BookingPanel;
window.BookingCard = BookingCard;
