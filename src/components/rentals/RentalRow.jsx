import React, { useState, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Car,
    User,
    Calendar,
    CheckCircle,
    MoreVertical,
    DollarSign,
    Edit2,
    Trash2
} from 'lucide-react';

const RentalRow = ({ rental, onComplete, onDelete, onPayment, onEdit }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPos, setMenuPos] = useState(null);
    const btnRef = useRef(null);

    const calcPosition = useCallback(() => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const menuWidth = 210;
            let left = rect.right - menuWidth;
            if (left < 10) left = 10;
            if (left + menuWidth > window.innerWidth - 10) {
                left = window.innerWidth - menuWidth - 10;
            }
            return { top: rect.bottom + 4, left };
        }
        return { top: 0, left: 0 };
    }, []);

    useLayoutEffect(() => {
        if (!showMenu) return;
        const update = () => setMenuPos(calcPosition());
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [showMenu, calcPosition]);

    const handleToggleMenu = (e) => {
        e.stopPropagation();
        if (!showMenu) {
            setMenuPos(calcPosition());
        }
        setShowMenu(prev => !prev);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parseDateFixed = (dateStr) => {
        if (!dateStr) return new Date();
        const [year, month, day] = dateStr.split('T')[0].split('-');
        return new Date(year, month - 1, day);
    };

    const start = parseDateFixed(rental.start_date);
    const end = parseDateFixed(rental.end_date);

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    let daysElapsed = 0;
    if (today > start) {
        const diff = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
        daysElapsed = Math.min(totalDays, diff);
    }
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    const totalAmount = parseFloat(rental.total_amount) || 0;
    const amountPaid = parseFloat(rental.amount_paid) || 0;
    const balance = Math.max(0, totalAmount - amountPaid);

    const getStatusBadge = (status) => {
        if (status === 'active') {
            if (start > today) return <span className="status-badge reserved">Reservada</span>;
            if (end < today) return <span className="status-badge completed">Completada</span>;
            return <span className="status-badge active">Activa</span>;
        }
        switch (status) {
            case 'completed': return <span className="status-badge completed">Completada</span>;
            case 'cancelled': return <span className="status-badge cancelled">Cancelada</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    const getPaymentBadge = (ps) => {
        const map = {
            paid: { label: 'Pagado', cls: 'completed' },
            reservation: { label: 'Reservado', cls: 'reservation' },
            partial: { label: 'Parcial', cls: 'partial' },
            pending: { label: 'Pendiente', cls: 'cancelled' }
        };
        const info = map[ps] || { label: ps || 'N/A', cls: '' };
        return <span className={`status-badge ${info.cls}`}>{info.label}</span>;
    };

    return (
        <tr className="rental-row">
            <td>
                <div className="rental-target">
                    <Car size={16} />
                    <div className="rental-info-stack">
                        <span className="model-name">{rental.vehicles?.model || 'Vehículo Borrado'}</span>
                    </div>
                </div>
            </td>
            <td>
                <div className="rental-customer">
                    <User size={16} />
                    <span>{rental.customers?.full_name || 'Cliente Desconocido'}</span>
                </div>
            </td>
            <td>
                <div className="rental-period-info">
                    <div className="rental-dates">
                        <Calendar size={14} />
                        <span>{start.toLocaleDateString()} - {end.toLocaleDateString()}</span>
                    </div>
                    <div className="days-counter">
                        <span className="total-days">{totalDays} días</span>
                        <div className="days-split">
                            <span className="elapsed">Van: {daysElapsed}</span>
                            <span className="remaining">Faltan: {daysRemaining}</span>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div className="amount-stack">
                    <strong className="total-price">${totalAmount.toLocaleString()}</strong>
                    {balance > 0 && <span className="pending-amount">Pendiente: <strong>${balance.toLocaleString()}</strong></span>}
                </div>
            </td>
            <td>{getPaymentBadge(rental.payment_status)}</td>
            <td>{getStatusBadge(rental.status)}</td>
            <td>
                <div className="rental-actions">
                    {rental.status === 'active' && (
                        <button
                            className="btn-primary-small"
                            onClick={() => onComplete(rental.id, rental.vehicle_id)}
                        >
                            <CheckCircle size={14} /> Finalizar
                        </button>
                    )}
                    <div className="action-menu-container">
                        <button
                            ref={btnRef}
                            className={`btn-icon ${showMenu ? 'active' : ''}`}
                            onClick={handleToggleMenu}
                        >
                            <MoreVertical size={18} />
                        </button>

                        {showMenu && menuPos && createPortal(
                            <>
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 999999,
                                        background: 'transparent'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: menuPos.top,
                                        left: menuPos.left,
                                        zIndex: 1000000,
                                        background: '#1e293b',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                                        minWidth: '200px',
                                        padding: '6px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <button
                                        className="dropdown-item payment"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPayment(rental);
                                            setShowMenu(false);
                                        }}
                                    >
                                        <DollarSign size={14} /> Registrar Pago
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onEdit) onEdit(rental);
                                            setShowMenu(false);
                                        }}
                                    >
                                        <Edit2 size={14} /> Editar Renta
                                    </button>
                                    <button
                                        className="dropdown-item delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('¿Está seguro de eliminar esta renta?')) {
                                                onDelete(rental.id);
                                            }
                                            setShowMenu(false);
                                        }}
                                    >
                                        <Trash2 size={14} /> Eliminar Renta
                                    </button>
                                </div>
                            </>,
                            document.body
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
};

export default RentalRow;
