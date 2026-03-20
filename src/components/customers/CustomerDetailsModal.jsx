import React from 'react';
import { X, User, Phone, Mail, Calendar, Car, DollarSign, Clock } from 'lucide-react';
import { useCustomerRentals } from '../../hooks/useCustomers';

const CustomerDetailsModal = ({ isOpen, onClose, customer }) => {
    const { data: rentals, isLoading, error } = useCustomerRentals(customer?.id);

    if (!isOpen || !customer) return null;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="status-badge active border border-green-500/30 text-green-400 bg-green-500/10 px-2 py-1 rounded-full text-xs">Activa</span>;
            case 'completed':
                return <span className="status-badge completed border border-blue-500/30 text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full text-xs">Completada</span>;
            case 'cancelled':
                return <span className="status-badge cancelled border border-red-500/30 text-red-400 bg-red-500/10 px-2 py-1 rounded-full text-xs">Cancelada</span>;
            case 'reserved':
                return <span className="status-badge reserved border border-orange-500/30 text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full text-xs">Reservada</span>;
            default:
                return <span className="status-badge border border-gray-500/30 text-gray-400 bg-gray-500/10 px-2 py-1 rounded-full text-xs">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-content glass-card large animate-scale-in" style={{ maxWidth: '800px', width: '90%' }}>
                <div className="modal-header flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <User className="text-primary" />
                        Historial de Cliente
                    </h2>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                <div className="customer-info-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="info-item">
                        <span className="text-xs text-muted block mb-1 uppercase tracking-wider">Nombre Completo</span>
                        <div className="font-semibold text-white">{customer.full_name}</div>
                    </div>
                    <div className="info-item">
                        <span className="text-xs text-muted block mb-1 uppercase tracking-wider">Identificación</span>
                        <div className="font-semibold text-white">{customer.id_number}</div>
                    </div>
                    <div className="info-item">
                        <span className="text-xs text-muted block mb-1 uppercase tracking-wider">Contacto</span>
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 text-sm text-gray-300"><Phone size={12} /> {customer.phone || 'N/A'}</span>
                            <span className="flex items-center gap-1 text-sm text-gray-300"><Mail size={12} /> {customer.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="rental-history">
                    <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2 border-b border-white/10 pb-2">
                        <Clock size={18} className="text-primary" />
                        Rentas Registradas
                    </h3>

                    {isLoading ? (
                        <div className="p-8 text-center text-muted">Cargando historial...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-400">Error al cargar rentas: {error.message}</div>
                    ) : !rentals || rentals.length === 0 ? (
                        <div className="p-10 text-center text-muted border border-dashed border-white/10 rounded-xl">
                            Este cliente no tiene rentas registradas aún.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-white/10">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted">
                                    <tr>
                                        <th className="p-4 rounded-tl-xl border-b border-white/10">Vehículo</th>
                                        <th className="p-4 border-b border-white/10">Salida</th>
                                        <th className="p-4 border-b border-white/10">Regreso</th>
                                        <th className="p-4 border-b border-white/10">Monto</th>
                                        <th className="p-4 rounded-tr-xl border-b border-white/10">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {rentals.map((rental) => (
                                        <tr key={rental.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-white">
                                                <div className="flex items-center gap-2">
                                                    <Car size={14} className="text-gray-400" />
                                                    {rental.vehicles?.model || 'Desconocido'}
                                                </div>
                                                <div className="text-xs text-muted ml-6">{rental.vehicles?.license_plate || 'N/A'}</div>
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                <div className="flex items-center gap-1"><Calendar size={12}/> {formatDate(rental.start_date)}</div>
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                <div className="flex items-center gap-1"><Calendar size={12}/> {formatDate(rental.end_date)}</div>
                                            </td>
                                            <td className="p-4 text-white font-medium">
                                                ${parseFloat(rental.total_amount || 0).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(rental.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsModal;
