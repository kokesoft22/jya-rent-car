import React, { useState } from 'react';
import { FileText, Car, ArrowRight, ShieldCheck, PieChart, BarChart3, TrendingUp } from 'lucide-react';
import VehicleProfitabilityReport from '../components/reports/VehicleProfitabilityReport';
import CollectionEfficiencyReport from '../components/reports/CollectionEfficiencyReport';
import AccountsReceivableReport from '../components/reports/AccountsReceivableReport';
import FleetUtilizationReport from '../components/reports/FleetUtilizationReport';
import FutureRevenueReport from '../components/reports/FutureRevenueReport';
const Reports = () => {
    const [selectedReport, setSelectedReport] = useState(null);

    const availableReports = [
        {
            id: 'collection_efficiency',
            title: 'Facturado vs. Cobrado',
            description: 'Mide la efectividad de cobro comparando contratos cerrados frente al flujo de caja real.',
            icon: <PieChart size={24} />,
            color: '#10b981',
            badge: 'Finanzas'
        },
        {
            id: 'accounts_receivable',
            title: 'Cuentas por Cobrar',
            description: 'Listado de clientes con balances pendientes. Vital para seguimiento y recuperación de efectivo.',
            icon: <FileText size={24} />,
            color: '#ef4444',
            badge: 'Cobranza'
        },
        {
            id: 'profitability',
            title: 'Rentabilidad por Vehículo',
            description: 'Conoce qué vehículos generan más ganancias netas descontando sus gastos de mantenimiento.',
            icon: <TrendingUp size={24} />,
            color: '#06bcf9',
            badge: 'Análisis'
        },
        {
            id: 'fleet_utilization',
            title: 'Tasa de Ocupación',
            description: 'Mide cuántos días del mes han estado rentados tus vehículos frente a los días que han estado libres.',
            icon: <BarChart3 size={24} />,
            color: '#8b5cf6',
            badge: 'Operativo'
        },
        {
            id: 'future_revenue',
            title: 'Proyección de Ingresos',
            description: 'Visualiza el dinero asegurado gracias a las reservaciones y rentas que se completarán a futuro.',
            icon: <ShieldCheck size={24} />,
            color: '#f59e0b',
            badge: 'Proyección'
        }
    ];

    if (selectedReport === 'profitability') return <div className="page-content reports-page"><VehicleProfitabilityReport onBack={() => setSelectedReport(null)} /></div>;
    if (selectedReport === 'collection_efficiency') return <div className="page-content reports-page"><CollectionEfficiencyReport onBack={() => setSelectedReport(null)} /></div>;
    if (selectedReport === 'accounts_receivable') return <div className="page-content reports-page"><AccountsReceivableReport onBack={() => setSelectedReport(null)} /></div>;
    if (selectedReport === 'fleet_utilization') return <div className="page-content reports-page"><FleetUtilizationReport onBack={() => setSelectedReport(null)} /></div>;
    if (selectedReport === 'future_revenue') return <div className="page-content reports-page"><FutureRevenueReport onBack={() => setSelectedReport(null)} /></div>;

    return (
        <div className="page-content reports-page animate-fade-in">
            <header className="page-header">
                <div className="header-info">
                    <h1 className="page-title text-3xl font-bold text-white mb-2">Centro de Análisis y Reportes</h1>
                    <p className="page-subtitle text-muted max-w-2xl">
                        Métricas avanzadas para la toma de decisiones estratégicas. Visualiza el rendimiento de tu flota de un vistazo.
                    </p>
                </div>
            </header>

            <div className="reports-grid mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableReports.map(report => (
                    <div
                        key={report.id}
                        className={`glass-card report-hub-card ${report.comingSoon ? 'opacity-60 grayscale-[0.5]' : 'cursor-pointer hover-lift'}`}
                        onClick={() => !report.comingSoon && setSelectedReport(report.id)}
                    >
                        <div className="report-card-badge">{report.badge}</div>
                        <div className="report-icon-container" style={{ backgroundColor: `${report.color}15`, color: report.color }}>
                            {report.icon}
                        </div>
                        <div className="report-card-content">
                            <h3 className="text-lg font-bold text-white mb-2">{report.title}</h3>
                            <p className="text-sm text-muted mb-6 leading-relaxed">
                                {report.description}
                            </p>
                        </div>
                        <div className="report-card-footer border-t border-white/5 pt-4 flex items-center justify-between">
                            {report.comingSoon ? (
                                <span className="text-[10px] uppercase font-bold tracking-widest text-muted">Próximamente</span>
                            ) : (
                                <>
                                    <span className="text-sm font-semibold" style={{ color: report.color }}>Explorar Reporte</span>
                                    <ArrowRight size={18} style={{ color: report.color }} />
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reports;
