import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="header">
      <div className="header__left">
        <img src="/logo.png" alt="Logo" className="header__logo" />
        <h1 className="header__title">InfraDB Monitoring</h1>
      </div>
      <nav className="header__nav">
        <Link to="/" className={`nav-link ${pathname === '/' ? 'nav-link--active' : ''}`}>
          Dashboard
        </Link>
        <Link to="/alerts" className={`nav-link ${pathname === '/alerts' ? 'nav-link--active' : ''}`}>
          Alerts
        </Link>
        <Link to="/settings" className={`nav-link ${pathname === '/settings' ? 'nav-link--active' : ''}`}>
          Settings
        </Link>
        <Link to="/groups" className={`nav-link ${pathname.startsWith('/groups') ? 'nav-link--active' : ''}`}>
          <span style={{display:'flex',alignItems:'center',gap:4}}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign:'middle'}}><circle cx="10" cy="10" r="8" stroke="#6366f1" strokeWidth="2" fill="#eef2ff"/><rect x="6" y="8" width="8" height="2" rx="1" fill="#6366f1"/><rect x="8" y="11" width="4" height="2" rx="1" fill="#6366f1"/></svg>
            Groups
          </span>
        </Link>
      </nav>
    </header>
  );
}
