import React, { useState } from 'react';
import { Loader, ArrowLeft, Search, Phone, FileText, User } from 'lucide-react';
import { useAccountsReceivable } from '../../hooks/useReportsData';
import '../Reports.css';

const AccountsReceivableReport = ({ onBack }) => {
    const { data, isLoading, error } = useAccountsReceivable();
    const [searchTerm, setSearchTerm] = useState('');

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader className="animate-spin text-primary" size={40} />
                <p className="text-muted">Cargando cuentas por cobrar...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-10 text-center error-text">Error al cargar el reporte: {error.message}</div>;
    }

    const totalDebt = data?.reduce((sum, r) => {
        const debt = parseFloat(r.total_amount || 0) - parseFloat(r.amount_paid || 0);
        return sum + debt;
    }, 0) || 0;

    const filteredData = (data || []).filter(r => 
        r.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vehicles?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vehicles?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="report-detail-view animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button className="btn-icon-subtle" onClick={onBack} title="Volver al Centro de Reportes">
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">Cuentas por Cobrar</h2>
                    <p className="text-muted">Listado de rentas con balances pendientes de pago.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
                <div className="glass-card p-6 flex flex-col min-w-[300px]">
                    <span className="text-muted text-sm mb-1">Total Pendiente de Cobro</span>
                    <h3 className="text-3xl font-bold text-danger">${totalDebt.toLocaleString()}</h3>
                    <span className="text-xs text-muted mt-2">Corresponde a {data?.length || 0} rentas activas o finalizadas</span>
                </div>

                <div className="w-full md:w-1/3">
                    <div className="search-bar w-full">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente o vehículo..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="table-wrapper">
                    <table className="custom-table w-full">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Vehículo</th>
                                <th>Fechas</th>
                                <th className="text-right">Monto Total</th>
                                <th className="text-right">Abonado</th>
                                <th className="text-right">Pendiente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData && filteredData.length > 0 ? (
                                filteredData.map(r => {
                                    const total = parseFloat(r.total_amount || 0);
                                    const paid = parseFloat(r.amount_paid || 0);
                                    const debt = total - paid;
                                    
                                    return (
                                        <tr key={r.id}>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white flex items-center gap-2">
                                                        <User size={14} className="text-primary"/> {r.customers?.full_name}
                                                    </span>
                                                    <span className="text-xs text-muted flex items-center gap-2 mt-1">
                                                        <Phone size={12} /> {r.customers?.phone || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-white">{r.vehicles?.model}</span>
                                                    <span className="text-xs text-muted uppercase tracking-wide">{r.vehicles?.license_plate}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-sm">
                                                    {new Date(r.start_date).toLocaleDateString()} - <br/>
                                                    {new Date(r.end_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="text-right font-medium">
                                                ${total.toLocaleString()}
                                            </td>
                                            <td className="text-right text-success font-medium">
                                                ${paid.toLocaleString()}
                                            </td>
                                            <td className="text-right">
                                                <span className="font-bold text-danger bg-danger/10 px-3 py-1 rounded-full">
                                                    ${debt.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-muted">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText size={40} className="opacity-50" />
                                            {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay cuentas por cobrar pendientes. ¡Excelente!'}
                                        </div>
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

export default AccountsReceivableReport;
