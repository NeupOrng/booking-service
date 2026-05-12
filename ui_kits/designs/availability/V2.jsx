// Variation 2 — "Time Canvas": direct-manipulation week grid (drag to paint hours)
const { useState: useStateV2 } = React;

function V2TimeCanvas({ tweaks }) {
  const [tool, setTool] = useStateV2('select');
  const [slotSize, setSlotSize] = useStateV2(60);
  const [capacity, setCapacity] = useStateV2(1);
  const accent = tweaks?.accent || '#1fa8be';

  const HOUR_START = 6, HOUR_END = 22;
  const ROW_PX = tweaks?.density === 'compact' ? 22 : tweaks?.density === 'roomy' ? 36 : 28;
  const HALF_HOURS = (HOUR_END - HOUR_START) * 2;

  // build blocks from seed rules — each rule becomes a positioned block in its day column
  const blocks = window.AV_SEED_RULES.map(r => {
    const dayIdx = window.AV_DAYS.indexOf(r.dayOfWeek);
    const startHr = window.av_tToMin(r.startTime) / 60;
    const endHr = window.av_tToMin(r.endTime) / 60;
    return {
      id: r.id,
      dayIdx,
      top: (startHr - HOUR_START) * 2 * ROW_PX,
      height: (endHr - startHr) * 2 * ROW_PX,
      startTime: r.startTime,
      endTime: r.endTime,
      slotDurationMinutes: r.slotDurationMinutes,
      capacity: r.capacity,
    };
  });
  // an override block on Wed 13:00–15:00 (lunch out)
  const overrides = [{ id:'o1', dayIdx: 2, top:(13-HOUR_START)*2*ROW_PX, height: 4*ROW_PX, startTime:'13:00', endTime:'15:00', reason:'Lunch out' }];

  // current time line (Wed ~ 11:30am)
  const todayIdx = 2;
  const nowHr = 11.5;
  const nowTop = (nowHr - HOUR_START) * 2 * ROW_PX;

  const totalHours = blocks.reduce((acc, b) => acc + b.height/(2*ROW_PX), 0);
  const totalSlots = window.AV_SEED_RULES.reduce((acc, r) => acc + (window.av_tToMin(r.endTime) - window.av_tToMin(r.startTime))/r.slotDurationMinutes, 0);
  const utilization = 68; // demo

  return (
    <div className={`v2 ${tweaks?.density === 'compact' ? 'density-compact' : tweaks?.density === 'roomy' ? 'density-roomy' : ''}`}>
      <div className="av-svc-chip">
        <window.LbIcon name="sparkles" size={12} /> Editing for <b>Deep Tissue Massage</b>
      </div>
      <div className="av-head" style={{ marginBottom: 14 }}>
        <div>
          <a className="av-back" href="#"><window.LbIcon name="chevron-left" size={12} /> Back to services</a>
          <h1 className="av-title">Time canvas</h1>
          <p className="av-sub">Draw your week. Click and drag to add open hours; resize edges to adjust; click any block to set slot size and capacity.</p>
        </div>
      </div>

      <div className="v2-toolbar">
        <button className={`v2-tool ${tool==='select'?'active':''}`} onClick={() => setTool('select')}>
          <window.LbIcon name="mouse-pointer-2" size={12} /> Select
        </button>
        <button className={`v2-tool ${tool==='paint'?'active':''}`} onClick={() => setTool('paint')}>
          <window.LbIcon name="brush" size={12} /> Paint hours
        </button>
        <button className={`v2-tool ${tool==='block'?'active':''}`} onClick={() => setTool('block')}>
          <window.LbIcon name="ban" size={12} /> Block off
        </button>
        <span className="v2-tool-sep" />
        <span style={{ font:'500 11px/1 Inter', color:'var(--fg-muted)' }}>Slot size</span>
        <select className="select" style={{ height: 28, fontSize: 11, padding: '0 24px 0 10px' }} value={slotSize} onChange={e => setSlotSize(+e.target.value)}>
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={45}>45 min</option>
          <option value={60}>60 min</option>
          <option value={90}>90 min</option>
          <option value={120}>120 min</option>
        </select>
        <span style={{ font:'500 11px/1 Inter', color:'var(--fg-muted)', marginLeft: 8 }}>Capacity</span>
        <select className="select" style={{ height: 28, fontSize: 11, padding: '0 24px 0 10px' }} value={capacity} onChange={e => setCapacity(+e.target.value)}>
          {[1,2,3,4,5,8,10].map(n => <option key={n} value={n}>×{n}</option>)}
        </select>
        <span className="v2-legend">
          <span><i style={{ background: 'rgba(31,168,190,.30)' }} /> Open</span>
          <span><i style={{ background: 'rgba(239,68,68,.40)' }} /> Blocked</span>
          <span><i style={{ background: 'var(--destructive)', borderRadius: '9999px' }} /> Now</span>
        </span>
      </div>

      <div className="v2-canvas">
        <div className="v2-cols-head">
          <div></div>
          {window.AV_DAYS.map((d, i) => (
            <div key={d} className={i === todayIdx ? 'today' : ''}>
              {d.slice(0,3)} <span style={{ marginLeft: 4, color: i === todayIdx ? '#fff' : 'var(--fg)', fontWeight: 700 }}>
                {i === todayIdx ? <b>{4 + i}</b> : (4 + i)}
              </span>
            </div>
          ))}
        </div>

        <div className="v2-grid" style={{ gridAutoRows: ROW_PX }}>
          {/* Time column */}
          <div className="v2-time-col" style={{ height: HALF_HOURS * ROW_PX }}>
            {Array.from({ length: HOUR_END - HOUR_START }).map((_, i) => {
              const h = HOUR_START + i;
              const ap = h >= 12 ? 'pm' : 'am';
              const hh = h % 12 || 12;
              return (
                <React.Fragment key={i}>
                  <div className="v2-time-cell hr" style={{ height: ROW_PX }}>{hh}{ap}</div>
                  <div className="v2-time-cell" style={{ height: ROW_PX }}></div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Day columns */}
          {window.AV_DAYS.map((d, dayIdx) => {
            const isWeekend = dayIdx >= 5;
            return (
              <div key={d} className="v2-day-col" style={{ height: HALF_HOURS * ROW_PX }}>
                {Array.from({ length: HALF_HOURS }).map((_, i) => (
                  <div key={i}
                    className={`v2-cell ${i % 2 === 1 ? 'hr' : ''} ${isWeekend ? 'weekend' : ''}`}
                    style={{ height: ROW_PX }}
                  ></div>
                ))}
                {blocks.filter(b => b.dayIdx === dayIdx).map(b => (
                  <div key={b.id} className="v2-block"
                    style={{ top: b.top, height: b.height }}>
                    <div className="resize-h top"></div>
                    <div className="v2-block-time">{window.av_fmtT(b.startTime)}–{window.av_fmtT(b.endTime)}</div>
                    <div className="v2-block-meta">{b.slotDurationMinutes}m slots</div>
                    <span className="v2-block-cap">×{b.capacity}</span>
                    <div className="resize-h bot"></div>
                  </div>
                ))}
                {overrides.filter(o => o.dayIdx === dayIdx).map(o => (
                  <div key={o.id} className="v2-block block-override"
                    style={{ top: o.top, height: o.height }}>
                    <div className="v2-block-time">{window.av_fmtT(o.startTime)}–{window.av_fmtT(o.endTime)}</div>
                    <div className="v2-block-meta">{o.reason}</div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Now indicator */}
          <div className="v2-now" style={{ top: nowTop }}>
            <span className="v2-now-label">11:30</span>
          </div>
        </div>
      </div>

      <div className="v2-stats">
        <div className="v2-stat">
          <div className="lbl">Open hours / week</div>
          <div className="val">{totalHours.toFixed(1)}<small>h</small></div>
          <div className="delta">+2.0h vs last week</div>
        </div>
        <div className="v2-stat">
          <div className="lbl">Bookable slots</div>
          <div className="val">{totalSlots}</div>
          <div className="delta">+4 with new rule</div>
        </div>
        <div className="v2-stat">
          <div className="lbl">Utilization</div>
          <div className="val">{utilization}<small>%</small></div>
          <div className="delta down">−3% vs last week</div>
        </div>
        <div className="v2-stat">
          <div className="lbl">Active overrides</div>
          <div className="val">3</div>
          <div className="delta">Next: May 11</div>
        </div>
      </div>
    </div>
  );
}

window.V2TimeCanvas = V2TimeCanvas;
