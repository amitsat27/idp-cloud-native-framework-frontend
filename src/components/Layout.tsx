import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChatBubbleOutlineRounded, 
  DnsRounded, 
  MenuOpenRounded, 
  MenuRounded, 
  WbSunnyRounded, 
  NightsStayRounded,
  LogoutRounded,
  AdminPanelSettingsRounded
} from '@mui/icons-material';
import { IconButton, Tooltip, Typography, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import '../styling/Sidebar.css';

const ChatContext = createContext<any>(null);
export const useChat = () => useContext(ChatContext);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app-theme') as 'light' | 'dark') || 'dark';
  });
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [messages, setMessages] = useState<any[]>(() => {
    const savedMessages = localStorage.getItem('idp-chat-history');
    return savedMessages ? JSON.parse(savedMessages) : [
      { role: "ai", text: "Systems online. Specify your infrastructure intent." }
    ];
  });

  const [pendingPlan, setPendingPlan] = useState<any | null>(() => {
    const savedPlan = localStorage.getItem('idp-pending-plan');
    return savedPlan ? JSON.parse(savedPlan) : null;
  });

  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('idp-chat-history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('idp-pending-plan', JSON.stringify(pendingPlan));
  }, [pendingPlan]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const clearChat = () => {
    const initialMessage = [{ role: "ai", text: "Systems online. Specify your infrastructure intent." }];
    setMessages(initialMessage);
    setPendingPlan(null);
    localStorage.removeItem('idp-chat-history');
    localStorage.removeItem('idp-pending-plan');
  };

  return (
    <ChatContext.Provider value={{ messages, setMessages, pendingPlan, setPendingPlan, clearChat }}>
      <Box sx={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="logo-section">
            {!isCollapsed && <Typography className="logo-text">IDP FRAMEWORK</Typography>}
            <IconButton onClick={handleToggle} size="small" sx={{ color: 'var(--text-secondary)' }}>
              {isCollapsed ? <MenuRounded /> : <MenuOpenRounded />}
            </IconButton>
          </div>

          <nav className="nav-list" style={{ flex: 1 }}>
            {/* Dashboard - OPERATOR and ADMIN only */}
            {user?.role !== 'VIEWER' && (
              <Link to="/dashboard" className={`nav-link-wrapper ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                <Tooltip title={isCollapsed ? "Plan & Deploy" : ""} placement="right">
                  <ChatBubbleOutlineRounded />
                </Tooltip>
                <span className="nav-label">Plan & Deploy</span>
              </Link>
            )}
            {/* Cluster Status - all authenticated users */}
            <Link to="/status" className={`nav-link-wrapper ${location.pathname === '/status' ? 'active' : ''}`}>
              <Tooltip title={isCollapsed ? "Cluster Status" : ""} placement="right">
                <DnsRounded />
              </Tooltip>
              <span className="nav-label">Cluster Status</span>
            </Link>
            
            {/* Admin - ADMIN only */}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className={`nav-link-wrapper ${location.pathname === '/admin' ? 'active' : ''}`}>
                <Tooltip title={isCollapsed ? "User Management" : ""} placement="right">
                  <AdminPanelSettingsRounded />
                </Tooltip>
                <span className="nav-label">User Management</span>
              </Link>
            )}
            
            <button 
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="nav-link-wrapper logout-btn"
              style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', padding: '12px' }}
            >
              <Tooltip title={isCollapsed ? "Logout" : ""} placement="right">
                <LogoutRounded />
              </Tooltip>
              <span className="nav-label">Logout</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <IconButton onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <NightsStayRounded /> : <WbSunnyRounded sx={{ color: '#ffca28' }} />}
            </IconButton>
          </div>
        </aside>

        <Box component="main" sx={{ flex: 1, overflow: 'auto', height: '100%' }}>
          {children}
        </Box>
      </Box>
    </ChatContext.Provider>
  );
};