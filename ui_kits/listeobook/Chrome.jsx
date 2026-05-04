// Navbar + Footer
const Navbar = ({ user, onSignIn, onSignOut, currentPath = '/services', onNav }) => {
  const isAuth = !!user;
  return (
    <header className="nav">
      <div className="nav-inner">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <a onClick={() => onNav?.('/services')} style={{ cursor: 'pointer' }}><Lockup dark /></a>
          <nav className="nav-links">
            <a className={`nav-link ${currentPath.startsWith('/services') ? 'active' : ''}`} onClick={() => onNav?.('/services')} style={{ cursor: 'pointer' }}>Browse Services</a>
            {isAuth && <a className={`nav-link ${currentPath.startsWith('/account') ? 'active' : ''}`} onClick={() => onNav?.('/account/bookings')} style={{ cursor: 'pointer' }}>My Bookings</a>}
          </nav>
        </div>
        <div className="nav-right">
          {isAuth ? (
            <>
              <span className="nav-divider" />
              <span className="nav-avatar">{user.fullName.charAt(0).toUpperCase()}</span>
              <span className="nav-username">{user.fullName}</span>
              <button onClick={onSignOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.7)', fontSize: 12, padding: '6px 12px', borderRadius: 6 }}>Logout</button>
            </>
          ) : (
            <>
              <button className="signin" onClick={onSignIn}>Sign In</button>
              <Button onClick={onSignIn}>Get Started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-grid">
        <div>
          <Lockup dark />
          <p>The easiest way to discover and book local wellness, beauty, and fitness services.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a>Browse Services</a></li>
            <li><a>My Bookings</a></li>
            <li><a>Sign In</a></li>
          </ul>
        </div>
        <div>
          <h4>Categories</h4>
          <ul>
            <li><a>Wellness</a></li>
            <li><a>Beauty</a></li>
            <li><a>Fitness</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© 2026 ListeoBook. All rights reserved.</div>
    </div>
  </footer>
);

window.Navbar = Navbar;
window.Footer = Footer;
