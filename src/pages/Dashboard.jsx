import React from 'react';
import { Link } from 'react-router-dom';
import {
    PlusCircle,
    DollarSign,
    TrendingUp,
    Car,
    Key,
    Wrench,
    MoreHorizontal
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from 'recharts';
import { useDashboardStats } from '../hooks/useDashboardStats';
import StatCard from '../components/dashboard/StatCard';
import '../components/Dashboard.css';

const COLORS = ['#06bcf9', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
    const { data: dData, isLoading, error, refetch } = useDashboardStats();

    if (isLoading) return <div className="page-content center">Cargando dashboard...</div>;
    if (error) return <div className="page-content center error-text">Error: {error.message}</div>;

    const { stats, chartData, vehicleStats, recentRentals, maintenanceVehicles } = dData;

    const getStatusBadge = (status) => {
        const map = {
            active: { label: 'Activa', cls: 'badge-active' },
            completed: { label: 'Completada', cls: 'badge-completed' },
            cancelled: { label: 'Cancelada', cls: 'badge-cancelled' }
        };
        const s = map[status] || { label: status, cls: '' };
        return <span className={`rental-badge ${s.cls}`}>{s.label}</span>;
    };

    return (
        <div className="page-content dashboard">
            <div className="welcome-section">
                <div className="welcome-content">
                    <h1 className="welcome-text">¡Bienvenido de nuevo, J&A!</h1>
                    <p className="welcome-subtext">Aquí tienes un resumen de lo que está pasando en tu Rent Car hoy.</p>
                </div>

            </div>

            <div className="stats-grid">
                <StatCard title="Vehículos Disponibles" value={`${stats.fleetAvailable}/${stats.fleetTotal} vehículos`} icon={Car} trend={stats.fleetTotal > 0 ? `${Math.round((stats.fleetAvailable / stats.fleetTotal) * 100)}% disponible` : null} color="#3b82f6" />
                <StatCard title="Vehículos Rentados" value={`${stats.activeRentals} ${stats.activeRentals === 1 ? 'vehículo' : 'vehículos'}`} icon={Key} trend={stats.fleetTotal > 0 ? `${Math.round((stats.activeRentals / stats.fleetTotal) * 100)}% rentado` : null} color="#06bcf9" />
                <StatCard title="Ingreso Promedio / Vehículo" value={`$${Math.round(stats.avgIncomePerVehicle).toLocaleString()}`} icon={TrendingUp} trend="Rendimiento total" color="#8b5cf6" />
            </div>

            <div className="charts-grid">
                <div className="glass-card chart-container income-chart">
                    <div className="chart-header">
                        <h3>Resumen de Ingresos</h3>
                        <span className="chart-period">Últimos 6 meses</span>
                    </div>
                    <div className="chart-body" style={{ height: '300px' }}>
                        {chartData.some(d => d.income > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 30, right: 35, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06bcf9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06bcf9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} stroke="#94a3b8" />
                                    <YAxis fontSize={12} axisLine={false} tickLine={false} stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ background: '#101620', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#06bcf9" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3}>
                                        <LabelList 
                                            dataKey="income" 
                                            position="top" 
                                            offset={10}
                                            formatter={(value) => `$${value.toLocaleString()}`} 
                                            style={{ fill: '#cbd5e1', fontSize: '11px', fontWeight: 600 }} 
                                        />
                                    </Area>
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="center-text muted">No hay ingresos registrados aún.</div>
                        )}
                    </div>
                </div>

                <div className="glass-card chart-container fleet-chart">
                    <div className="chart-header">
                        <h3>Vehículos Más Rentables</h3>
                        <span className="chart-period">Ingresos Totales</span>
                    </div>
                    <div className="chart-body ranking-list">
                        {vehicleStats.length > 0 ? (
                            vehicleStats.map((v, index) => {
                                const maxVal = vehicleStats[0]?.value || 1;
                                const pct = Math.max((v.value / maxVal) * 100, 8);
                                const color = COLORS[index % COLORS.length];
                                return (
                                    <div key={v.name} className="ranking-item">
                                        <span className="ranking-name">{v.name}</span>
                                        <div className="ranking-bar-bg">
                                            <div className="ranking-bar-fill" style={{ width: `${pct}%`, background: color }}>
                                                <span className="ranking-value">${v.value.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="center-text muted">Sin datos de ranking.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bottom-grid">
                <div className="glass-card chart-container recent-rentals-card">
                    <div className="chart-header">
                        <h3>Rentas Recientes</h3>
                        <Link to="/rentals" className="view-all-link">Ver Todas</Link>
                    </div>
                    <div className="recent-rentals-table">
                        <div className="rr-table-header">
                            <span>Vehículo</span>
                            <span>Cliente</span>
                            <span>Estado</span>
                            <span>Monto</span>
                            <span></span>
                        </div>
                        {recentRentals.length > 0 ? (
                            recentRentals.map(rental => (
                                <div key={rental.id} className="rr-table-row">
                                    <div className="rr-vehicle-info">
                                        <div className="rr-vehicle-icon"><Car size={18} /></div>
                                        <span className="rr-vehicle-name">{rental.vehicles?.model || 'N/A'}</span>
                                    </div>
                                    <span className="rr-customer">{rental.customers?.full_name || 'N/A'}</span>
                                    <span className="rr-status">{getStatusBadge(rental.status)}</span>
                                    <span className="rr-amount">${parseFloat(rental.total_amount || 0).toLocaleString()}</span>
                                    <span className="rr-actions"><MoreHorizontal size={16} /></span>
                                </div>
                            ))
                        ) : (
                            <div className="center-text muted py-4">No hay rentas recientes.</div>
                        )}
                    </div>
                </div>

                <div className="glass-card chart-container maintenance-card">
                    <div className="chart-header">
                        <h3>Próximos Mantenimientos</h3>
                    </div>
                    <div className="maintenance-list">
                        {maintenanceVehicles.length > 0 ? (
                            maintenanceVehicles.map(vehicle => (
                                <div key={vehicle.id} className="maintenance-item">
                                    <div className="maintenance-date">
                                        <span className="m-month">{new Date().toLocaleString('es-ES', { month: 'short' }).toUpperCase()}</span>
                                        <span className="m-day">{new Date().getDate()}</span>
                                    </div>
                                    <div className="maintenance-info">
                                        <span className="m-vehicle">{vehicle.model}</span>
                                        <span className="m-desc">Mantenimiento General</span>
                                    </div>
                                    <span className="m-urgency urgent">Urgente</span>
                                </div>
                            ))
                        ) : (
                            <div className="center-text muted py-4">Sin mantenimientos próximos.</div>
                        )}
                    </div>
                    <Link to="/fleet" className="manage-schedule-btn">
                        <Wrench size={16} />
                        Gestionar Mantenimientos
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
