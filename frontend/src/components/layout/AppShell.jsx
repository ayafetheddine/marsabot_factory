import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../../assets/Marsamaroc-logo.png';
import './AppShell.css';

const NAV_ITEMS = [
  { to: '/', label: 'Mes Bots', icon: '🤖', end: true },
  { to: '/knowledge', label: 'Base de Connaissances', icon: '📚' },
  { to: '/settings', label: 'Paramètres', icon: '⚙️' },
];

function AppShell({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      {/* ── Sidebar ── */}
      <aside className="shell-sidebar">
        <div className="shell-logo-wrap">
          <img src={logo} alt="Marsa Maroc" className="shell-logo" />
        </div>

        <p className="shell-app-name">MarsaBot Factory</p>

        <nav className="shell-nav">
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `shell-nav-item${isActive ? ' shell-nav-item--active' : ''}`
              }
            >
              <span className="shell-nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Main column ── */}
      <div className="shell-main-col">
        {/* Header */}
        <header className="shell-header">
          <span className="shell-header-title">Dashboard Admin</span>
          <button className="shell-logout-btn" type="button" onClick={handleLogout}>
            Déconnexion
          </button>
        </header>

        {/* Page content */}
        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
