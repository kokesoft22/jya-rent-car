import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    Car,
    Key,
    DollarSign,
    AlertCircle,
    MoreHorizontal,
    Wrench,
    Calendar,
    PlusCircle
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { supabase } from '../lib/supabase';

const COLORS = ['#06bcf9', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="glass-card stat-card">
        <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon size={22} />
        </div>
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <h3 className="stat-value">{value}</h3>
            {trend && (
                <span className="stat-trend">
                    <TrendingUp size={14} />
                    {trend}
                </span>
            )}
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalEarnings: 0,
        avgIncomePerVehicle: 0,
        accountsReceivable: 0,
        activeRentals: 0,
        fleetTotal: 0,
        fleetAvailable: 0,
        maintenanceDue: 0
    });
    const [chartData, setChartData] = useState([]);
    const [vehicleStats, setVehicleStats] = useState([]);
    const [recentRentals, setRecentRentals] = useState([]);
    const [maintenanceVehicles, setMaintenanceVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchChartData();
        fetchVehicleRanking();
        fetchRecentRentals();
        fetchMaintenanceVehicles();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const now = new Date();

            // Fetch metrics in parallel
            const [
                { count: activeRentalsCount },
                { data: fleetData, error: fleetError },
                { data: completedRentalsData },
                { data: activeRentalsPayments },
                { data: thisMonthRentals },
                { data: lastMonthRentals }
            ] = await Promise.all([
                // 1. Get Active Rentals Count
                supabase.from('rentals').select('*', { count: 'exact', head: true }).eq('status', 'active'),

                // 2. Get Fleet Stats
                supabase.from('vehicles').select('status'),

                // 3. Get Total Earnings (completed rentals)
                supabase.from('rentals').select('total_amount').eq('status', 'completed'),

                // 4. Get Partial Payments (active rentals)
                supabase.from('rentals').select('amount_paid').eq('status', 'active'),

                // 5. Month-over-month data
                supabase.from('rentals').select('total_amount').gte('start_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
                supabase.from('rentals').select('total_amount').gte('start_date', new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()).lt('start_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
            ]);

            if (fleetError) throw fleetError;

            // Process Fleet Stats
            const total = fleetData.length;
            const maintenance = fleetData.filter(v => v.status === 'maintenance').length;
            
            // Fix: Calculate available/rented dynamically based on today's active rentals
            const todayStr = now.toISOString().split('T')[0];
            const { data: currentRentals } = await supabase
                .from('rentals')
                .select('vehicle_id')
                .eq('status', 'active')
                .lte('start_date', todayStr)
                .gte('end_date', todayStr);
            
            const currentlyRentedIds = new Set((currentRentals || []).map(r => r.vehicle_id));
            const available = fleetData.filter(v => v.status !== 'maintenance' && !currentlyRentedIds.has(v.id)).length;
            const rentedCount = currentlyRentedIds.size;

            // 3. Get Financial Data (all rentals not cancelled)
            const { data: rentalsFinance } = await supabase
                .from('rentals')
                .select('total_amount, amount_paid')
                .neq('status', 'cancelled');

            // Process Financials
            const totalEarnings = (rentalsFinance || []).reduce((acc, curr) => acc + parseFloat(curr.amount_paid || 0), 0);
            const totalExpected = (rentalsFinance || []).reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0);
            const accountsReceivable = totalExpected - totalEarnings;

            // 6. Calculate Average Income Per Vehicle
            const avgIncomePerVehicle = total > 0 ? totalEarnings / total : 0;

            // Calculate Trend
            const thisMonthTotal = (thisMonthRentals || [])
                .reduce((acc, c) => acc + parseFloat(c.total_amount), 0);
            const lastMonthTotal = (lastMonthRentals || [])
                .reduce((acc, c) => acc + parseFloat(c.total_amount), 0);

            let trendText = '';
            if (lastMonthTotal > 0) {
                const pct = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
                trendText = `${pct >= 0 ? '+' : ''}${pct}% vs mes pasado`;
            } else if (thisMonthTotal > 0) {
                trendText = '+100% este mes';
            } else {
                trendText = 'Sin datos previos';
            }

            setStats(prev => ({
                ...prev,
                totalEarnings,
                avgIncomePerVehicle,
                accountsReceivable,
                activeRentals: rentedCount,
                fleetTotal: total,
                fleetAvailable: available,
                maintenanceDue: maintenance,
                trend: trendText
            }));
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchChartData = async () => {
        try {
            const now = new Date();
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            const { data: rentals } = await supabase
                .from('rentals')
                .select('total_amount, start_date')
                .gte('start_date', sixMonthsAgo.toISOString());

            const monthly = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const month = d.getMonth();
                const year = d.getFullYear();

                const income = (rentals || [])
                    .filter(r => {
                        const rd = new Date(r.start_date);
                        return rd.getMonth() === month && rd.getFullYear() === year;
                    })
                    .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);

                monthly.push({ name: monthNames[month], income });
            }

            setChartData(monthly);
        } catch (err) {
            console.error('Error fetching chart data:', err);
        }
    };

    const fetchVehicleRanking = async () => {
        try {
            const { data: rentals } = await supabase
                .from('rentals')
                .select('total_amount, vehicles(model)');

            // Group by vehicle model and sum total_amount
            const vehicleMap = {};
            (rentals || []).forEach(r => {
                const model = r.vehicles?.model || 'Desconocido';
                vehicleMap[model] = (vehicleMap[model] || 0) + parseFloat(r.total_amount);
            });

            // Sort by value descending
            const sorted = Object.entries(vehicleMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            setVehicleStats(sorted.slice(0, 6));
        } catch (err) {
            console.error('Error fetching vehicle ranking:', err);
        }
    };

    const fetchRecentRentals = async () => {
        try {
            const { data } = await supabase
                .from('rentals')
                .select('*, vehicles(model, image_url), customers(name)')
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentRentals(data || []);
        } catch (err) {
            console.error('Error fetching recent rentals:', err);
        }
    };

    const fetchMaintenanceVehicles = async () => {
        try {
            const { data } = await supabase
                .from('vehicles')
                .select('*')
                .eq('status', 'maintenance');
            setMaintenanceVehicles(data || []);
        } catch (err) {
            console.error('Error fetching maintenance vehicles:', err);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            active: { label: 'Activa', cls: 'badge-active' },
            completed: { label: 'Completada', cls: 'badge-completed' },
            cancelled: { label: 'Cancelada', cls: 'badge-cancelled' }
        };
        const s = map[status] || { label: status, cls: '' };
        return <span className={`rental-badge ${s.cls}`}>{s.label}</span>;
    };

    const getPaymentBadge = (paymentStatus) => {
        const map = {
            paid: { label: 'Pagado', cls: 'badge-paid' },
            partial: { label: 'Parcial', cls: 'badge-partial' },
            pending: { label: 'Pendiente', cls: 'badge-pending' },
            reservation: { label: 'Reservado', cls: 'badge-reservation' }
        };
        const s = map[paymentStatus] || { label: 'N/A', cls: '' };
        return <span className={`rental-badge ${s.cls}`}>{s.label}</span>;
    };

    const hasChartData = chartData.some(d => d.income > 0);

    return (
        <div className="page-content dashboard">
            <div className="welcome-section">
                <div className="welcome-content">
                    <h1 className="welcome-text">¡Bienvenido de nuevo, J&A!</h1>
                    <p className="welcome-subtext">Aquí tienes un resumen de lo que está pasando en tu Rent Car hoy.</p>
                </div>
                <Link to="/new-rental" className="btn-primary">
                    <PlusCircle size={18} />
                    <span>Nueva Renta</span>
                </Link>
            </div>

            <div className="stats-grid">
                {/* Fila 1: Finanzas y Rendimiento */}
                <StatCard
                    title="Ganancias Totales"
                    value={`$${stats.totalEarnings.toLocaleString()}`}
                    icon={DollarSign}
                    trend={stats.trend}
                    color="#10b981"
                />
                <StatCard
                    title="Ingreso Promedio / Vehículo"
                    value={`$${Math.round(stats.avgIncomePerVehicle).toLocaleString()}`}
                    icon={TrendingUp}
                    trend="Rendimiento total"
                    color="#8b5cf6"
                />
                <StatCard
                    title="Cuentas por cobrar"
                    value={`$${Math.round(stats.accountsReceivable).toLocaleString()}`}
                    icon={DollarSign}
                    trend="Pendiente de cobro"
                    color="#f43f5e"
                />

                {/* Fila 2: Operaciones y Flota */}
                <StatCard
                    title="Vehículos Disponibles"
                    value={`${stats.fleetAvailable}/${stats.fleetTotal}`}
                    icon={Car}
                    trend={stats.fleetTotal > 0 ? `${Math.round((stats.fleetAvailable / stats.fleetTotal) * 100)}% disponible` : null}
                    color="#3b82f6"
                />
                <StatCard
                    title="Vehículos Rentados"
                    value={`${stats.activeRentals} ${stats.activeRentals === 1 ? 'Vehículo' : 'Vehículos'}`}
                    icon={Key}
                    trend={stats.fleetTotal > 0 ? `${Math.round((stats.activeRentals / stats.fleetTotal) * 100)}% rentado` : null}
                    color="#06bcf9"
                />
                <StatCard
                    title="Vehículos en Mantenimiento"
                    value={`${stats.maintenanceDue} ${stats.maintenanceDue === 1 ? 'Vehículo' : 'Vehículos'}`}
                    icon={Wrench}
                    trend={stats.fleetTotal > 0 ? `${Math.round((stats.maintenanceDue / stats.fleetTotal) * 100)}% de flota` : null}
                    color="#f59e0b"
                />
            </div>

            <div className="charts-grid">
                <div className="glass-card chart-container income-chart">
                    <div className="chart-header">
                        <h3>Resumen de Ingresos</h3>
                        <span className="chart-period">Últimos 6 meses</span>
                    </div>
                    <div className="chart-body" style={{ height: '300px' }}>
                        {hasChartData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
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
                                    <Area type="monotone" dataKey="income" stroke="#06bcf9" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                <p>Aún no hay ingresos registrados. Crea rentas para ver el gráfico.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card chart-container fleet-chart">
                    <div className="chart-header">
                        <h3>Vehículos Más Rentables</h3>
                        <span className="chart-period">Ingresos Totales</span>
                    </div>
                    <div className="chart-body" style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', padding: '20px 24px' }}>
                        {vehicleStats.length > 0 ? (
                            vehicleStats.map((v, index) => {
                                const maxVal = vehicleStats[0]?.value || 1;
                                const pct = Math.max((v.value / maxVal) * 100, 8);
                                const color = COLORS[index % COLORS.length];
                                return (
                                    <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <span style={{ minWidth: '120px', fontSize: '13px', fontWeight: 500, color: '#f8fafc', textAlign: 'right' }}>{v.name}</span>
                                        <div style={{ flex: 1, position: 'relative', height: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${pct}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                                                borderRadius: '6px',
                                                transition: 'width 0.6s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                paddingRight: '10px'
                                            }}>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                                                    ${v.value.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                <p>Aún no hay datos de rentas. Crea rentas para ver el ranking.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Rentals & Upcoming Maintenance */}
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
                                        <div className="rr-vehicle-icon">
                                            <Car size={18} />
                                        </div>
                                        <div>
                                            <span className="rr-vehicle-name">{rental.vehicles?.model || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <span className="rr-customer">{rental.customers?.name || rental.customer_name || 'N/A'}</span>
                                    <span>{getStatusBadge(rental.status)}</span>
                                    <span className="rr-amount">${parseFloat(rental.total_amount || 0).toLocaleString()}</span>
                                    <span className="rr-actions"><MoreHorizontal size={16} color="#64748b" /></span>
                                </div>
                            ))
                        ) : (
                            <div className="rr-empty">
                                <p>No hay rentas recientes.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card chart-container maintenance-card">
                    <div className="chart-header">
                        <h3>Próximos Mantenimientos</h3>
                    </div>
                    <div className="maintenance-list">
                        {maintenanceVehicles.length > 0 ? (
                            maintenanceVehicles.map(vehicle => {
                                const today = new Date();
                                const day = today.getDate();
                                const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                                const month = monthNames[today.getMonth()];
                                return (
                                    <div key={vehicle.id} className="maintenance-item">
                                        <div className="maintenance-date">
                                            <span className="m-month">{month}</span>
                                            <span className="m-day">{day}</span>
                                        </div>
                                        <div className="maintenance-info">
                                            <span className="m-vehicle">{vehicle.model}</span>
                                            <span className="m-desc">Mantenimiento General</span>
                                        </div>
                                        <span className="m-urgency urgent">Urgente</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rr-empty">
                                <p>No hay mantenimientos próximos.</p>
                            </div>
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
