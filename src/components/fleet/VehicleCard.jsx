import React, { useState, useEffect } from 'react';
import { Car, Calendar, AlertTriangle, MoreVertical, Edit2, Trash2, Eye, Clock } from 'lucide-react';
import { rentalService } from '../../services/rentalService';
import { formatDateSafe, getLocalTodayDate, getDaysDiff } from '../../utils/dateUtils';

export const VehicleCard = ({ vehicle, onEdit, onDelete, onView, currentRental }) => {
    const [currentStatus, setCurrentStatus] = useState(vehicle.effectiveStatus || vehicle.status);
    const [activeRental, setActiveRental] = useState(currentRental || null);
    const [nextRental, setNextRental] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const today = getLocalTodayDate();
                const activeRentalData = await rentalService.getActiveRental(vehicle.id, today);
                
                if (activeRentalData) {
                    setCurrentStatus('rented');
                    setActiveRental(activeRentalData);
                    setNextRental(null);
                } else {
                    // Si no hay renta activa para HOY, el vehículo debería estar disponible
                    // a menos que esté en mantenimiento. Esto soluciona problemas de estados desincronizados.
                    const fallbackStatus = vehicle.status === 'rented' ? 'available' : (vehicle.status || 'available');
                    setCurrentStatus(fallbackStatus);
                    setActiveRental(null);
                    const nextR = await rentalService.getNextRental(vehicle.id);
                    setNextRental(nextR);
                }
            } catch (err) {
                console.error('Error checking vehicle status:', err);
            }
        };
        checkStatus();
    }, [vehicle, currentRental, vehicle.effectiveStatus]);

    return (
        <div className="glass-card vehicle-card">
            <div className="vehicle-image">
                <img src={vehicle.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d596a?q=80&w=400'} alt={vehicle.model} />
                <span className={`status-badge ${currentStatus}`}>
                    {currentStatus === 'available' ? 'Disponible' :
                        currentStatus === 'rented' ? 'Rentado' : 'Mantenimiento'}
                </span>
                
                {currentStatus === 'available' && nextRental && (
                    <div className="upcoming-badge" style={{
                        position: 'absolute', bottom: '12px', right: '12px',
                        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.95), rgba(202, 138, 4, 0.95))',
                        color: '#000', padding: '6px 12px', borderRadius: '12px',
                        fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center',
                        gap: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)',
                        textTransform: 'uppercase', letterSpacing: '0.3px', zIndex: 10
                    }}>
                        <Clock size={14} strokeWidth={2.5} />
                        <span>
                            {(() => {
                                const todayStr = getLocalTodayDate();
                                const startStr = nextRental.start_date.split('T')[0];
                                const diffDays = getDaysDiff(todayStr, startStr);
                                
                                if (diffDays === 0) return `Renta Hoy • ${nextRental.customers?.full_name}`;
                                if (diffDays === 1) return `Renta Mañana • ${nextRental.customers?.full_name}`;
                                return `Renta en ${diffDays} días • ${nextRental.customers?.full_name}`;
                            })()}
                        </span>
                    </div>
                )}
            </div>
            <div className="vehicle-info">
                <div className="vehicle-header">
                    <div>
                        <h3>{vehicle.model}</h3>
                        <div className="vehicle-meta">
                            <span className="vehicle-year">{vehicle.year} • {vehicle.license_plate}</span>
                            <span className="vehicle-mileage">
                                <Car size={12} /> {vehicle.mileage?.toLocaleString() || '0'} km
                            </span>
                            {vehicle.last_maintenance && (
                                <span className="vehicle-last-maintenance">
                                    <Calendar size={12} /> Camb. Aceite: {formatDateSafe(vehicle.last_maintenance)}
                                </span>
                            )}
                            {vehicle.insurance_expiry && (() => {
                                const todayStr = getLocalTodayDate();
                                const expiryStr = vehicle.insurance_expiry.split('T')[0];
                                const daysLeft = getDaysDiff(todayStr, expiryStr);

                                const isExpiring = daysLeft <= 10 && daysLeft > 0;
                                const isExpired = daysLeft <= 0;
                                return (
                                    <span className={`vehicle-insurance ${isExpired ? 'expired' : isExpiring ? 'expiring' : ''}`}>
                                        <AlertTriangle size={12} /> Seguro: {isExpired ? '¡Vencido!' : isExpiring ? `¡Vence en ${daysLeft} días!` : formatDateSafe(vehicle.insurance_expiry)}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                    <button className="btn-icon"><MoreVertical size={18} /></button>
                </div>
                <div className="vehicle-footer">
                    <div className="vehicle-rate">
                        <span className="rate-label">Tarifa Diaria</span>
                        <span className="rate-value">${vehicle.daily_rate}</span>
                    </div>
                    <div className="vehicle-actions">
                        <button className="btn-subtle" title="Editar" onClick={() => onEdit(vehicle)}><Edit2 size={16} /></button>
                        <button className="btn-subtle" title="Eliminar" onClick={() => onDelete(vehicle)}><Trash2 size={16} /></button>
                        <button className="btn-primary-small" onClick={() => onView(vehicle)}><Eye size={16} /> Ver Detalles</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
