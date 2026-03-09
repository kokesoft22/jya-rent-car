import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
  FileText
} from 'lucide-react';
import logo from './assets/logo.png';
import avatar from './assets/avatar.png';
import { supabase } from './lib/supabase';
import './App.css';

// Componentes temporales para secciones pendientes
import Dashboard from './components/Dashboard';
import './components/Dashboard.css';
import Fleet from './components/Fleet';
import './components/Fleet.css';
import Rentals from './components/Rentals';
import './components/Rentals.css';
import Finances from './components/Finances';
import './components/Finances.css';
import NewRental from './components/NewRental';
import './components/NewRental.css';
import Customers from './components/Customers';
import './components/Customers.css';
import Reports from './components/Reports';
import './components/Reports.css';

const SidebarItem = ({ icon: Icon, label, to, active, onAction }) => (
  <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`} onClick={onAction}>
    <Icon size={20} />
    <span>{label}</span>
  </Link>
);

const App = () => {
  const [notifications, setNotifications] = React.useState([]);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    fetchNotifications();
  }, []);

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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <Router>
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
            <HeaderActions notificationsCount={notifications.length} />
          </header>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/new-rental" element={<NewRental />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const HeaderActions = ({ notificationsCount }) => {
  return (
    <div className="header-actions">
      <div className="user-profile-v2">
        <div className="notification-btn" title={notificationsCount > 0 ? `${notificationsCount} avisos pendientes` : 'Sin notificaciones'}>
          <Bell size={22} color="#94a3b8" />
          {notificationsCount > 0 && <span className="notification-badge">{notificationsCount}</span>}
        </div>

        <div className="header-divider"></div>

        <div className="user-info-text">
          <span className="user-name">J&A Admin</span>
          <span className="user-role">SUPER ADMIN</span>
        </div>

        <div className="user-avatar-container">
          <img src={avatar} alt="Admin" className="user-avatar-img" />
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
