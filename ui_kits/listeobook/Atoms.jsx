// Atoms — buttons, badges, inputs, lockup
const { useState } = React;

const Icon = ({ name, size = 16, color, style }) => (
  <i data-lucide={name} style={{ width: size, height: size, color: color || 'currentColor', display: 'inline-flex', ...style }} />
);

const Lockup = ({ dark = false }) => (
  <span className="lockup">
    <span className="lockup-tile">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </span>
    <span className="lockup-word" style={{ color: dark ? '#fff' : '#1a2038' }}>
      Listeo<span className="b">Book</span>
    </span>
  </span>
);

const Button = ({ variant = 'default', size, className = '', children, ...rest }) => {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, className].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{children}</button>;
};

const Badge = ({ status, children }) => {
  const map = { confirmed: 'badge-default', pending: 'badge-pending', completed: 'badge-completed', cancelled: 'badge-cancelled' };
  return <span className={`badge ${map[status] || 'badge-default'}`}>{children || status}</span>;
};

const CategoryPill = ({ slug, children }) => {
  const map = { wellness: 'cat-wellness', beauty: 'cat-beauty', fitness: 'cat-fitness' };
  return <span className={`cat-pill ${map[slug] || 'cat-other'}`}>{children}</span>;
};

const Input = ({ label, ...props }) => (
  <div className="field">
    {label && <label className="label">{label}</label>}
    <input className="input" {...props} />
  </div>
);

window.Lockup = Lockup;
window.Button = Button;
window.Badge = Badge;
window.CategoryPill = CategoryPill;
window.Input = Input;
window.LbIcon = Icon;
