import React from 'react';
import { Loader, ArrowLeft, CalendarDays, Key, Car } from 'lucide-react';
import { useFleetUtilization } from '../../hooks/useReportsData';
import '../Reports.css';

const FleetUtilizationReport = ({ onBack }) => {
    const { data, isLoading, error } = useFleetUtilization();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader className="animate-spin text-primary" size={40} />
                <p className="text-muted">Analizando ocupación de la flota...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-10 text-center error-text">Error al cargar el reporte: {error.message}</div>;
    }

    // Calcular promedios globales
    const totalVehicles = data?.length || 0;
    const totalRentedDays = data?.reduce((sum, v) => sum + v.rentedDays, 0) || 0;
    const totalAvailableDays = data?.reduce((sum, v) => sum + v.availableDays, 0) || 0;
    const totalDaysPotential = totalRentedDays + totalAvailableDays;
    
    const globalRate = totalDaysPotential > 0 ? Math.round((totalRentedDays / totalDaysPotential) * 100) : 0;

    const today = new Date();
    const currentMonth = today.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    return (
        <div className="report-detail-view animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button className="btn-icon-subtle" onClick={onBack} title="Volver al Centro de Reportes">
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">Tasa de Ocupación de Vehículos</h2>
                    <p className="text-muted">Análisis de uso vs disponibilidad en el mes de {currentMonth}.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 border-l-4 border-primary">
                    <span className="text-muted text-sm block mb-1">Ocupación Global</span>
                    <h3 className="text-3xl font-bold text-white">
                        {globalRate}%
                    </h3>
                    <span className="text-xs text-muted block mt-2">Promedio de toda la flota este mes</span>
                </div>
                
                <div className="glass-card p-6 border-l-4 border-success">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-muted text-sm">Días Rentados</span>
                        <Key size={16} className="text-success opacity-80" />
                    </div>
                    <h3 className="text-2xl font-bold text-success mt-1">{totalRentedDays}</h3>
                    <span className="text-xs text-muted block mt-2">Suma de días facturados</span>
                </div>

                <div className="glass-card p-6 border-l-4 border-warning">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-muted text-sm">Días Inactivos</span>
                        <CalendarDays size={16} className="text-warning opacity-80" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mt-1">{totalAvailableDays}</h3>
                    <span className="text-xs text-muted block mt-2">Suma de días estacionados / libres</span>
                </div>
            </div>

            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-6">Detalle por Vehículo</h3>
                
                <div className="space-y-6">
                    {data && data.length > 0 ? (
                        data.map((v, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <Car size={16} className="text-muted" />
                                        <span className="font-medium text-white">{v.vehicle}</span>
                                    </div>
                                    <span className="text-sm font-bold">{v.rate}%</span>
                                </div>
                                
                                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex">
                                    <div 
                                        className="h-full bg-primary" 
                                        style={{ width: `${v.rate}%`, transition: 'width 1s ease-in-out' }}
                                        title={`${v.rentedDays} días rentado`}
                                    ></div>
                                    <div 
                                        className="h-full bg-transparent" 
                                        style={{ width: `${100 - v.rate}%` }}
                                        title={`${v.availableDays} días libre`}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted px-1">
                                    <span>{v.rentedDays} días ocupado</span>
                                    <span>{v.availableDays} días libre</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted">
                            No hay vehículos registrados para analizar.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FleetUtilizationReport;
