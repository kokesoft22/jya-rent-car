import React from 'react';
import { Loader, ArrowLeft, CalendarRange, Clock, HandCoins, CheckCircle2 } from 'lucide-react';
import { useFutureRevenue } from '../../hooks/useReportsData';
import '../Reports.css';

const FutureRevenueReport = ({ onBack }) => {
    const { data, isLoading, error } = useFutureRevenue();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader className="animate-spin text-primary" size={40} />
                <p className="text-muted">Proyectando ingresos futuros...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-10 text-center error-text">Error al cargar el reporte: {error.message}</div>;
    }

    const { totalProjected, totalAlreadyPaid, pendingToCollect, upcomingRentals } = data || {};

    return (
        <div className="report-detail-view animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button className="btn-icon-subtle" onClick={onBack} title="Volver al Centro de Reportes">
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">Proyección de Ingresos Futuros</h2>
                    <p className="text-muted">Dinero asegurado en rentas activas y reservaciones por venir.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, rgba(6,188,249,0.1) 0%, rgba(16,22,32,1) 100%)' }}>
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-muted text-sm">Valor Total Proyectado</span>
                            <CalendarRange size={18} className="text-primary opacity-80" />
                        </div>
                        <h3 className="text-3xl font-bold text-white">${totalProjected?.toLocaleString()}</h3>
                    </div>
                    <span className="text-xs text-muted block mt-4 border-t border-white/5 pt-2">Suma de todos los contratos vigentes/futuros</span>
                </div>
                
                <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-muted text-sm">Adelantos Cobrados</span>
                            <CheckCircle2 size={18} className="text-success opacity-80" />
                        </div>
                        <h3 className="text-2xl font-bold text-success">${totalAlreadyPaid?.toLocaleString()}</h3>
                    </div>
                    <span className="text-xs text-muted block mt-4 border-t border-white/5 pt-2">Dinero que ya está en caja</span>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-muted text-sm">Pendiente por Recibir</span>
                            <HandCoins size={18} className="text-warning opacity-80" />
                        </div>
                        <h3 className="text-2xl font-bold text-warning">${pendingToCollect?.toLocaleString()}</h3>
                    </div>
                    <span className="text-xs text-muted block mt-4 border-t border-white/5 pt-2">El cliente deberá pagar al entregar</span>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center gap-2">
                    <Clock size={18} className="text-primary"/> 
                    <h3 className="text-lg font-bold text-white">Cronograma de Reservas</h3>
                </div>
                <div className="table-wrapper">
                    <table className="custom-table w-full">
                        <thead>
                            <tr>
                                <th className="hidden sm:table-cell">Fecha Inicio</th>
                                <th className="hidden sm:table-cell">Fecha Fin</th>
                                <th>Vehículo</th>
                                <th className="text-right">Monto Total</th>
                                <th className="text-right">Estado del Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcomingRentals && upcomingRentals.length > 0 ? (
                                upcomingRentals.map(r => {
                                    const total = parseFloat(r.total_amount || 0);
                                    const paid = parseFloat(r.amount_paid || 0);
                                    const isFullyPaid = paid >= total;
                                    
                                    return (
                                        <tr key={r.id}>
                                            <td className="font-medium text-white hidden sm:table-cell">
                                                {new Date(r.start_date).toLocaleDateString()}
                                            </td>
                                            <td className="text-muted hidden sm:table-cell">
                                                {new Date(r.end_date).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <span className="font-medium block sm:inline">{r.vehicles?.model}</span>
                                                <span className="text-[10px] text-muted sm:hidden block mt-0.5">
                                                    {new Date(r.start_date).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="text-right font-bold text-primary">
                                                ${total.toLocaleString()}
                                            </td>
                                            <td className="text-right">
                                                {isFullyPaid ? (
                                                    <span className="badge badge-active border-success/20 text-success whitespace-nowrap">
                                                        <span className="hidden sm:inline">Pago Completo</span>
                                                        <span className="sm:hidden">Completo</span>
                                                    </span>
                                                ) : paid > 0 ? (
                                                    <span className="text-warning text-[11px] sm:text-sm font-medium whitespace-nowrap">
                                                        <span className="hidden sm:inline">Adelanto: </span>${paid.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-danger text-[11px] sm:text-sm font-medium whitespace-nowrap">
                                                        <span className="hidden sm:inline">Pendiente de pago</span>
                                                        <span className="sm:hidden">Pendiente</span>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-20 text-muted">
                                        No hay rentas o reservaciones futuras programadas en el sistema.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FutureRevenueReport;
