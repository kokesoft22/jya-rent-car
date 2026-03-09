import React, { useState, useEffect } from 'react';
import { expenseService } from '../../services/expenseService';
import { Loader, ArrowLeft } from 'lucide-react';

const VehicleProfitabilityReport = ({ onBack }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const profitability = await expenseService.getVehicleProfitability();
            setData(profitability || []);
        } catch (err) {
            console.error('Error loading vehicle profitability:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <Loader className="animate-spin" size={32} color="#06bcf9" />
            </div>
        );
    }

    return (
        <div className="report-detail">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button className="btn-subtle" onClick={onBack} style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Detalle del Reporte</h2>
            </div>

            <div className="glass-card expense-list">
                <div className="card-header" style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Rentabilidad por Vehículo</h3>
                </div>
                <div className="finance-table-container">
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Vehículo</th>
                                <th>Ingresos Totales (Rentas)</th>
                                <th>Gastos Totales (Mantenimiento, etc.)</th>
                                <th>Ganancia Neta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map(v => (
                                    <tr key={v.id}>
                                        <td style={{ fontWeight: 500 }}>{v.model} ({v.license_plate})</td>
                                        <td style={{ color: '#10b981' }}>${v.income.toLocaleString()}</td>
                                        <td style={{ color: '#ef4444' }}>-${v.expenses.toLocaleString()}</td>
                                        <td style={{
                                            color: v.netProfit >= 0 ? '#10b981' : '#ef4444',
                                            fontWeight: 'bold'
                                        }}>
                                            ${v.netProfit.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                                        No hay suficientes datos de transacciones vehiculares aún.
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

export default VehicleProfitabilityReport;
