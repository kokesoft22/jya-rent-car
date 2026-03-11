import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
    Search,
    Filter,
    MoreVertical,
    Car,
    User,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    AlertTriangle,
    PlusCircle,
    Trash2,
    Edit2,
    DollarSign,
    X,
    Loader,
    Plus
} from 'lucide-react';
import { rentalService } from '../services/rentalService';
import './Rentals.css';

/* ── Payment Modal ── */
const PaymentModal = ({ rental, isOpen, onClose, onPaymentSaved }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !rental) return null;

    const totalAmount = parseFloat(rental.total_amount) || 0;
    const amountPaid = parseFloat(rental.amount_paid) || 0;
    const balance = Math.max(0, totalAmount - amountPaid);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payAmount = parseFloat(amount);
        if (!payAmount || payAmount <= 0) return alert('Ingresa un monto válido.');
        if (payAmount > balance) return alert(`El monto no puede exceder el pendiente ($${balance.toLocaleString()}).`);

        try {
            setLoading(true);
            await rentalService.addPayment(rental.id, payAmount);
            onPaymentSaved();
            onClose();
            setAmount('');
        } catch (err) {
            alert('Error al registrar pago: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePayAll = async () => {
        setAmount(balance.toString());
        if (balance <= 0) return;

        try {
            setLoading(true);
            await rentalService.addPayment(rental.id, balance);
            onPaymentSaved();
            onClose();
            setAmount('');
        } catch (err) {
            alert('Error al registrar pago completo: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card payment-modal">
                <div className="modal-header">
                    <h2><DollarSign size={20} /> Registrar Pago</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="payment-summary">
                    <div className="payment-summary-row">
                        <span>Vehículo</span>
                        <strong>{rental.vehicles?.model || 'N/A'}</strong>
                    </div>
                    <div className="payment-summary-row">
                        <span>Cliente</span>
                        <strong>{rental.customers?.full_name || 'N/A'}</strong>
                    </div>
                    <div className="payment-summary-row">
                        <span>Total de la Renta</span>
                        <strong>${totalAmount.toLocaleString()}</strong>
                    </div>
                    <div className="payment-summary-row paid">
                        <span>Ya Pagado</span>
                        <strong>${amountPaid.toLocaleString()}</strong>
                    </div>
                    <div className="payment-summary-row pending">
                        <span>Pendiente</span>
                        <strong>${balance.toLocaleString()}</strong>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Monto del Pago ($)</label>
                        <div className="payment-input-row">
                            <input
                                type="number"
                                className="input-field"
                                placeholder={`Máximo $${balance.toLocaleString()}`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                max={balance}
                                step="0.01"
                                required
                            />
                            <button type="button" className="btn-subtle pay-all-btn" onClick={handlePayAll}>
                                Pagar Todo
                            </button>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading || balance === 0}>
                            {loading ? <Loader className="animate-spin" size={18} /> : <DollarSign size={18} />}
                            <span>{loading ? 'Procesando...' : `Registrar Pago`}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RentalRow = ({ rental, onComplete, onDelete, onPayment }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPos, setMenuPos] = useState(null);
    const btnRef = React.useRef(null);

    const calcPosition = useCallback(() => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const menuWidth = 210;
            let left = rect.right - menuWidth;
            // Ensure it doesn't go off the left edge
            if (left < 10) left = 10;
            // Ensure it doesn't go off the right edge
            if (left + menuWidth > window.innerWidth - 10) {
                left = window.innerWidth - menuWidth - 10;
            }
            return { top: rect.bottom + 4, left };
        }
        return { top: 0, left: 0 };
    }, []);

    // Keep position in sync on scroll/resize
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
            // Calculate position BEFORE opening so the first render is correct
            setMenuPos(calcPosition());
        }
        setShowMenu(prev => !prev);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(rental.start_date);
    const end = new Date(rental.end_date);

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
        switch (status) {
            case 'active': return <span className="status-badge active">Activa</span>;
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
                                    {balance > 0 && (
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
                                    )}
                                    <button
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
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



const Rentals = () => {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentRental, setPaymentRental] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        loadRentals();
    }, []);

    const loadRentals = async () => {
        try {
            setLoading(false); // UI optimization: show loading only on first load
            const data = await rentalService.getAll();
            setRentals(data);
        } catch (err) {
            console.error('Error loading rentals:', err);
            setError('No se pudieron cargar las rentas.');
        } finally {
            setLoading(false);
        }
    };

    const filteredRentals = rentals.filter(r => {
        const searchMatch =
            (r.vehicles?.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (r.customers?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        if (statusFilter === 'all') return searchMatch;
        return searchMatch && r.status === statusFilter;
    });

    const handleCompleteRental = async (id) => {
        if (confirm('¿Estás seguro de que deseas marcar esta renta como completada? El vehículo volverá a estar disponible.')) {
            try {
                await rentalService.complete(id);
                loadRentals();
            } catch (err) {
                alert('Error al completar renta: ' + err.message);
            }
        }
    };

    const handleDeleteRental = async (id) => {
        try {
            await rentalService.delete(id);
            loadRentals();
        } catch (err) {
            alert('Error al eliminar renta: ' + err.message);
        }
    };

    return (
        <div className="page-content rentals">
            <header className="rentals-header">
                <div className="rentals-header-content">
                    <div>
                        <h1 className="page-title">Historial de Renta</h1>
                        <p className="page-subtitle">Gestiona tus contratos activos y revisa el historial de rentas.</p>
                    </div>
                    <Link to="/new-rental" className="btn-primary">
                        <Plus size={18} />
                        <span>Nueva Renta</span>
                    </Link>
                </div>
            </header>

            <div className="rentals-controls glass-card">
                <div className="control-section">
                    <span className="control-label">Búsqueda</span>
                    <div className="search-input">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Por cliente o vehículo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="control-section">
                    <span className="control-label">Filtrar por Estado</span>
                    <div className="filter-group">
                        <button
                            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >Todas</button>
                        <button
                            className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('active')}
                        >Activas</button>
                        <button
                            className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('completed')}
                        >Completadas</button>

                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message glass-card">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                    <button onClick={loadRentals} className="btn-subtle">Reintentar</button>
                </div>
            )}

            <div className="glass-card rentals-table-container">
                <div className="rentals-table-wrapper">
                    <table className="rentals-table">
                        <thead>
                            <tr>
                                <th>Vehículo</th>
                                <th>Cliente</th>
                                <th>Periodo</th>
                                <th>Total</th>
                                <th>Pago</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Cargando rentas...</td></tr>
                            ) : filteredRentals.length > 0 ? (
                                filteredRentals.map(r => (
                                    <RentalRow
                                        key={r.id}
                                        rental={r}
                                        onComplete={handleCompleteRental}
                                        onDelete={handleDeleteRental}
                                        onPayment={(rental) => {
                                            setPaymentRental(rental);
                                            setIsPaymentModalOpen(true);
                                        }}
                                    />
                                ))
                            ) : (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No hay rentas registradas con estos filtros.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaymentModal
                rental={paymentRental}
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentRental(null);
                }}
                onPaymentSaved={loadRentals}
            />
        </div>
    );
};

export default Rentals;
