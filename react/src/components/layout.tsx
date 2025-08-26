// components/Layout.tsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { DEMO } from '../demoMode';

{DEMO && <div className="px-3 py-1 text-sm text-yellow-800" style={{background:'#FEF3C7'}}>Demo mode: cloud disabled, local data only</div>}


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <div className="layout">
      {/* Top navigation bar */}
      <nav className="navbar">
        <div className="nav-container">
          {/* Logo and program name */}
          <div className="nav-brand">
            <Link to="/home" className="brand-link">
              🐦 BirdTag
            </Link>
          </div>

          {/* Main navigation menu - 现在包含Profile */}
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/home" className={isActive('/home')}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/upload" className={isActive('/upload')}>
                Upload
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/search" className={isActive('/search')}>
                Search & Manage
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/tags" className={isActive('/tags')}>
                Tags
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/notifications" className={isActive('/notifications')}>
                Notifications
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/profile" className={isActive('/profile')}>
                Profile
              </Link>
            </li>
          </ul>

          {/*Logout */}
          <div className="nav-user">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* The main content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 Monash Birdy Buddies. Built with AWS.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;