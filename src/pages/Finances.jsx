import React, { useState } from 'react';
import { 
    DollarSign, 
    TrendingUp, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    PlusCircle, 
    Download, 
    Search, 
    Filter,
    Table as TableIcon,
    PieChart as PieIcon,
    Calendar,
    ChevronRight,
    Trash2
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { useFinances, useDeleteExpense } from '../hooks/useFinances';
import { useVehicles } from '../hooks/useVehicles';
import AddExpenseModal from '../components/finances/AddExpenseModal';
import '../components/Finances.css';
import { getLocalTodayDate } from '../utils/dateUtils';

const RADIAN = Math.PI / 180;
const COLORS = ['#06bcf9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1'];
const CATEGORY_TRANSLATIONS = {
    maintenance: 'Mantenimiento',
    insurance: 'Seguros',
    fuel: 'Combustibles',
    cleaning: 'Limpieza',
    taxes: 'Impuestos',
    other: 'Otros'
};

const renderCombinedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    // Inner percentage label
    const innerRadius2 = innerRadius + (outerRadius - innerRadius) * 0.5;
    const ix = cx + innerRadius2 * Math.cos(-midAngle * RADIAN);
    const iy = cy + innerRadius2 * Math.sin(-midAngle * RADIAN);

    // Outer dollar label
    const outerR = outerRadius + 25;
    const ox = cx + outerR * Math.cos(-midAngle * RADIAN);
    const oy = cy + outerR * Math.sin(-midAngle * RADIAN);

    return (
        <g>
            {percent > 0.05 && (
                <text x={ix} y={iy} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12">
                    {`${(percent * 100).toFixed(0)}%`}
                </text>
            )}
            <text x={ox} y={oy} fill="#cbd5e1" textAnchor={ox > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="11" fontWeight="600">
                {`$${value.toLocaleString()}`}
            </text>
        </g>
    );
};

const FinanceCard = ({ title, amount, icon: Icon, trend, color, label }) => (
    <div className="glass-card finance-stat-card">
        <div className="f-card-header">
            <div className="f-icon" style={{ backgroundColor: `${color}15`, color: color }}>
                <Icon size={22} />
            </div>
            {trend && <span className={`f-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
            </span>}
        </div>
        <div className="f-card-body">
            <span className="f-label">{label}</span>
            <h2 className="f-amount">${amount.toLocaleString()}</h2>
            <span className="f-title">{title}</span>
        </div>
    </div>
);

const Finances = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const { data: financesData, isLoading, error } = useFinances();
    const { data: vehicles } = useVehicles();
    const deleteExpenseMutation = useDeleteExpense();

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
            await deleteExpenseMutation.mutateAsync(id);
        }
    };

    if (isLoading) return <div className="page-content center">Cargando finanzas...</div>;
    if (error) return <div className="page-content center error-text">Error: {error.message}</div>;

    const { summary, recentExpenses, monthlyData, categoryData: rawCategoryData } = financesData;

    const categoryData = rawCategoryData.map(item => ({
        ...item,
        name: CATEGORY_TRANSLATIONS[item.name.toLowerCase()] || item.name
    }));

    const filteredExpenses = recentExpenses.filter(exp => {
        const translatedCategory = CATEGORY_TRANSLATIONS[exp.category.toLowerCase()] || exp.category;
        return exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
               translatedCategory.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const exportToCSV = () => {
        const headers = ['Fecha', 'Descripción', 'Categoría', 'Vehículo', 'Monto'];
        const rows = recentExpenses.map(exp => [
            new Date(exp.expense_date).toLocaleDateString(),
            exp.description,
            CATEGORY_TRANSLATIONS[exp.category.toLowerCase()] || exp.category,
            exp.vehicles?.model || 'N/A',
            exp.amount
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_finanzas_${getLocalTodayDate()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="page-content finances">
            <div className="welcome-section">
                <div>
                    <h1 className="welcome-text">Resumen Financiero</h1>
                    <p className="text-secondary mt-1">Control total de ingresos, gastos y rentabilidad de tu Rent Car.</p>
                </div>
                <div className="action-buttons">
                    <button onClick={exportToCSV} className="btn-secondary">
                        <Download size={18} />
                        <span>Exportar Reporte</span>
                    </button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary">
                        <PlusCircle size={18} />
                        <span>Registrar Gasto</span>
                    </button>
                </div>
            </div>

            <div className="finance-stats-grid">
                <FinanceCard title="Ingresos Totales" amount={summary.income} icon={ArrowUpCircle} label="Total Recaudado" color="#10b981" />
                <FinanceCard title="Gastos Operativos" amount={summary.expenses} icon={ArrowDownCircle} label="Total Gastado" color="#ef4444" />
                <FinanceCard title="Utilidad Neta" amount={summary.net} icon={TrendingUp} label="Beneficio Real" color="#8b5cf6" />
                <FinanceCard title="Pagos Pendientes" amount={summary.pending} icon={DollarSign} label="Por Cobrar" color="#f59e0b" />
            </div>

            <div className="charts-grid-finances">
                <div className="glass-card chart-container income-vs-expenses">
                    <div className="chart-header">
                        <div className="title-with-icon">
                            <TrendingUp size={20} className="text-primary" />
                            <h3>Flujo de Caja Mensual</h3>
                        </div>
                    </div>
                    <div className="chart-body" style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 25, right: 50, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06bcf9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06bcf9" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" fontSize={12} stroke="#94a3b8" />
                                <YAxis fontSize={12} stroke="#94a3b8" />
                                <Tooltip 
                                    contentStyle={{ background: '#101620', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="income" name="Ingresos" stroke="#06bcf9" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3}>
                                    <LabelList dataKey="income" position="top" offset={12} formatter={(value) => `$${value.toLocaleString()}`} style={{ fill: '#06bcf9', fontSize: '11px', fontWeight: 700 }} />
                                </Area>
                                <Area type="monotone" dataKey="expense" name="Gastos" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3}>
                                    <LabelList dataKey="expense" position="bottom" offset={12} formatter={(value) => `$${value.toLocaleString()}`} style={{ fill: '#ef4444', fontSize: '11px', fontWeight: 700 }} />
                                </Area>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card chart-container category-breakdown">
                    <div className="chart-header">
                        <div className="title-with-icon">
                            <PieIcon size={20} className="text-secondary" />
                            <h3>Distribución de Gastos</h3>
                        </div>
                    </div>
                    <div className="chart-body" style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="45%"
                                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                    label={renderCombinedLabel}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                contentStyle={{ background: '#101620', border: 'none', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: '#fff' }}
                            />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={50}
                                    content={({ payload }) => (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', justifyContent: 'center', paddingTop: '8px' }}>
                                            {payload.map((entry, index) => (
                                                <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: entry.color, flexShrink: 0 }} />
                                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{entry.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass-card transactions-card">
                <div className="card-header-with-actions">
                    <div className="title-with-icon">
                        <TableIcon size={20} className="text-primary" />
                        <h3>Gastos Recientes</h3>
                    </div>
                    <div className="table-filters">
                        <div className="search-bar">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Buscar gastos..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-icon"><Filter size={18} /></button>
                    </div>
                </div>

                <div className="finances-table-wrapper">
                    <table className="finances-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Vehículo</th>
                                <th>Descripción</th>
                                <th>Categoría</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map((exp) => (
                                    <tr key={exp.id}>
                                        <td>
                                            <div className="flex-cell">
                                                <Calendar size={14} className="text-muted" />
                                                <span>{new Date(exp.expense_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-cell">
                                                {exp.vehicles ? (
                                                    <span className="flex items-center gap-2">
                                                        <ChevronRight size={12} className="text-primary" />
                                                        {exp.vehicles.model}
                                                    </span>
                                                ) : (
                                                    <span className="muted">General</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-cell text-white font-medium">
                                                {(() => {
                                                    if (!exp.description) return '';
                                                    let d = exp.description.replace(/^Mantenimiento:\s*/i, '');
                                                    if (exp.vehicles?.model) {
                                                        const escapedModel = exp.vehicles.model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                        d = d.replace(new RegExp(escapedModel, 'i'), '');
                                                    }
                                                    return d.replace(/^[\-\s\:]+/, '').trim();
                                                })()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-cell">
                                                <span className={`category-badge ${exp.category}`}>
                                                    {CATEGORY_TRANSLATIONS[exp.category.toLowerCase()] || exp.category}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-cell font-bold" style={{ color: '#ef4444' }}>
                                                -${parseFloat(exp.amount).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-cell">
                                                <span className="status-badge paid">Pagado</span>
                                            </div>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn-delete-small"
                                                onClick={() => handleDelete(exp.id)}
                                                title="Eliminar registro"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="empty-state">No se encontraron gastos.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddExpenseModal 
                isOpen={isExpenseModalOpen} 
                onClose={() => setIsExpenseModalOpen(false)} 
                vehicles={vehicles}
            />
        </div>
    );
};

export default Finances;
