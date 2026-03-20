import React from 'react';
import { Loader, ArrowLeft, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { useCollectionEfficiency } from '../../hooks/useReportsData';
import '../Reports.css';

const CollectionEfficiencyReport = ({ onBack }) => {
    const { data, isLoading, error } = useCollectionEfficiency();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader className="animate-spin text-primary" size={40} />
                <p className="text-muted">Calculando efectividad de cobros...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-10 text-center error-text">Error al cargar el reporte: {error.message}</div>;
    }

    // Calcular promedios
    const totalBilled = data?.reduce((sum, item) => sum + item.facturado, 0) || 0;
    const totalCollected = data?.reduce((sum, item) => sum + item.cobrado, 0) || 0;
    const avgEfficiency = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    return (
        <div className="report-detail-view animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button className="btn-icon-subtle" onClick={onBack} title="Volver al Centro de Reportes">
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">Facturado vs. Cobrado</h2>
                    <p className="text-muted">Análisis de efectividad en la recolección de pagos en los últimos 6 meses.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                            <Target size={24} />
                        </div>
                    </div>
                    <span className="text-muted text-sm block mb-1">Efectividad Total (6 meses)</span>
                    <h3 className="text-3xl font-bold text-white">
                        {avgEfficiency}%
                    </h3>
                    <span className="text-xs text-primary mt-2 flex items-center gap-1">
                        <TrendingUp size={14} /> Meta recomendada: &gt; 90%
                    </span>
                </div>
                
                <div className="glass-card p-6">
                    <span className="text-muted text-sm block mb-1">Monto Total Facturado</span>
                    <h3 className="text-2xl font-bold text-white mt-2">${totalBilled.toLocaleString()}</h3>
                    <span className="text-xs text-muted block mt-2">Valor de todos los contratos</span>
                </div>

                <div className="glass-card p-6">
                    <span className="text-muted text-sm block mb-1">Dinero Total Recaudado</span>
                    <h3 className="text-2xl font-bold text-success mt-2">${totalCollected.toLocaleString()}</h3>
                    <span className="text-xs text-muted block mt-2">Pagos reales recibidos</span>
                </div>
            </div>

            <div className="glass-card chart-container p-6">
                <div className="chart-header mb-6">
                    <h3>Flujo de Facturación vs Cobranza</h3>
                </div>
                <div style={{ height: '350px' }}>
                    {data && data.some(d => d.facturado > 0 || d.cobrado > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 30, right: 40, left: 10, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="colorFacturado" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCobrado" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06bcf9" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#06bcf9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ background: '#101620', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    formatter={(value) => `$${value.toLocaleString()}`}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="facturado" name="Monto Facturado (Contratos)" stroke="#94a3b8" fillOpacity={1} fill="url(#colorFacturado)" strokeWidth={2}>
                                    <LabelList 
                                        dataKey="facturado" 
                                        position="top" 
                                        fill="#94a3b8" 
                                        fontSize={12} 
                                        fontWeight="bold"
                                        formatter={(value) => value > 0 ? `$${value.toLocaleString()}` : ''}
                                    />
                                </Area>
                                <Area type="monotone" dataKey="cobrado" name="Monto Cobrado (Real)" stroke="#06bcf9" fillOpacity={1} fill="url(#colorCobrado)" strokeWidth={3}>
                                    <LabelList 
                                        dataKey="cobrado" 
                                        position="bottom" 
                                        fill="#06bcf9" 
                                        fontSize={12} 
                                        fontWeight="bold"
                                        formatter={(value) => value > 0 ? `$${value.toLocaleString()}` : ''}
                                    />
                                </Area>
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted">
                            <AlertCircle size={40} className="mb-4 opacity-50" />
                            <p>No hay datos suficientes en los últimos 6 meses para mostrar la gráfica.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollectionEfficiencyReport;
