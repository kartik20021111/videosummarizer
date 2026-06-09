import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, Settings, PlaySquare, ArrowLeftRight } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { path: '/history', label: 'History', icon: <History size={16} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={16} /> },
    { path: '/channel', label: 'Channel Analyzer', icon: <PlaySquare size={16} /> },
    { path: '/compare', label: 'Compare Videos', icon: <ArrowLeftRight size={16} /> },
  ];

  const activeIndex = navItems.findIndex(item => item.path === location.pathname);

  const handleAboutClick = () => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollToAbout: true } });
    } else {
      const el = document.getElementById('about-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className={`top-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* ABOUT ME BUTTON: Only renders on Dashboard Page (route "/") */}
          {location.pathname === '/' && (
            <div className="about-me-container">
              <button 
                className="about-me-btn" 
                onClick={() => setShowDropdown(!showDropdown)}
                aria-expanded={showDropdown}
              >
                About Me
              </button>
              {showDropdown && (
                <>
                  <div className="dropdown-overlay" onClick={() => setShowDropdown(false)}></div>
                  <div className="about-dropdown-card">
                    <div className="dropdown-label">Made by</div>
                    <div className="dropdown-name">Kartik Sharma</div>
                    <a href="mailto:kartik111102@gmail.com" className="dropdown-email">
                      kartik111102@gmail.com
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Sidebar for Desktop */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-container">
            <svg width="28" height="22" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
              <path d="M2 2L18 11L2 20V2Z" fill="var(--accent)" />
              <path d="M12 11H26" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="logo-text">VideoSummarizer</span>
          </div>
        </div>
        
        <div className="sidebar-divider"></div>

        <nav className="sidebar-nav" style={{ position: 'relative' }}>
          {/* Sliding indicator line and highlight box */}
          {activeIndex !== -1 && (
            <div 
              className="sidebar-nav-indicator" 
              style={{ 
                transform: `translateY(${activeIndex * 44}px)` 
              }}
            ></div>
          )}
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="about-footer-btn" onClick={handleAboutClick}>
            About
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom Tab Bar for Mobile */}
      <nav className="bottom-tab-bar">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
