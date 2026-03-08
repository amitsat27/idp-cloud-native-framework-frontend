import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChatBubbleOutlineRounded, 
  DnsRounded, 
  MenuOpenRounded, 
  MenuRounded, 
  WbSunnyRounded, 
  NightsStayRounded
} from '@mui/icons-material';
import { IconButton, Tooltip, Typography, Box } from '@mui/material';
import '../styling/Sidebar.css';

const ChatContext = createContext<any>(null);
export const useChat = () => useContext(ChatContext);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app-theme') as 'light' | 'dark') || 'dark';
  });
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // --- NEW: PERSISTENT CHAT INITIALIZATION ---
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

  // Save changes to localStorage whenever they update
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // --- NEW: SYNC CHAT TO STORAGE ---
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
  localStorage.removeItem('idp-chat-history'); // 
  localStorage.removeItem('idp-pending-plan'); // 
};

  return (
    <ChatContext.Provider value={{ messages, setMessages, pendingPlan, setPendingPlan, clearChat }}>
      <Box className="app-container" sx={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="logo-section">
            {!isCollapsed && <Typography className="logo-text">IDP FRAMEWORK</Typography>}
            <IconButton onClick={handleToggle} size="small" sx={{ color: 'var(--text-secondary)' }}>
              {isCollapsed ? <MenuRounded /> : <MenuOpenRounded />}
            </IconButton>
          </div>

          <nav className="nav-list" style={{ flex: 1 }}>
            <Link to="/" className={`nav-link-wrapper ${location.pathname === '/' ? 'active' : ''}`}>
              <Tooltip title={isCollapsed ? "Plan & Deploy" : ""} placement="right">
                <ChatBubbleOutlineRounded />
              </Tooltip>
              <span className="nav-label">Plan & Deploy</span>
            </Link>
            <Link to="/status" className={`nav-link-wrapper ${location.pathname === '/status' ? 'active' : ''}`}>
              <Tooltip title={isCollapsed ? "Cluster Status" : ""} placement="right">
                <DnsRounded />
              </Tooltip>
              <span className="nav-label">Cluster Status</span>
            </Link>
          </nav>

          <div className="sidebar-footer">
            <IconButton onClick={toggleTheme}>
              {theme === 'light' ? <NightsStayRounded /> : <WbSunnyRounded sx={{ color: '#ffca28' }} />}
            </IconButton>
          </div>
        </aside>

        <main style={{ flex: 1, backgroundColor: 'var(--bg-app)', overflowY: 'auto' }}>
          {children}
        </main>
      </Box>
    </ChatContext.Provider>
  );
};