import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Filter,
    PieChart as PieChartIcon,
    Plus,
    AlertTriangle,
    X,
    Save,
    Loader
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { expenseService } from '../services/expenseService';
import { vehicleService } from '../services/vehicleService';

const COLORS = ['#06bcf9', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FinanceCard = ({ title, value, icon: Icon, isNegative }) => (
    <div className="glass-card finance-card">
        <div className="finance-card-info">
            <span className="finance-card-title">{title}</span>
            <h2 className="finance-card-value">${value.toLocaleString()}</h2>
        </div>
        <div className="finance-card-icon" style={{ color: isNegative ? '#ef4444' : '#10b981' }}>
            <Icon size={24} />
        </div>
    </div>
);

/* ── Add Expense Modal ── */
const AddExpenseModal = ({ isOpen, onClose, onSaved, vehicles }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'maintenance',
        expense_date: new Date().toISOString().split('T')[0],
        vehicle_id: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await expenseService.create({
                ...formData,
                vehicle_id: formData.vehicle_id || null
            });
            onSaved();
            onClose();
            setFormData({
                description: '',
                amount: '',
                category: 'maintenance',
                expense_date: new Date().toISOString().split('T')[0],
                vehicle_id: ''
            });
        } catch (err) {
            alert('Error al crear gasto: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <div className="modal-header">
                    <h2>Registrar Nuevo Gasto</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Descripción</label>
                        <input type="text" className="input-field" placeholder="Cambio de aceite..." required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Monto ($)</label>
                            <input type="number" className="input-field" placeholder="150" required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Categoría</label>
                            <select className="input-field"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="maintenance">Mantenimiento</option>
                                <option value="insurance">Seguros</option>
                                <option value="fuel">Combustible</option>
                                <option value="cleaning">Limpieza</option>
                                <option value="taxes">Impuestos</option>
                                <option value="other">Otros</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha</label>
                            <input type="date" className="input-field"
                                value={formData.expense_date}
                                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Vehículo (Opcional)</label>
                            <select className="input-field"
                                value={formData.vehicle_id}
                                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                            >
                                <option value="">Sin vehículo</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.model} ({v.license_plate})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{loading ? 'Guardando...' : 'Guardar Gasto'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CATEGORY_LABELS = {
    maintenance: 'Mantenimiento',
    insurance: 'Seguros',
    fuel: 'Combustible',
    cleaning: 'Limpieza',
    taxes: 'Impuestos',
    other: 'Otros'
};

const Finances = () => {
    const [data, setData] = useState({
        income: 0,
        expenses: 0,
        net: 0,
        pending: 0,
        recentExpenses: []
    });
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    useEffect(() => {
        loadFinanceData();
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            const data = await vehicleService.getAll();
            setVehicles(data);
        } catch (err) {
            console.error('Error loading vehicles:', err);
        }
    };

    const loadFinanceData = async () => {
        try {
            setLoading(true);
            const [summary, recent, monthly, categories] = await Promise.all([
                expenseService.getSummary(),
                expenseService.getAll(),
                expenseService.getMonthlyData(),
                expenseService.getCategoryBreakdown()
            ]);

            setData({
                income: summary.totalIncome,
                expenses: summary.totalExpenses,
                net: summary.netProfit,
                pending: summary.pendingPayments,
                recentExpenses: recent || []
            });

            setMonthlyData(monthly);

            // Translate category keys to Spanish labels
            const translatedCategories = categories.map(c => ({
                name: CATEGORY_LABELS[c.name] || c.name,
                value: c.value
            }));
            setCategoryData(translatedCategories);
        } catch (err) {
            console.error('Error loading finance data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!data.recentExpenses || data.recentExpenses.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const headers = ['Fecha', 'Categoría', 'Descripción', 'Vehículo', 'Monto'];
        const csvRows = [headers.join(',')];

        data.recentExpenses.forEach(exp => {
            const row = [
                new Date(exp.expense_date).toLocaleDateString(),
                CATEGORY_LABELS[exp.category] || exp.category,
                `"${exp.description}"`,
                `"${exp.vehicles?.model || 'N/A'}"`,
                exp.amount
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_finanzas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="page-content finances">
            <header className="finances-header">
                <div>
                    <h1 className="page-title">Finanzas y Analítica</h1>
                    <p className="page-subtitle">Realiza un seguimiento de tus ingresos, gastos y márgenes de beneficio.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => setIsExpenseModalOpen(true)}>
                        <Plus size={18} />
                        <span>Nuevo Gasto</span>
                    </button>
                    <button className="btn-primary" onClick={handleExportCSV}>
                        <Download size={18} />
                        <span>Exportar Reporte</span>
                    </button>
                </div>
            </header>

            <div className="finance-grid">
                <FinanceCard title="Ingresos Totales" value={data.income} icon={DollarSign} />
                <FinanceCard title="Gastos Totales" value={data.expenses} icon={ArrowDownRight} isNegative />
                <FinanceCard title="Ganancia Neta" value={data.net} icon={ArrowUpRight} />
                <FinanceCard title="Pagos Pendientes" value={data.pending} icon={PieChartIcon} />
            </div>

            <div className="finances-charts">
                <div className="glass-card main-chart-container">
                    <div className="chart-header">
                        <h3>Ingresos vs Gastos</h3>
                        <div className="chart-legend">
                            <span className="legend-item income">Ingresos</span>
                            <span className="legend-item expense">Gastos</span>
                        </div>
                    </div>
                    <div className="chart-body" style={{ height: '350px' }}>
                        {monthlyData.length > 0 && monthlyData.some(m => m.income > 0 || m.expenses > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06bcf9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06bcf9" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" fontSize={12} axisLine={false} tickLine={false} stroke="#94a3b8" />
                                    <YAxis fontSize={12} axisLine={false} tickLine={false} stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ background: '#101620', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="income" name="Ingresos" stroke="#06bcf9" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                <p>No hay datos suficientes para mostrar el gráfico. Crea rentas y gastos para ver las estadísticas.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card pie-chart-container">
                    <div className="chart-header">
                        <h3>Gastos por Categoría</h3>
                    </div>
                    <div className="chart-body" style={{ height: '350px' }}>
                        {categoryData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="70%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: '#101620', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pie-legend">
                                    {categoryData.map((item, index) => (
                                        <div key={item.name} className="pie-legend-item">
                                            <span className="dot" style={{ background: COLORS[index % COLORS.length] }}></span>
                                            <span className="label">{item.name}</span>
                                            <span className="value">${item.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                <p>No hay gastos registrados.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-card expense-list">
                <div className="card-header">
                    <h3>Gastos Recientes</h3>
                    <button
                        className="btn-subtle"
                        onClick={loadFinanceData}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {loading ? <Loader className="animate-spin" size={16} /> : null}
                        {loading ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>
                <div className="finance-table-container">
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción</th>
                                <th>Vehículo</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentExpenses.length > 0 ? (
                                data.recentExpenses.map(expense => (
                                    <tr key={expense.id}>
                                        <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                                        <td>{expense.description.replace(/^Mantenimiento:\s*[^-]*-\s*/i, '').replace(/^Mantenimiento:\s*/i, '')}</td>
                                        <td>{expense.vehicles?.model || 'N/A'}</td>
                                        <td className="amount-neg">-${parseFloat(expense.amount).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No hay gastos registrados aún.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSaved={loadFinanceData}
                vehicles={vehicles}
            />
        </div>
    );
};

export default Finances;
