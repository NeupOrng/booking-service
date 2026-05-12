// Variation 1 — "Shop hours": refined day columns + sticky preview rail
const { useState: useStateV1 } = React;

function V1ShopHours({ tweaks }) {
  const [rules, setRules] = useStateV1(window.AV_SEED_RULES);
  const [selectedDay, setSelectedDay] = useStateV1('Wednesday');
  const todayName = 'Wednesday';
  const todayDates = { Monday: 4, Tuesday: 5, Wednesday: 6, Thursday: 7, Friday: 8, Saturday: 9, Sunday: 10 };
  const accent = tweaks?.accent || '#1fa8be';

  const rulesForDay = (d) => rules.filter(r => r.dayOfWeek === d);
  const totalHoursForDay = (d) => {
    const rs = rulesForDay(d);
    return rs.reduce((acc, r) => acc + (window.av_tToMin(r.endTime) - window.av_tToMin(r.startTime))/60, 0);
  };
  const totalSlotsForDay = (d) => {
    const rs = rulesForDay(d);
    return rs.reduce((acc, r) => acc + (window.av_tToMin(r.endTime) - window.av_tToMin(r.startTime))/r.slotDurationMinutes, 0);
  };

  const ribbonFor = (d) => {
    const rs = rulesForDay(d);
    if (!rs.length) return null;
    const start = Math.min(...rs.map(r => window.av_tToMin(r.startTime)));
    const end = Math.max(...rs.map(r => window.av_tToMin(r.endTime)));
    const left = (start / (24*60)) * 100;
    const width = ((end - start) / (24*60)) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  // selected day preview slots (with some taken)
  const selectedRules = rulesForDay(selectedDay);
  const selectedSlots = selectedRules.flatMap((r, i) => window.av_genSlots(r, ['10:00','15:00']));
  const nextAvailable = selectedSlots.find(s => !s.taken);

  return (
    <div className={`v1 ${tweaks?.density === 'compact' ? 'density-compact' : tweaks?.density === 'roomy' ? 'density-roomy' : ''}`}>
      <div className="av-svc-chip">
        <window.LbIcon name="sparkles" size={12} /> Editing for <b>Deep Tissue Massage</b>
      </div>
      <div className="av-head" style={{ marginBottom: 16 }}>
        <div>
          <a className="av-back" href="#"><window.LbIcon name="chevron-left" size={12} /> Back to services</a>
          <h1 className="av-title">Shop hours</h1>
          <p className="av-sub">When customers can book this service. Set recurring weekly hours; one-off changes happen on individual days.</p>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button className="av-pill-btn"><window.LbIcon name="copy" size={12} /> Copy week</button>
          <button className="av-pill-btn"><window.LbIcon name="calendar-x" size={12} /> Date overrides</button>
          <window.Button variant="default" size="sm"><window.LbIcon name="plus" size={12} /> Add hours</window.Button>
        </div>
      </div>

      <div className="v1-grid">
        <div>
          <div className="v1-week">
            {window.AV_DAYS.map(day => {
              const rs = rulesForDay(day);
              const ribbon = ribbonFor(day);
              const isToday = day === todayName;
              const isWeekend = day === 'Saturday' || day === 'Sunday';
              return (
                <div
                  key={day}
                  className={[
                    'v1-day',
                    isToday && 'today',
                    isWeekend && 'weekend',
                    !rs.length && 'empty',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedDay(day)}
                  style={{ cursor: 'pointer', outline: selectedDay === day && !isToday ? `2px solid ${accent}55` : 'none', outlineOffset: '-2px' }}
                >
                  <button className="v1-copybtn" title="Copy day"><window.LbIcon name="copy" size={12} /></button>
                  <div className="v1-day-head">
                    <div>
                      <div className="v1-day-name">{day.slice(0,3)}</div>
                      <div className="v1-day-date">{todayDates[day]}</div>
                    </div>
                    {isToday && <span className="v1-today-pill">Today</span>}
                  </div>
                  {ribbon && (
                    <div className="v1-ribbon"><div className="v1-ribbon-fill" style={ribbon} /></div>
                  )}
                  <div className="v1-day-body">
                    {rs.length === 0 ? (
                      <div className="v1-empty-msg">Closed</div>
                    ) : rs.map(r => (
                      <div className="v1-rule" key={r.id}>
                        <div className="v1-rule-time">{window.av_fmtT(r.startTime)} – {window.av_fmtT(r.endTime)}</div>
                        <div className="v1-rule-meta">{r.slotDurationMinutes}m · ×{r.capacity} cap</div>
                      </div>
                    ))}
                    <button className="v1-add"><window.LbIcon name="plus" size={11} /> Add hours</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="av-divider-h">Templates</div>
          <div className="v3-templates">
            <button className="v3-tmpl"><window.LbIcon name="sun" size={12} /> Standard 9–5</button>
            <button className="v3-tmpl"><window.LbIcon name="moon" size={12} /> Evenings only</button>
            <button className="v3-tmpl"><window.LbIcon name="calendar" size={12} /> Weekdays only</button>
            <button className="v3-tmpl"><window.LbIcon name="briefcase" size={12} /> Split shift</button>
            <button className="v3-tmpl"><window.LbIcon name="copy" size={12} /> Copy from "Yoga"</button>
          </div>
        </div>

        <aside className="v1-side">
          <h3>Preview</h3>
          <p className="sub">Live slots a customer would see for the selected day.</p>
          <div className="v1-mini-cal">
            {window.AV_DAYS.slice(0,7).map(d => (
              <button key={d} className={`v1-mini-day ${d === selectedDay ? 'on' : ''}`} onClick={() => setSelectedDay(d)}>
                <span className="d">{d.slice(0,2)}</span>
                <b className="n">{todayDates[d]}</b>
              </button>
            ))}
          </div>
          <div className="v1-side-meta">
            <span>Total hours <b>{totalHoursForDay(selectedDay).toFixed(1)}h</b></span>
            <span>Slots <b>{totalSlotsForDay(selectedDay)}</b></span>
          </div>
          {selectedSlots.length === 0 ? (
            <p style={{ font: '400 12px/1.4 Inter', color: 'var(--fg-muted)' }}>No availability on this day.</p>
          ) : (
            <div className="v1-slots-list">
              {selectedSlots.map((s, i) => {
                const isNext = nextAvailable && s.time === nextAvailable.time;
                return <div key={i} className={`v1-slot ${s.taken ? 'taken' : ''} ${isNext ? 'next' : ''}`}>{s.label}</div>;
              })}
            </div>
          )}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display:'flex', gap: 6, alignItems:'center', fontSize: 11, color:'var(--fg-muted)' }}>
            <window.LbIcon name="info" size={12} /> Next bookable: <b style={{ color:'var(--fg)' }}>{nextAvailable?.label || '—'}</b>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.V1ShopHours = V1ShopHours;
