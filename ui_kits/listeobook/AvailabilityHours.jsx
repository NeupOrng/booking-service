// AvailabilityHours — merchant-facing weekly schedule editor.
//
// Generalized from "Shop hours" V1 design exploration. This is a self-contained
// component module: time helpers + small subcomponents + the public component.
// Drop-in usage:
//   <AvailabilityHours service={...} rules={...} initialDay="Wednesday" weekStart={...} />
//
// Props (all optional except service):
//   service        : { name }                     — the service being edited
//   rules          : Array<AvailabilityRule>      — recurring weekly rules
//   blocks         : Array<DateBlock>             — date-specific overrides (preview-only)
//   weekStart      : Date                         — the Monday whose week to show; defaults to current week
//   initialDay     : day name                     — selected day on first render
//   takenSlotTimes : Array<"HH:MM">               — slots to mark "taken" in the preview
//   onAddRule, onEditRule, onCopyDay, onCopyWeek, onAddOverride, onApplyTemplate
//   onChangeSelectedDay
//
// Shapes:
//   AvailabilityRule = {
//     id, dayOfWeek: 'Monday'|...|'Sunday',
//     startTime: 'HH:MM', endTime: 'HH:MM',
//     slotDurationMinutes: number, capacity: number
//   }
// =====================================================================

const { useState: useStateAH, useMemo: useMemoAH } = React;

// ---------- time helpers ----------
const AH_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const AH_DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function ahTToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function ahMinToT(m) {
  const h = Math.floor(m / 60), mm = m % 60;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function ahFmtT(t) {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  const hh = h % 12 || 12;
  return m === 0 ? `${hh}${ap}` : `${hh}:${String(m).padStart(2,'0')}${ap}`;
}
function ahGenSlots(rule, takenSet) {
  const out = [];
  for (let m = ahTToMin(rule.startTime); m + rule.slotDurationMinutes <= ahTToMin(rule.endTime); m += rule.slotDurationMinutes) {
    const t = ahMinToT(m);
    out.push({ time: t, label: ahFmtT(t), taken: takenSet.has(t) });
  }
  return out;
}
function ahMondayOf(date) {
  const d = new Date(date); const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff); d.setHours(0,0,0,0);
  return d;
}
function ahSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ---------- subcomponents ----------
function AhDayColumn({
  day, dateNum, isToday, isWeekend, isSelected, rules, ribbon,
  onSelect, onAddRule, onEditRule, onCopyDay,
}) {
  const cls = [
    'ah-day',
    isToday && 'is-today',
    isWeekend && 'is-weekend',
    isSelected && 'is-selected',
    !rules.length && 'is-empty',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} onClick={() => onSelect(day)} style={{ cursor: 'pointer' }}>
      <button
        className="ah-copybtn"
        title="Copy day"
        onClick={(e) => { e.stopPropagation(); onCopyDay(day); }}
      >
        <window.LbIcon name="copy" size={12} />
      </button>
      <div className="ah-day-head">
        <div>
          <div className="ah-day-name">{day.slice(0,3)}</div>
          <div className="ah-day-date">{dateNum}</div>
        </div>
        {isToday && <span className="ah-today-pill">Today</span>}
      </div>
      {ribbon && (
        <div className="ah-ribbon"><div className="ah-ribbon-fill" style={ribbon} /></div>
      )}
      <div className="ah-day-body">
        {rules.length === 0
          ? <div className="ah-empty-msg">Closed</div>
          : rules.map(r => (
              <div
                className="ah-rule"
                key={r.id}
                onClick={(e) => { e.stopPropagation(); onEditRule(r); }}
              >
                <div className="ah-rule-time">{ahFmtT(r.startTime)} – {ahFmtT(r.endTime)}</div>
                <div className="ah-rule-meta">{r.slotDurationMinutes}m · ×{r.capacity} cap</div>
              </div>
            ))}
        <button className="ah-add" onClick={(e) => { e.stopPropagation(); onAddRule(day); }}>
          <window.LbIcon name="plus" size={11} /> Add hours
        </button>
      </div>
    </div>
  );
}

function AhPreviewRail({
  selectedDay, weekDates, totalHours, totalSlots, slots, nextAvailable, onChangeDay,
}) {
  return (
    <aside className="ah-side">
      <h3>Preview</h3>
      <p className="ah-side-sub">Live slots a customer would see for the selected day.</p>
      <div className="ah-mini-cal">
        {AH_DAYS.map(d => (
          <button
            key={d}
            className={`ah-mini-day ${d === selectedDay ? 'is-on' : ''}`}
            onClick={() => onChangeDay(d)}
          >
            <span className="d">{d.slice(0,2)}</span>
            <b className="n">{weekDates[d]}</b>
          </button>
        ))}
      </div>
      <div className="ah-side-meta">
        <span>Total hours <b>{totalHours.toFixed(1)}h</b></span>
        <span>Slots <b>{totalSlots}</b></span>
      </div>
      {slots.length === 0
        ? <p style={{ font: '400 12px/1.4 var(--font-sans)', color: 'var(--fg-muted)' }}>No availability on this day.</p>
        : (
          <div className="ah-slots-list">
            {slots.map((s, i) => {
              const isNext = nextAvailable && s.time === nextAvailable.time;
              return (
                <div
                  key={i}
                  className={`ah-slot ${s.taken ? 'is-taken' : ''} ${isNext ? 'is-next' : ''}`}
                >
                  {s.label}
                </div>
              );
            })}
          </div>
        )
      }
      <div className="ah-side-foot">
        <window.LbIcon name="info" size={12} />
        <span>Next bookable: <b>{nextAvailable?.label || '—'}</b></span>
      </div>
    </aside>
  );
}

const AH_DEFAULT_TEMPLATES = [
  { id: 'standard', icon: 'sun',       label: 'Standard 9–5' },
  { id: 'evenings', icon: 'moon',      label: 'Evenings only' },
  { id: 'weekdays', icon: 'calendar',  label: 'Weekdays only' },
  { id: 'split',    icon: 'briefcase', label: 'Split shift' },
];

// ---------- public component ----------
function AvailabilityHours({
  service = { name: 'Service' },
  rules = [],
  blocks = [],
  weekStart,
  initialDay,
  takenSlotTimes = ['10:00', '15:00'],
  templates = AH_DEFAULT_TEMPLATES,
  onAddRule = () => {},
  onEditRule = () => {},
  onCopyDay = () => {},
  onCopyWeek = () => {},
  onAddOverride = () => {},
  onApplyTemplate = () => {},
  onChangeSelectedDay,
  onBack,
}) {
  // resolve the week — Monday-first, 7 days
  const monday = useMemoAH(() => ahMondayOf(weekStart || new Date()), [weekStart]);
  const today = new Date(); today.setHours(0,0,0,0);
  const weekDates = useMemoAH(() => {
    const out = {};
    AH_DAYS.forEach((day, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      out[day] = d.getDate();
    });
    return out;
  }, [monday]);
  const todayName = useMemoAH(() => {
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      if (ahSameDay(d, today)) return AH_DAYS[i];
    }
    return null;
  }, [monday]);

  const [selectedDay, setSelectedDayInner] = useStateAH(initialDay || todayName || 'Monday');
  const setSelectedDay = (d) => {
    setSelectedDayInner(d);
    onChangeSelectedDay && onChangeSelectedDay(d);
  };

  const rulesByDay = useMemoAH(() => {
    const m = {}; AH_DAYS.forEach(d => { m[d] = []; });
    rules.forEach(r => { (m[r.dayOfWeek] = m[r.dayOfWeek] || []).push(r); });
    return m;
  }, [rules]);

  const ribbonFor = (day) => {
    const rs = rulesByDay[day] || [];
    if (!rs.length) return null;
    const start = Math.min(...rs.map(r => ahTToMin(r.startTime)));
    const end = Math.max(...rs.map(r => ahTToMin(r.endTime)));
    return { left: `${(start / (24*60)) * 100}%`, width: `${((end - start) / (24*60)) * 100}%` };
  };

  // preview math
  const takenSet = useMemoAH(() => new Set(takenSlotTimes), [takenSlotTimes]);
  const selectedRules = rulesByDay[selectedDay] || [];
  const totalHours = selectedRules.reduce((acc, r) => acc + (ahTToMin(r.endTime) - ahTToMin(r.startTime)) / 60, 0);
  const totalSlots = selectedRules.reduce((acc, r) => acc + Math.floor((ahTToMin(r.endTime) - ahTToMin(r.startTime)) / r.slotDurationMinutes), 0);
  const previewSlots = selectedRules.flatMap(r => ahGenSlots(r, takenSet));
  const nextAvailable = previewSlots.find(s => !s.taken);

  return (
    <div className="ah-page">
      <div className="ah-svc-chip">
        <window.LbIcon name="sparkles" size={12} /> Editing for <b>{service.name}</b>
      </div>
      <div className="ah-head">
        <div>
          {onBack && (
            <a className="ah-back" href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>
              <window.LbIcon name="chevron-left" size={12} /> Back to services
            </a>
          )}
          <h1 className="ah-title">Shop hours</h1>
          <p className="ah-sub">When customers can book this service. Set recurring weekly hours; one-off changes happen on individual days.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ah-pill-btn" onClick={onCopyWeek}>
            <window.LbIcon name="copy" size={12} /> Copy week
          </button>
          <button className="ah-pill-btn" onClick={onAddOverride}>
            <window.LbIcon name="calendar-x" size={12} /> Date overrides
          </button>
          <window.Button variant="default" size="sm" onClick={() => onAddRule(selectedDay)}>
            <window.LbIcon name="plus" size={12} /> Add hours
          </window.Button>
        </div>
      </div>

      <div className="ah-grid">
        <div>
          <div className="ah-week">
            {AH_DAYS.map(day => (
              <AhDayColumn
                key={day}
                day={day}
                dateNum={weekDates[day]}
                isToday={day === todayName}
                isWeekend={day === 'Saturday' || day === 'Sunday'}
                isSelected={day === selectedDay}
                rules={rulesByDay[day] || []}
                ribbon={ribbonFor(day)}
                onSelect={setSelectedDay}
                onAddRule={onAddRule}
                onEditRule={onEditRule}
                onCopyDay={onCopyDay}
              />
            ))}
          </div>

          {templates && templates.length > 0 && (
            <>
              <div className="ah-divider">Templates</div>
              <div className="ah-templates">
                {templates.map(t => (
                  <button key={t.id} className="ah-template" onClick={() => onApplyTemplate(t)}>
                    {t.icon && <window.LbIcon name={t.icon} size={12} />} {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <AhPreviewRail
          selectedDay={selectedDay}
          weekDates={weekDates}
          totalHours={totalHours}
          totalSlots={totalSlots}
          slots={previewSlots}
          nextAvailable={nextAvailable}
          onChangeDay={setSelectedDay}
        />
      </div>
    </div>
  );
}

// expose
window.AvailabilityHours = AvailabilityHours;
window.AH_DAYS = AH_DAYS;
window.AH_DAYS_SHORT = AH_DAYS_SHORT;
window.ahFmtT = ahFmtT;
window.ahGenSlots = ahGenSlots;
