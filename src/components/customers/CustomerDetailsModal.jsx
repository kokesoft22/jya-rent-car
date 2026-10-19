import React, { useState } from 'react';
import { X, User, Phone, Mail, Calendar, Car, DollarSign, Clock, ShieldAlert, Image, ExternalLink, ZoomIn } from 'lucide-react';
import { useCustomerRentals } from '../../hooks/useCustomers';
import { getDaysDiff } from '../../utils/dateUtils';

const CustomerDetailsModal = ({ isOpen, onClose, customer }) => {
    const { data: rentals, isLoading, error } = useCustomerRentals(customer?.id);
    const [lightboxImage, setLightboxImage] = useState(null);

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
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
        }
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <>
            <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="modal-content glass-card large animate-scale-in" style={{ maxWidth: '850px', width: '92%' }}>
                    <div className="modal-header flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User className="text-primary" />
                            Historial y Datos del Cliente
                        </h2>
                        <button onClick={onClose} className="btn-icon">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="customer-info-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-white/5 p-4 rounded-xl border border-white/10">
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

                    {/* Sección del Documento de Identificación */}
                    <div className="customer-document-section mb-6">
                        <div className="document-section-header">
                            <span className="section-title">
                                <Image size={16} /> Documento de Identificación Adjunto
                            </span>
                            {customer.id_document_url && (
                                <a 
                                    href={customer.id_document_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="document-open-btn"
                                >
                                    Abrir en pestaña nueva <ExternalLink size={13} />
                                </a>
                            )}
                        </div>

                        {customer.id_document_url ? (
                            <div 
                                className="document-thumbnail-card"
                                onClick={() => setLightboxImage(customer.id_document_url)}
                            >
                                <img 
                                    src={customer.id_document_url} 
                                    alt={`Documento de ${customer.full_name}`} 
                                    className="document-thumbnail-img"
                                />
                                <div className="document-thumbnail-overlay">
                                    <ZoomIn size={24} />
                                    <span>Clic para ampliar</span>
                                </div>
                            </div>
                        ) : (
                            <div className="no-document-card">
                                <Image size={24} className="text-muted" />
                                <span>No se ha adjuntado foto de documento de identificación para este cliente.</span>
                            </div>
                        )}
                    </div>

                    {customer.is_blacklisted && (
                        <div className="blacklist-info-card">
                            <div className="blacklist-info-icon">
                                <ShieldAlert size={20} />
                            </div>
                            <div className="blacklist-info-content">
                                <div className="blacklist-info-title">Cliente en Lista Negra</div>
                                <div className="blacklist-info-reason">
                                    "{customer.blacklist_reason || 'Sin motivo especificado'}"
                                </div>
                                {customer.blacklisted_at && (
                                    <div className="blacklist-info-date">
                                        Agregado el {formatDate(customer.blacklisted_at)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                            <div className="history-table-container overflow-x-auto max-h-[350px]">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-muted uppercase text-xs tracking-wider">
                                            <th className="p-3">Vehículo</th>
                                            <th className="p-3">Período</th>
                                            <th className="p-3">Días</th>
                                            <th className="p-3">Total</th>
                                            <th className="p-3">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {rentals.map((rental) => {
                                            const days = getDaysDiff(rental.start_date, rental.end_date) + 1;
                                            return (
                                                <tr key={rental.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-3">
                                                        <div className="font-medium text-white flex items-center gap-2">
                                                            <Car size={16} className="text-primary" />
                                                            {rental.vehicles?.model || 'Vehículo desconocido'}
                                                        </div>
                                                        <div className="text-xs text-muted">
                                                            {rental.vehicles?.license_plate}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-gray-300">
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Calendar size={12} className="text-muted" />
                                                            {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-gray-300">
                                                        {days} {days === 1 ? 'día' : 'días'}
                                                    </td>
                                                    <td className="p-3 font-semibold text-white">
                                                        ${rental.total_amount?.toLocaleString() || 0}
                                                    </td>
                                                    <td className="p-3">
                                                        {getStatusBadge(rental.status)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox / Visor de imagen en pantalla completa */}
            {lightboxImage && (
                <div 
                    className="document-lightbox-overlay"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="document-lightbox-container" onClick={(e) => e.stopPropagation()}>
                        <div className="document-lightbox-header">
                            <span>Documento de Identificación: {customer.full_name}</span>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <a 
                                    href={lightboxImage} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="document-open-btn"
                                >
                                    Ver tamaño completo <ExternalLink size={14} />
                                </a>
                                <button 
                                    className="btn-icon" 
                                    onClick={() => setLightboxImage(null)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <img 
                            src={lightboxImage} 
                            alt={`Documento de ${customer.full_name}`} 
                            className="document-lightbox-img" 
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default CustomerDetailsModal;
