import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Key,
  DollarSign,
  Users,
  Settings,
  PlusCircle,
  Bell,
  Menu,
  X,
  FileText,
  LogOut,
  ChevronDown
} from 'lucide-react';
import logo from './assets/logo.png';
import avatar from './assets/avatar.png';
import { supabase } from './lib/supabase';
import './App.css';

// Componentes temporales para secciones pendientes
import Dashboard from './pages/Dashboard';
import './components/Dashboard.css';
import Fleet from './pages/Fleet';
import './pages/Fleet.css';
import Rentals from './pages/Rentals';
import './components/Rentals.css';
import Finances from './pages/Finances';
import './components/Finances.css';
import NewRental from './pages/NewRental';
import './components/NewRental.css';
import Customers from './pages/Customers';
import './components/Customers.css';
import Reports from './pages/Reports';
import './components/Reports.css';
import Login from './pages/Login';
import './components/Login.css';

const SidebarItem = ({ icon: Icon, label, to, active, onAction }) => (
  <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`} onClick={onAction}>
    <Icon size={20} />
    <span>{label}</span>
  </Link>
);

const SessionInitializer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const hasInitialized = sessionStorage.getItem('jya_rent_car_init');
    
    if (!hasInitialized) {
      sessionStorage.setItem('jya_rent_car_init', 'true');
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }
  }, [navigate, location]);
  
  return null;
};

const App = () => {
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const { data: maintenanceVehicles } = await supabase
        .from('vehicles')
        .select('model')
        .eq('status', 'maintenance');

      const today = new Date().toISOString().split('T')[0];
      const { data: expiringRentals } = await supabase
        .from('rentals')
        .select('vehicles(model)')
        .eq('status', 'active')
        .eq('end_date', today);

      const alerts = [];
      (maintenanceVehicles || []).forEach(v => alerts.push({ type: 'maintenance', message: `${v.model} en mantenimiento` }));
      (expiringRentals || []).forEach(r => alerts.push({ type: 'delivery', message: `Entrega hoy: ${r.vehicles?.model}` }));

      setNotifications(alerts);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('jya_rent_car_init');
    await supabase.auth.signOut();
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <span>Cargando JyA Rent Car...</span>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Router>
      <SessionInitializer />
      <div className="app-container">
        {/* Overlay for mobile */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

        <aside className={`sidebar glass-card ${sidebarOpen ? 'open' : ''}`}>
          <div className="logo-container">
            <button className="mobile-close-btn" onClick={closeSidebar}>
              <X size={24} />
            </button>
            <img src={logo} alt="J&A Rent Car" className="brand-logo" />
            <div className="logo-text-wrapper">
              <span className="logo-text">J&A</span>
              <span className="logo-subtext">Rent Car</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <SidebarNav onAction={closeSidebar} />
          </nav>

          <div className="sidebar-footer">
            <SidebarItem icon={Settings} label="Configuración" to="/settings" onAction={closeSidebar} />
            <button className="sidebar-item logout-btn-item" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        <main className="main-content">
          <header className="top-header">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <div className="header-spacer"></div>
            <div className="search-bar glass-card">
              <input type="text" placeholder="Buscar vehículos..." />
            </div>
            <HeaderActions 
              notifications={notifications}
              onLogout={handleLogout}
              userEmail={session.user.email}
            />
          </header>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/new-rental" element={<NewRental />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const HeaderActions = ({ notifications, onLogout, userEmail }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notificationsCount = notifications.length;

  return (
    <div className="header-actions">
      <div className="user-profile-v2">
        <div 
          className={`notification-btn ${notifOpen ? 'active' : ''}`} 
          onClick={() => setNotifOpen(!notifOpen)}
          title={notificationsCount > 0 ? `${notificationsCount} avisos pendientes` : 'Sin notificaciones'}
        >
          <Bell size={22} color={notifOpen ? "#2563eb" : "#94a3b8"} />
          {notificationsCount > 0 && <span className="notification-badge">{notificationsCount}</span>}
          
          {notifOpen && (
            <div className="notifications-dropdown glass-card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="dropdown-header">
                <h3>Notificaciones</h3>
              </div>
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div key={i} className="notification-item">
                      <div className={`notif-icon ${n.type}`}></div>
                      <span>{n.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">No hay avisos nuevos</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-divider"></div>

        <div className="user-dropdown-wrapper" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="user-info-text">
            <span className="user-name">Admin</span>
            <span className="user-role">{userEmail}</span>
          </div>

          <div className="user-avatar-container">
            <img src={avatar} alt="Admin" className="user-avatar-img" />
            <ChevronDown size={14} className={`dropdown-icon ${menuOpen ? 'open' : ''}`} />
          </div>

          {menuOpen && (
            <div className="user-dropdown-menu glass-card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="dropdown-header">
                <span className="dropdown-user-email">{userEmail}</span>
              </div>
              <button 
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }} 
                className="dropdown-item logout-action"
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SidebarNav = ({ onAction }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      <SidebarItem icon={LayoutDashboard} label="Panel Principal" to="/" active={currentPath === '/'} onAction={onAction} />
      <SidebarItem icon={Car} label="Vehículos" to="/fleet" active={currentPath === '/fleet'} onAction={onAction} />
      <SidebarItem icon={Key} label="Renta" to="/rentals" active={currentPath === '/rentals'} onAction={onAction} />
      <SidebarItem icon={DollarSign} label="Finanzas" to="/finances" active={currentPath === '/finances'} onAction={onAction} />
      <SidebarItem icon={FileText} label="Reportes" to="/reports" active={currentPath === '/reports'} onAction={onAction} />
      <SidebarItem icon={Users} label="Clientes" to="/customers" active={currentPath === '/customers'} onAction={onAction} />
    </>
  );
};

export default App;
