import React, { useState } from 'react';
import { FileText, Car, ArrowRight, ShieldCheck, PieChart, BarChart3, TrendingUp } from 'lucide-react';
import VehicleProfitabilityReport from '../components/reports/VehicleProfitabilityReport';

const Reports = () => {
    const [selectedReport, setSelectedReport] = useState(null);

    const availableReports = [
        {
            id: 'profitability',
            title: 'Rentabilidad por Vehículo',
            description: 'Conoce qué vehículos generan más ganancias netas descontando sus gastos de mantenimiento.',
            icon: <TrendingUp size={24} />,
            color: '#06bcf9',
            badge: 'Financiero'
        },
        {
            id: 'pending_contracts',
            title: 'Contratos y Documentación',
            description: 'Historial y generación de contratos PDF. Gestión de firmas digitales y archivos.',
            icon: <FileText size={24} />,
            color: '#8b5cf6',
            comingSoon: true,
            badge: 'Legal'
        },
        {
            id: 'licenses',
            title: 'Vencimiento de Licencias',
            description: 'Alertas tempranas de clientes con licencias de conducir próximas a vencer.',
            icon: <ShieldCheck size={24} />,
            color: '#f59e0b',
            comingSoon: true,
            badge: 'Operativo'
        },
        {
            id: 'usage',
            title: 'Estadísticas de Uso',
            description: 'Días de renta promedio, clientes recurrentes y picos de demanda estacional.',
            icon: <BarChart3 size={24} />,
            color: '#10b981',
            comingSoon: true,
            badge: 'Análisis'
        }
    ];

    if (selectedReport === 'profitability') {
        return (
            <div className="page-content reports-page">
                <VehicleProfitabilityReport onBack={() => setSelectedReport(null)} />
            </div>
        );
    }

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
