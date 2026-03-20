import React from 'react';
import { Loader, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Car } from 'lucide-react';
import { useVehicleProfitability } from '../../hooks/useReports';
import '../Reports.css';

const VehicleProfitabilityReport = ({ onBack }) => {
    const { data, isLoading, error } = useVehicleProfitability();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader className="animate-spin text-primary" size={40} />
                <p className="text-muted">Calculando rentabilidad de la flota...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-10 text-center error-text">Error al cargar el reporte: {error.message}</div>;
    }

    return (
        <div className="report-detail-view animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button className="btn-icon-subtle" onClick={onBack} title="Volver al Centro de Reportes">
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">Rentabilidad por Vehículo</h2>
                    <p className="text-muted">Desglose detallado de ingresos vs gastos operativos.</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="table-wrapper">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Vehículo</th>
                                <th className="text-center">Ingresos (Rentas)</th>
                                <th className="text-center">Gastos (Mantenimiento)</th>
                                <th className="text-center">Ganancia Neta</th>
                                <th className="text-center">Margen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data && data.length > 0 ? (
                                data.map(v => {
                                    const margin = v.income > 0 ? ((v.netProfit / v.income) * 100).toFixed(1) : '0.0';
                                    const isProfitable = v.netProfit >= 0;
                                    
                                    return (
                                        <tr key={v.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                        <Car size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{v.model}</div>
                                                        <div className="text-xs muted uppercase tracking-wider">{v.license_plate}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center font-bold text-success">
                                                ${v.income.toLocaleString()}
                                            </td>
                                            <td className="text-center font-bold text-danger">
                                                -${v.expenses.toLocaleString()}
                                            </td>
                                            <td className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-bold ${isProfitable ? 'text-success' : 'text-danger'}`}>
                                                        ${v.netProfit.toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 mt-1 opacity-70">
                                                        {isProfitable ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                        {isProfitable ? 'Ganancia' : 'Pérdida'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge ${parseFloat(margin) > 0 ? 'badge-active' : 'badge-subtle'}`}>
                                                    {margin}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-20 text-muted">
                                        No hay suficientes datos de transacciones vehiculares aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex flex-col gap-2">
                    <span className="text-xs muted uppercase font-bold">Vehículo Top</span>
                    <span className="text-xl font-bold text-white">{data?.[0]?.model || 'N/A'}</span>
                    <span className="text-xs text-success flex items-center gap-1"><TrendingUp size={14}/> Mayor rentabilidad</span>
                </div>
                {/* Potentially more summary cards here */}
            </div>
        </div>
    );
};

export default VehicleProfitabilityReport;
