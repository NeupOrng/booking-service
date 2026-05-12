// Variation 3 — "Recipe cards": natural-language rule sentences
const { useState: useStateV3 } = React;

function dayLabel(days) {
  const all = window.AV_DAYS;
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && all.slice(0,5).every(d => days.includes(d))) return 'Weekdays';
  if (days.length === 2 && days.includes('Saturday') && days.includes('Sunday')) return 'Weekends';
  if (days.length === 1) return days[0];
  return days.map(d => d.slice(0,3)).join(', ');
}

function V3Recipes({ tweaks }) {
  const [recipes, setRecipes] = useStateV3([
    { id:'1', enabled:true, days:['Monday','Tuesday','Thursday','Friday'], start:'09:00', end:'17:00', size:60, cap:1, name:'Standard weekdays' },
    { id:'2', enabled:true, days:['Wednesday'], start:'10:00', end:'19:00', size:30, cap:1, name:'Late Wednesday' },
    { id:'3', enabled:true, days:['Saturday'], start:'10:00', end:'16:00', size:60, cap:2, name:'Weekend' },
    { id:'4', enabled:false, days:['Friday'], start:'18:00', end:'21:00', size:60, cap:1, name:'Friday evening (paused)' },
  ]);
  const [overrides] = useStateV3([
    { id:'o1', date:'May 11', reason:'Personal day', whole: true },
    { id:'o2', date:'May 18', start:'13:00', end:'17:00', reason:'Conference' },
  ]);

  const totalHours = (r) => (window.av_tToMin(r.end) - window.av_tToMin(r.start)) / 60 * r.days.length;
  const totalSlots = (r) => Math.floor((window.av_tToMin(r.end) - window.av_tToMin(r.start)) / r.size) * r.days.length;

  const toggle = (id) => setRecipes(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <div className="v3">
      <div className="av-svc-chip">
        <window.LbIcon name="sparkles" size={12} /> Editing for <b>Deep Tissue Massage</b>
      </div>
      <div className="av-head" style={{ marginBottom: 16 }}>
        <div>
          <a className="av-back" href="#"><window.LbIcon name="chevron-left" size={12} /> Back to services</a>
          <h1 className="av-title">Schedule rules</h1>
          <p className="av-sub">Describe your hours in plain English. Click any colored word to change it. Rules combine to create your bookable slots.</p>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button className="av-pill-btn"><window.LbIcon name="eye" size={12} /> Preview week</button>
          <window.Button variant="default" size="sm"><window.LbIcon name="plus" size={12} /> New rule</window.Button>
        </div>
      </div>

      <div className="v3-stack">
        {recipes.map(r => (
          <div key={r.id} className={`v3-card ${!r.enabled ? 'muted' : ''}`}>
            <div className="v3-card-head">
              <div className="v3-icon-tile"><window.LbIcon name="repeat" size={16} /></div>
              <div>
                <div className="v3-card-title">{r.name}</div>
                <div className="v3-card-sub">Recurring weekly · created May 1</div>
              </div>
              <button className={`v3-toggle v3-switch ${r.enabled ? 'on' : ''}`} onClick={() => toggle(r.id)} />
            </div>

            <p className="v3-sentence">
              On <span className="v3-tok days">{dayLabel(r.days)} <window.LbIcon name="chevron-down" size={10} /></span>,
              accept bookings from <span className="v3-tok">{window.av_fmtT(r.start)} <window.LbIcon name="chevron-down" size={10} /></span> to <span className="v3-tok">{window.av_fmtT(r.end)} <window.LbIcon name="chevron-down" size={10} /></span>,
              in <span className="v3-tok size">{r.size}-minute <window.LbIcon name="chevron-down" size={10} /></span> slots,
              with up to <span className="v3-tok cap">{r.cap} {r.cap > 1 ? 'people' : 'person'} <window.LbIcon name="chevron-down" size={10} /></span> at a time.
            </p>

            <div className="v3-foot">
              <div className="v3-stats-row">
                <span><b>{totalHours(r).toFixed(1)}h</b> per week</span>
                <span><b>{totalSlots(r)}</b> slots</span>
                <span><b>{r.cap * totalSlots(r)}</b> max bookings</span>
              </div>
              <div className="v3-actions">
                <button title="Duplicate"><window.LbIcon name="copy" size={14} /></button>
                <button title="Edit"><window.LbIcon name="pencil" size={14} /></button>
                <button className="danger" title="Delete"><window.LbIcon name="trash-2" size={14} /></button>
              </div>
            </div>
          </div>
        ))}

        <button className="v3-add">
          <window.LbIcon name="plus" size={14} /> Add a rule
        </button>
      </div>

      <div className="v3-templates">
        <span style={{ font: '500 11px/1 Inter', color: 'var(--fg-muted)', alignSelf: 'center', marginRight: 4 }}>Quick start:</span>
        <button className="v3-tmpl"><window.LbIcon name="sun" size={12} /> Standard 9–5</button>
        <button className="v3-tmpl"><window.LbIcon name="moon" size={12} /> Evenings only</button>
        <button className="v3-tmpl"><window.LbIcon name="coffee" size={12} /> Split shift</button>
        <button className="v3-tmpl"><window.LbIcon name="sparkles" size={12} /> Weekend warrior</button>
      </div>

      <div className="av-divider-h">Date overrides ({overrides.length})</div>
      <div className="v3-stack">
        {overrides.map(o => (
          <div key={o.id} className="v3-card" style={{ borderColor: 'rgba(239,68,68,.25)', background: 'rgba(239,68,68,.03)' }}>
            <div className="v3-card-head">
              <div className="v3-icon-tile" style={{ background: 'rgba(239,68,68,.10)', color: 'var(--destructive)' }}>
                <window.LbIcon name="calendar-x" size={16} />
              </div>
              <div>
                <div className="v3-card-title">{o.reason}</div>
                <div className="v3-card-sub">One-time override</div>
              </div>
              <button className="v3-toggle v3-switch on" style={{ background: 'var(--destructive)' }} />
            </div>
            <p className="v3-sentence">
              On <span className="v3-tok">{o.date} <window.LbIcon name="chevron-down" size={10} /></span>,
              {o.whole
                ? <> close all bookings <span className="v3-tok" style={{ background: 'rgba(239,68,68,.08)', borderColor: 'rgba(239,68,68,.30)', color: 'var(--destructive)' }}>all day</span>.</>
                : <> block bookings between <span className="v3-tok">{window.av_fmtT(o.start)}</span> and <span className="v3-tok">{window.av_fmtT(o.end)}</span>.</>
              }
            </p>
          </div>
        ))}
        <button className="v3-add">
          <window.LbIcon name="plus" size={14} /> Block a specific date
        </button>
      </div>
    </div>
  );
}

window.V3Recipes = V3Recipes;
