import React, { useState } from 'react';
import { FileText, Car, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';
import VehicleProfitabilityReport from './reports/VehicleProfitabilityReport';

const Reports = () => {
    // State to determine which report to show: null (hub) or 'profitability'
    const [selectedReport, setSelectedReport] = useState(null);

    const availableReports = [
        {
            id: 'profitability',
            title: 'Rentabilidad por Vehículo',
            description: 'Conoce qué vehículos generan más ganancias netas descontando sus gastos de mantenimiento.',
            icon: <Car size={24} style={{ color: '#06bcf9' }} />,
            bgColor: 'rgba(6, 188, 249, 0.1)',
            borderColor: 'rgba(6, 188, 249, 0.2)'
        },
        {
            id: 'pending_contracts',
            title: 'Contratos por Firmar',
            description: 'Próximamente: Historial y generación de contratos PDF firmados y pendientes.',
            icon: <FileText size={24} style={{ color: '#94a3b8' }} />,
            bgColor: 'rgba(148, 163, 184, 0.05)',
            borderColor: 'rgba(148, 163, 184, 0.1)',
            comingSoon: true
        },
        {
            id: 'licenses',
            title: 'Vencimiento de Licencias',
            description: 'Próximamente: Reporte de clientes con licencias de conducir próximas a vencer.',
            icon: <ShieldCheck size={24} style={{ color: '#94a3b8' }} />,
            bgColor: 'rgba(148, 163, 184, 0.05)',
            borderColor: 'rgba(148, 163, 184, 0.1)',
            comingSoon: true
        }
    ];

    if (selectedReport === 'profitability') {
        return (
            <div className="page-content reports">
                <VehicleProfitabilityReport onBack={() => setSelectedReport(null)} />
            </div>
        );
    }

    return (
        <div className="page-content reports">
            <header className="page-header" style={{ marginBottom: '32px' }}>
                <h1 className="page-title">Centro de Reportes</h1>
                <p className="page-subtitle">Accede a métricas avanzadas y documentación de tu flota.</p>
            </header>

            <div className="finance-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {availableReports.map(report => (
                    <div
                        key={report.id}
                        className="glass-card report-card"
                        onClick={() => !report.comingSoon && setSelectedReport(report.id)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '24px',
                            cursor: report.comingSoon ? 'default' : 'pointer',
                            opacity: report.comingSoon ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            border: `1px solid ${report.borderColor}`,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            if (!report.comingSoon) {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!report.comingSoon) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '14px',
                                background: report.bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {report.icon}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{report.title}</h3>
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5, margin: 0, flex: 1 }}>
                            {report.description}
                        </p>

                        <div style={{
                            marginTop: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            paddingTop: '18px'
                        }}>
                            {report.comingSoon ? (
                                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 600 }}>Próximamente</span>
                            ) : (
                                <>
                                    <span style={{ color: '#06bcf9', fontSize: '14px', fontWeight: 500 }}>Ver Reporte</span>
                                    <ArrowRight size={16} color="#06bcf9" />
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
