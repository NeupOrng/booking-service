// Variation 4 — "Calendar of truth": unified monthly calendar with layered side panel
const { useState: useStateV4 } = React;

function V4Calendar({ tweaks }) {
  const [mode, setMode] = useStateV4('sparkline'); // sparkline | heat | dots
  const [selected, setSelected] = useStateV4('2026-05-13');

  // Calendar grid for May 2026 — May 1 is Friday (idx 4 with Mon=0)
  const startOffset = 4;
  const daysInMonth = 31;
  const todayDate = '2026-05-06';
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push({ dim: true, num: 30 - (startOffset - 1 - i), date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `2026-05-${String(d).padStart(2,'0')}`;
    const dow = new Date(2026, 4, d).getDay(); // Sunday=0
    const dayName = window.AV_DAYS[(dow + 6) % 7];
    const rules = window.AV_SEED_RULES.filter(r => r.dayOfWeek === dayName);
    const block = window.AV_SEED_BLOCKS.find(b => b.blockDate === dateStr);
    const totalSlots = rules.reduce((acc,r) => acc + (window.av_tToMin(r.endTime) - window.av_tToMin(r.startTime))/r.slotDurationMinutes, 0);
    // demo bookings: about 60% taken on most days
    const taken = Math.round(totalSlots * (0.4 + (d % 5) * 0.1));
    cells.push({ num: d, date: dateStr, dayName, rules, block, totalSlots, taken });
  }
  while (cells.length < 42) cells.push({ dim: true, num: cells.length - daysInMonth - startOffset + 1 + 1, date: null });

  const sel = cells.find(c => c.date === selected) || cells.find(c => c.date);

  const heatColor = (frac) => {
    // 0 = light, 1 = strong primary
    const a = Math.min(1, Math.max(0, frac));
    return `rgba(31, 168, 190, ${0.08 + a * 0.62})`;
  };

  // monthly summary
  const totalOpen = cells.filter(c => c.totalSlots).reduce((acc, c) => acc + c.totalSlots, 0);
  const totalBooked = cells.filter(c => c.totalSlots).reduce((acc, c) => acc + c.taken, 0);
  const blocksCount = cells.filter(c => c.block).length;

  const selectedRules = sel?.rules || [];
  const selectedSlots = selectedRules.flatMap(r => window.av_genSlots(r, ['10:00','15:00','11:00']));

  return (
    <div className="v4">
      <div className="av-svc-chip">
        <window.LbIcon name="sparkles" size={12} /> Editing for <b>Deep Tissue Massage</b>
      </div>
      <div className="av-head" style={{ marginBottom: 12 }}>
        <div>
          <a className="av-back" href="#"><window.LbIcon name="chevron-left" size={12} /> Back to services</a>
          <h1 className="av-title">Availability calendar</h1>
          <p className="av-sub">One unified view. Recurring schedule and one-off blocks layered together. Click any day to see and edit what applies.</p>
        </div>
      </div>

      <div className="v4-summary">
        <div className="v4-tile"><div className="lbl">May open hours</div><div className="val">142<small style={{ font: '500 12px/1 Inter', color: 'var(--fg-muted)', marginLeft: 2 }}>h</small></div></div>
        <div className="v4-tile"><div className="lbl">Booked</div><div className="val ok">{totalBooked}/{totalOpen}</div></div>
        <div className="v4-tile"><div className="lbl">Date overrides</div><div className="val alert">{blocksCount}</div></div>
        <div className="v4-tile"><div className="lbl">Next blocked</div><div className="val">May 11</div></div>
      </div>

      <div className="v4-toolbar">
        <div className="v4-monthnav">
          <button><window.LbIcon name="chevron-left" size={14} /></button>
          <span className="lbl">May 2026</span>
          <button><window.LbIcon name="chevron-right" size={14} /></button>
          <button style={{ marginLeft: 6 }} title="Today"><window.LbIcon name="dot" size={14} /></button>
        </div>
        <div className="v4-mode">
          <button className={mode === 'sparkline' ? 'on' : ''} onClick={() => setMode('sparkline')}>Slots</button>
          <button className={mode === 'heat' ? 'on' : ''} onClick={() => setMode('heat')}>Heatmap</button>
          <button className={mode === 'dots' ? 'on' : ''} onClick={() => setMode('dots')}>Bookings</button>
        </div>
        <div style={{ marginLeft: 'auto', display:'flex', gap: 8 }}>
          <button className="av-pill-btn"><window.LbIcon name="calendar-x" size={12} /> Add date override</button>
          <button className="av-pill-btn"><window.LbIcon name="settings-2" size={12} /> Edit recurring</button>
        </div>
      </div>

      <div className="v4-layout">
        <div className="v4-cal">
          <div className="v4-dow">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="v4-grid">
            {cells.map((c, i) => {
              if (c.dim) return <div key={i} className="v4-cell dim"><span className="v4-num">{c.num}</span></div>;
              const isToday = c.date === todayDate;
              const isSel = c.date === selected;
              const blocked = !!c.block;
              const frac = c.totalSlots ? c.taken / c.totalSlots : 0;
              if (mode === 'heat') {
                return (
                  <div key={i}
                    className={`v4-cell heat ${isToday ? 'today' : ''} ${blocked ? 'blocked' : ''}`}
                    style={{ background: blocked ? undefined : c.totalSlots ? heatColor(frac) : '#fafbfc',
                             outline: isSel ? `2px solid var(--primary)` : 'none', outlineOffset: '-2px' }}
                    onClick={() => setSelected(c.date)}>
                    <div className="v4-heat"><span className="v4-num" style={{ color: c.totalSlots && !blocked && frac > 0.4 ? '#fff' : 'var(--fg)' }}>{c.num}</span></div>
                  </div>
                );
              }
              return (
                <div key={i}
                  className={`v4-cell ${isToday ? 'today' : ''} ${blocked ? 'blocked' : ''} ${c.totalSlots ? 'has-rule' : ''}`}
                  style={{ outline: isSel ? `2px solid var(--primary)` : 'none', outlineOffset: '-2px' }}
                  onClick={() => setSelected(c.date)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span className="v4-num">{c.num}</span>
                    <div className="v4-cell-tags">
                      {blocked && <span className="v4-tag block">{c.block.startTime ? 'Partial' : 'Closed'}</span>}
                    </div>
                  </div>
                  {mode === 'sparkline' && c.totalSlots > 0 && !blocked && (
                    <div className="v4-spark">
                      {Array.from({ length: c.totalSlots }).map((_, j) => (
                        <div key={j} className={`v4-spark-bar ${j < c.taken ? 'taken' : 'full'}`} style={{ height: `${20 + (j*7) % 14}px` }} />
                      ))}
                    </div>
                  )}
                  {mode === 'sparkline' && blocked && c.block.startTime && (
                    <div className="v4-spark">
                      <div className="v4-spark-bar blocked" style={{ height: '14px', flex: 2 }} />
                      <div className="v4-spark-bar" style={{ height: '20px' }} />
                    </div>
                  )}
                  {mode === 'dots' && c.totalSlots > 0 && !blocked && (
                    <div className="v4-bookings" style={{ marginTop: 'auto' }}>
                      {Array.from({ length: c.taken }).map((_, j) => <div key={j} className="v4-dot" />)}
                    </div>
                  )}
                  {!c.totalSlots && !blocked && <div style={{ font: '500 10px/1 Inter', color: 'var(--fg-muted)', marginTop: 'auto', fontStyle: 'italic' }}>Closed</div>}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="v4-side">
          <div className="v4-side-head">
            <div className="day">{sel ? new Date(sel.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}</div>
            <div className="meta">{sel?.totalSlots || 0} slots · {sel?.taken || 0} booked</div>
          </div>
          <div className="v4-side-body">
            {selectedRules.length > 0 && (
              <div className="v4-layer recurring">
                <div className="v4-layer-label"><window.LbIcon name="repeat" size={11} /> Recurring rule</div>
                {selectedRules.map(r => (
                  <div key={r.id} className="v4-layer-body" style={{ marginBottom: 4 }}>
                    {window.av_fmtT(r.startTime)} – {window.av_fmtT(r.endTime)} <small>· {r.slotDurationMinutes}m × {r.capacity} cap</small>
                  </div>
                ))}
              </div>
            )}
            {sel?.block && (
              <div className="v4-layer override">
                <div className="v4-layer-label"><window.LbIcon name="calendar-x" size={11} /> One-off override</div>
                <div className="v4-layer-body">
                  {sel.block.startTime ? `${window.av_fmtT(sel.block.startTime)} – ${window.av_fmtT(sel.block.endTime)} blocked` : 'Whole day blocked'}
                  {sel.block.reason && <small style={{ display:'block', marginTop: 4 }}>"{sel.block.reason}"</small>}
                </div>
              </div>
            )}
            {!selectedRules.length && !sel?.block && (
              <div style={{ font: '400 13px/1.5 Inter', color: 'var(--fg-muted)', textAlign: 'center', padding: '20px 0' }}>
                <window.LbIcon name="moon" size={20} style={{ display:'block', margin:'0 auto 8px', color: '#c5cdd6' }} />
                No availability on this day.
              </div>
            )}

            {selectedSlots.length > 0 && !sel?.block && (
              <>
                <div style={{ font: '600 10px/1 Inter', color: 'var(--fg-muted)', textTransform:'uppercase', letterSpacing: '.06em', marginTop: 14, marginBottom: 6 }}>Slots</div>
                <div className="v4-side-slots">
                  {selectedSlots.map((s, i) => <div key={i} className={`slot ${s.taken ? 'taken' : ''}`}>{s.label}</div>)}
                </div>
              </>
            )}

            <div className="v4-quick-actions">
              <button><window.LbIcon name="plus" size={11} /> Add hours</button>
              <button className="danger"><window.LbIcon name="ban" size={11} /> Block day</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.V4Calendar = V4Calendar;
