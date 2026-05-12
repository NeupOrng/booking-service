// Shared data + helpers for the availability designs

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// realistic seed data — recurring rules per day
const SEED_RULES = [
  { id:'r1', dayOfWeek:'Monday',    startTime:'09:00', endTime:'12:00', slotDurationMinutes:60, capacity:1 },
  { id:'r2', dayOfWeek:'Monday',    startTime:'14:00', endTime:'18:00', slotDurationMinutes:60, capacity:2 },
  { id:'r3', dayOfWeek:'Tuesday',   startTime:'09:00', endTime:'17:00', slotDurationMinutes:60, capacity:1 },
  { id:'r4', dayOfWeek:'Wednesday', startTime:'10:00', endTime:'19:00', slotDurationMinutes:30, capacity:1 },
  { id:'r5', dayOfWeek:'Thursday',  startTime:'09:00', endTime:'17:00', slotDurationMinutes:60, capacity:1 },
  { id:'r6', dayOfWeek:'Friday',    startTime:'08:00', endTime:'14:00', slotDurationMinutes:45, capacity:2 },
  { id:'r7', dayOfWeek:'Saturday',  startTime:'10:00', endTime:'16:00', slotDurationMinutes:60, capacity:1 },
];

// one-off blocks (sample)
const SEED_BLOCKS = [
  { id:'b1', blockDate:'2026-05-11', startTime:null, endTime:null, reason:'Personal day' },
  { id:'b2', blockDate:'2026-05-18', startTime:'13:00', endTime:'17:00', reason:'Conference' },
  { id:'b3', blockDate:'2026-05-25', startTime:null, endTime:null, reason:'Memorial Day' },
];

// time helpers
function tToMin(t) { const [h,m] = t.split(':').map(Number); return h*60+m; }
function minToT(m) { const h = Math.floor(m/60), mm = m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
function fmtT(t) {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  const hh = h % 12 || 12;
  return m === 0 ? `${hh}${ap}` : `${hh}:${String(m).padStart(2,'0')}${ap}`;
}
function dayWindow(rules, day) {
  const rs = rules.filter(r => r.dayOfWeek === day);
  if (!rs.length) return null;
  const start = Math.min(...rs.map(r => tToMin(r.startTime)));
  const end = Math.max(...rs.map(r => tToMin(r.endTime)));
  return { start, end };
}
// generate slots for a rule, with some pre-marked taken
function genSlots(rule, takenSeeds = []) {
  const slots = [];
  for (let m = tToMin(rule.startTime); m + rule.slotDurationMinutes <= tToMin(rule.endTime); m += rule.slotDurationMinutes) {
    slots.push({ time: minToT(m), label: fmtT(minToT(m)), taken: takenSeeds.includes(minToT(m)) });
  }
  return slots;
}

window.AV_DAYS = DAYS;
window.AV_DAYS_SHORT = DAYS_SHORT;
window.AV_SEED_RULES = SEED_RULES;
window.AV_SEED_BLOCKS = SEED_BLOCKS;
window.av_tToMin = tToMin;
window.av_minToT = minToT;
window.av_fmtT = fmtT;
window.av_dayWindow = dayWindow;
window.av_genSlots = genSlots;
