import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { ChakraProvider, extendTheme, Box, Button, Select, HStack, Icon, Text } from '@chakra-ui/react';
import { apiService, isApiMode, setApiMode } from './apiService';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Dashboard from './components/Dashboard';
import ClientsManager from './components/ClientsManager';
import ItemsManager from './components/ItemsManager';
import SaleBillsManager from './components/SaleBillsManager';
import DebitNotesManager from './components/DebitNotesManager';
import SalesmenManager from './components/SalesmenManager';
import BusinessSettings from './components/BusinessSettings';
import InvoicesManager from './components/InvoicesManager';
import Login from './components/Login';

import {
  FaChartPie,
  FaUsers,
  FaBoxes,
  FaFileInvoiceDollar,
  FaReceipt,
  FaWarehouse,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaServer,
  FaFileSignature
} from 'react-icons/fa';

const theme = extendTheme({
  colors: {
    sky: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    }
  },
  fonts: {
    heading: `'Inter', -apple-system, sans-serif`,
    body: `'Inter', -apple-system, sans-serif`,
  },
});

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: FaChartPie, desc: 'Overview & Analytics' },
  { path: '/clients', label: 'Clients', icon: FaUsers, desc: 'Party Management' },
  { path: '/items', label: 'Stock / Items', icon: FaBoxes, desc: 'Inventory Catalog' },
  { path: '/bills', label: 'Sale Bills', icon: FaFileInvoiceDollar, desc: 'Outward Invoices' },
  { path: '/debit-notes', label: 'Debit Notes', icon: FaReceipt, desc: 'Adjustment Entries' },
  { path: '/salesmen', label: 'Salesmen', icon: FaUsers, desc: 'Field Agents' },
  { path: '/invoices', label: 'Invoices', icon: FaFileSignature, desc: 'Invoice Records' },
  { path: '/settings', label: 'Business Profile', icon: FaCog, desc: 'Company Settings' },
];

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/clients': 'Clients Management',
  '/items': 'Stock & Items',
  '/bills': 'Sale Bills',
  '/debit-notes': 'Debit Notes',
  '/salesmen': 'Salesmen Directory',
  '/invoices': 'Invoice Console',
  '/settings': 'Business Settings',
};

function AppLayout({ stats, reloadStats, onLogout, apiModeState, toggleApiMode }) {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';
  const user = apiService.getCurrentUser() || { email: 'admin@example.com', name: 'Admin User' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: '260px',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex', flexDirection: 'column', zIndex: 30,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)'
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(14,165,233,0.4)'
            }}>
              <FaWarehouse style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>Account Master</div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '500', marginTop: '1px' }}>Billing & Inventory</div>
            </div>
          </div>
        </div>

        {/* Nav Label */}
        <div style={{ padding: '20px 20px 8px' }}>
          <span style={{ color: '#475569', fontSize: '10px', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase' }}>Main Menu</span>
        </div>

        {/* Nav Items */}
        <nav style={{ padding: '0 12px', flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map(tab => {
            const Icon = tab.icon;
            return (
              <NavLink key={tab.path} to={tab.path} end={tab.path === '/'} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '11px 14px', borderRadius: '10px', marginBottom: '4px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: isActive ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' : 'transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(14,165,233,0.35)' : 'none',
                  }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                      flexShrink: 0
                    }}>
                      <Icon style={{ color: isActive ? 'white' : '#64748b', fontSize: '15px' }} />
                    </div>
                    <div>
                      <div style={{ color: isActive ? 'white' : '#94a3b8', fontSize: '13px', fontWeight: isActive ? '700' : '500' }}>{tab.label}</div>
                      <div style={{ color: isActive ? 'rgba(255,255,255,0.65)' : '#475569', fontSize: '10px', marginTop: '1px' }}>{tab.desc}</div>
                    </div>
                    {isActive && (
                      <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'white', opacity: 0.8 }} />
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom profile section */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: '800', fontSize: '13px'
            }}>{user.name ? user.name.substring(0, 2).toUpperCase() : (user.email ? user.email.substring(0, 2).toUpperCase() : 'AD')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email || 'Admin User'}</div>
              <div style={{ color: '#475569', fontSize: '10px' }}>{user.email || user.phone || 'Super Admin'}</div>
            </div>
            <FaSignOutAlt style={{ color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }} onClick={onLogout} title="Sign Out" />
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* TOPBAR */}
        <header style={{
          position: 'fixed', top: 0, left: '260px', right: 0, height: '64px',
          background: 'white', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', zIndex: 20,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '22px', background: 'linear-gradient(180deg, #0ea5e9, #6366f1)', borderRadius: '2px' }} />
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>{pageTitle}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>Account Master · Billing Console</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button style={{
              width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <FaBell style={{ color: '#64748b', fontSize: '14px' }} />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <Box style={{ marginTop: '64px', padding: '28px 32px', flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard stats={stats} />} />
            <Route path="/clients" element={<ClientsManager onDbChange={reloadStats} />} />
            <Route path="/items" element={<ItemsManager onDbChange={reloadStats} />} />
            <Route path="/bills" element={<SaleBillsManager onDbChange={reloadStats} />} />
            <Route path="/debit-notes" element={<DebitNotesManager onDbChange={reloadStats} />} />
            <Route path="/salesmen" element={<SalesmenManager onDbChange={reloadStats} />} />
            <Route path="/invoices" element={<InvoicesManager />} />
            <Route path="/settings" element={<BusinessSettings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </main>
    </div>
  );
}

export default function App() {
  const [stats, setStats] = useState({});
  const [authenticated, setAuthenticated] = useState(false);
  const [apiModeState, setApiModeState] = useState(isApiMode());

  const reloadStats = async () => {
    try {
      const dashboardStats = await apiService.getDashboardStats();
      setStats(dashboardStats);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const isAuth = apiService.isAuthenticated();
    setAuthenticated(isAuth);
    if (isAuth) reloadStats();
  }, [apiModeState]);

  const handleLoginSuccess = () => {
    setAuthenticated(true);
    reloadStats();
  };

  const handleLogout = async () => {
    await apiService.logout();
    setAuthenticated(false);
  };

  const toggleApiMode = (useApi) => {
    setApiMode(useApi);
    setApiModeState(useApi);
    // When changing modes, reset auth check
    setAuthenticated(apiService.isAuthenticated());
  };

  // If in API mode and NOT authenticated, show the login screen
  if (apiModeState && !authenticated) {
    return (
      <ChakraProvider theme={theme}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        <AppLayout
          stats={stats}
          reloadStats={reloadStats}
          onLogout={handleLogout}
          apiModeState={apiModeState}
          toggleApiMode={toggleApiMode}
        />
      </Router>
    </ChakraProvider>
  );
}
