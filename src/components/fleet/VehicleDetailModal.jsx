import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, Calendar, User, Edit2, Trash2, Plus, CheckCircle } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { rentalService } from '../../services/rentalService';
import { customerService } from '../../services/customerService';
import { useVehicleMaintenanceLogs, useAddMaintenanceLog, useUpdateMaintenanceLog, useDeleteMaintenanceLog } from '../../hooks/useMaintenance';
import { toast } from 'sonner';
import { Calendar as ReactCalendar } from 'react-calendar';
import { formatDateSafe, getLocalTodayDate, normalizeDate } from '../../utils/dateUtils';
import 'react-calendar/dist/Calendar.css';

export const VehicleDetailModal = ({ vehicle, isOpen, onClose }) => {
    const { data: maintenanceLogs = [], isLoading: isLoadingLogs } = useVehicleMaintenanceLogs(vehicle?.id);
    const addLogMutation = useAddMaintenanceLog();
    const updateLogMutation = useUpdateMaintenanceLog();
    const deleteLogMutation = useDeleteMaintenanceLog();

    const [scheduledRentals, setScheduledRentals] = useState([]);
    const [activeTab, setActiveTab] = useState('maintenance');
    const [showForm, setShowForm] = useState(false);
    const [editingLogId, setEditingLogId] = useState(null);
    const [editingRentalId, setEditingRentalId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingData, setLoadingData] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    const [availabilityConflicts, setAvailabilityConflicts] = useState([]);
    const [rentalLoading, setRentalLoading] = useState(false);
    const [rentalForm, setRentalForm] = useState({
        customer_name: '', customer_id_number: '', customer_phone: '',
        start_date: '', end_date: '', amount_paid: 0, payment_status: 'pending'
    });

    const [newLog, setNewLog] = useState({
        description: '', cost: '', mileage_at_service: '', date: getLocalTodayDate(),
        category: 'maintenance'
    });

    const CATEGORY_MAP = {
        maintenance: 'Mantenimiento',
        insurance: 'Seguros',
        fuel: 'Combustibles',
        cleaning: 'Limpieza',
        taxes: 'Impuestos',
        other: 'Otros'
    };


    useEffect(() => {
        if (isOpen && vehicle) {
            setEditingRentalId(null);
            setEditingLogId(null);
            setShowForm(false);
            loadRentals();
        }
    }, [isOpen, vehicle]);

    const loadRentals = async () => {
        try {
            setLoadingData(true);
            const rentals = await rentalService.getByVehicle(vehicle.id);
            const today = getLocalTodayDate();
            
            const normalize = normalizeDate;

            // Filtrar para mostrar solo rentas activas o pendientes que no hayan terminado
            const activeOrPending = rentals.filter(rent => 
                (rent.status === 'active' || rent.status === 'pending') && 
                normalize(rent.end_date) >= today
            );
            setScheduledRentals(activeOrPending);
        } catch (err) {
            console.error('Error loading vehicle rentals:', err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleAddLog = async (e) => {
        e.preventDefault();
        try {
            const logData = {
                vehicle_id: vehicle.id,
                ...newLog,
                cost: parseFloat(newLog.cost) || 0,
                mileage_at_service: newLog.mileage_at_service ? parseFloat(newLog.mileage_at_service) : null
            };

            if (editingLogId) {
                await updateLogMutation.mutateAsync({ id: editingLogId, data: logData });
            } else {
                await addLogMutation.mutateAsync(logData);
            }

            setNewLog({ description: '', cost: '', mileage_at_service: '', date: getLocalTodayDate(), category: 'maintenance' });
            setShowForm(false);
            setEditingLogId(null);
        } catch (err) {
            // Error is handled by the hook
        }
    };

    const handleEditLog = (log) => {
        setNewLog({
            description: log.description,
            cost: log.cost,
            mileage_at_service: log.mileage_at_service || '',
            date: log.date,
            category: log.category || 'maintenance'
        });
        setEditingLogId(log.id);
        setShowForm(true);
    };

    const handleDeleteLog = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este registro de mantenimiento?')) {
            try {
                await deleteLogMutation.mutateAsync(id);
            } catch (err) {
                // Error handled by hook
            }
        }
    };

    if (!isOpen || !vehicle) return null;

    const handleNewRental = async (e) => {
        e.preventDefault();
        if (availabilityConflicts.length > 0) {
            toast.error('El vehículo tiene conflictos de disponibilidad en ese rango de fechas.');
            return;
        }

        try {
            setRentalLoading(true);
            let customerId;
            const existingCustomer = await customerService.getByIdNumber(rentalForm.customer_id_number);
            
            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                const newCustomer = await customerService.create({
                    full_name: rentalForm.customer_name,
                    id_number: rentalForm.customer_id_number,
                    phone: rentalForm.customer_phone
                });
                customerId = newCustomer.id;
            }

            const s = new Date(rentalForm.start_date);
            const eDate = new Date(rentalForm.end_date);
            const diffDays = Math.ceil(Math.abs(eDate - s) / (1000 * 60 * 60 * 24)) || 1;
            const pricePerDay = rentalForm.price_per_day !== undefined ? parseFloat(rentalForm.price_per_day) || 0 : (vehicle.daily_rate || 0);
            const totalAmount = diffDays * pricePerDay;
            const amountPaid = parseFloat(rentalForm.amount_paid) || 0;
            const autoPaymentStatus = amountPaid <= 0 ? 'pending' : amountPaid >= totalAmount ? 'paid' : 'partial';

            if (editingRentalId) {
                await rentalService.update(editingRentalId, {
                    customer_id: customerId,
                    start_date: rentalForm.start_date,
                    end_date: rentalForm.end_date,
                    total_amount: totalAmount,
                    payment_status: autoPaymentStatus,
                    amount_paid: amountPaid
                });
                toast.success('Renta actualizada exitosamente');
            } else {
                await rentalService.create({
                    vehicle_id: vehicle.id, customer_id: customerId,
                    start_date: rentalForm.start_date, end_date: rentalForm.end_date,
                    total_amount: totalAmount, payment_status: autoPaymentStatus,
                    amount_paid: amountPaid, status: 'active'
                });
                toast.success('Reserva creada exitosamente');
            }

            setRentalForm({
                customer_name: '', customer_id_number: '', customer_phone: '',
                start_date: '', end_date: '', amount_paid: 0, payment_status: 'pending'
            });
            setEditingRentalId(null);
            setActiveTab('agenda');
            loadRentals();
        } catch (err) {
            console.error('Error creating rental:', err);
            toast.error('Error al crear la renta: ' + err.message);
        } finally {
            setRentalLoading(false);
        }
    };

    const handleEditRental = (rent) => {
        setRentalForm({
            customer_name: rent.customers?.full_name || '',
            customer_id_number: rent.customers?.id_number || '',
            customer_phone: rent.customers?.phone || '',
            start_date: rent.start_date.split('T')[0],
            end_date: rent.end_date.split('T')[0],
            amount_paid: rent.amount_paid || 0,
            payment_status: rent.payment_status || 'pending'
        });
        setEditingRentalId(rent.id);
        setActiveTab('new-rental');
    };

    const handleCompleteRental = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas marcar esta renta como completada? El vehículo volverá a estar disponible.')) {
            try {
                await rentalService.complete(id);
                toast.success('Renta completada exitosamente');
                loadRentals();
            } catch (err) {
                console.error('Error completing rental:', err);
                toast.error('Error al completar la renta: ' + err.message);
            }
        }
    };

    const handleDeleteRental = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
            try {
                await rentalService.delete(id);
                toast.success('Reserva eliminada');
                loadRentals();
            } catch (err) {
                console.error('FULL DELETE ERROR:', err);
                toast.error('Error al eliminar la reserva: ' + (err.message || 'Error desconocido'));
            }
        }
    };

    const handleRentalDateChange = (field, value) => {
        const updatedForm = { ...rentalForm, [field]: value };
        setRentalForm(updatedForm);
        
        if (updatedForm.start_date && updatedForm.end_date) {
            checkConflictsForModal(vehicle.id, updatedForm.start_date, updatedForm.end_date, editingRentalId);
        }
    };

    const checkConflictsForModal = async (vehicleId, start, end, excludeId = null) => {
        try {
            const conflicts = await rentalService.checkAvailability(vehicleId, start, end, excludeId);
            setAvailabilityConflicts(conflicts);
        } catch (err) {
            console.error('Error checking conflicts:', err);
        }
    };

    const isDateOccupied = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${d}`;
        return scheduledRentals.some(rent => {
            if (rent.status !== 'active') return false;
            if (editingRentalId && rent.id === editingRentalId) return false;
            const start = rent.start_date.split('T')[0];
            const end = rent.end_date.split('T')[0];
            return dStr >= start && dStr <= end;
        });
    };

    const getTileClassName = ({ date, view }) => {
        if (view === 'month') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (date < today) {
                return 'past-date';
            }
            
            if (isDateOccupied(date)) {
                return 'occupied-date';
            }
        }
        return null;
    };

    const renderNewRentalTab = () => {
        const diffDays = (rentalForm.start_date && rentalForm.end_date)
            ? Math.ceil(Math.abs(new Date(rentalForm.end_date + 'T00:00:00') - new Date(rentalForm.start_date + 'T00:00:00')) / (1000 * 60 * 60 * 24))
            : 0;
        const pricePerDay = rentalForm.price_per_day !== undefined ? parseFloat(rentalForm.price_per_day) || 0 : (vehicle?.daily_rate || 0);
        const totalAmount = diffDays * pricePerDay;
        const amountPaid = parseFloat(rentalForm.amount_paid) || 0;
        const pendingAmount = Math.max(0, totalAmount - amountPaid);

        return (
        <form onSubmit={handleNewRental} className="modal-form" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Nombre Completo</label>
                <input type="text" className="input-field" required value={rentalForm.customer_name} onChange={(e) => setRentalForm({...rentalForm, customer_name: e.target.value})} style={{ fontSize: '13px', padding: '10px' }} />
            </div>
            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>ID / Cédula</label>
                    <input type="text" className="input-field" required value={rentalForm.customer_id_number} onChange={(e) => setRentalForm({...rentalForm, customer_id_number: e.target.value})} style={{ fontSize: '13px', padding: '10px' }} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Teléfono</label>
                    <input type="text" className="input-field" required value={rentalForm.customer_phone} onChange={(e) => setRentalForm({...rentalForm, customer_phone: e.target.value})} style={{ fontSize: '13px', padding: '10px' }} />
                </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" onClick={() => setShowCalendar(!showCalendar)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} />
                        {rentalForm.start_date && rentalForm.end_date 
                            ? `${formatDateSafe(rentalForm.start_date)} → ${formatDateSafe(rentalForm.end_date)}`
                            : 'Selecciona Fecha'
                        }
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{showCalendar ? '▲ Cerrar' : '▼ Abrir'}</span>
                </button>
                {diffDays > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#3b82f6', fontWeight: 600, textAlign: 'center' }}>
                        📅 {diffDays} {diffDays === 1 ? 'día' : 'días'} seleccionados
                    </p>
                )}
                {showCalendar && (
                    <div style={{ marginTop: '10px' }}>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>🔴 Rojo = Días Ocupados</p>
                        <ReactCalendar 
                            selectRange={true}
                            onChange={(values) => {
                                if (values && values.length === 2) {
                                    const toLocalDate = (d) => {
                                        const y = d.getFullYear();
                                        const m = String(d.getMonth() + 1).padStart(2, '0');
                                        const day = String(d.getDate()).padStart(2, '0');
                                        return `${y}-${m}-${day}`;
                                    };
                                    const start = toLocalDate(values[0]);
                                    const end = toLocalDate(values[1]);
                                    setRentalForm(prev => ({...prev, start_date: start, end_date: end}));
                                    if (start && end) {
                                        checkConflictsForModal(vehicle.id, start, end, editingRentalId);
                                    }
                                    setShowCalendar(false);
                                }
                            }}
                            value={rentalForm.start_date && rentalForm.end_date ? [new Date(rentalForm.start_date + 'T00:00:00'), new Date(rentalForm.end_date + 'T00:00:00')] : null}
                            tileClassName={getTileClassName}
                        />
                    </div>
                )}
            </div>

            {availabilityConflicts.length > 0 && (
                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="#ef4444" />
                    <span style={{ fontSize: '12px', color: '#fca5a5' }}>Atención: Conflicto con una renta existente.</span>
                </div>
            )}

            {/* Financial Section */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '2px' }}>💰 Detalles de Pago</p>
                <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8' }}>Precio por Día ($)</label>
                        <input type="number" className="input-field" value={rentalForm.price_per_day !== undefined ? rentalForm.price_per_day : vehicle?.daily_rate || 0} onChange={(e) => setRentalForm({...rentalForm, price_per_day: e.target.value})} style={{ fontSize: '13px', padding: '10px' }} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8' }}>Pagado ($)</label>
                        <input type="number" className="input-field" value={rentalForm.amount_paid} onChange={(e) => setRentalForm({...rentalForm, amount_paid: e.target.value})} style={{ fontSize: '13px', padding: '10px', color: '#10b981', fontWeight: 700 }} />
                    </div>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8' }}>Pendiente ($)</label>
                        <input type="text" className="input-field" readOnly value={`$${pendingAmount.toLocaleString()}`} style={{ fontSize: '13px', padding: '10px', background: 'rgba(255,255,255,0.02)', color: '#ef4444', fontWeight: 700 }} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8' }}>Total a Pagar ($)</label>
                        <input type="text" className="input-field" readOnly value={`$${totalAmount.toLocaleString()}`} style={{ fontSize: '13px', padding: '10px', background: 'rgba(255,255,255,0.02)', color: '#60a5fa', fontWeight: 700 }} />
                    </div>
                </div>
            </div>

            <button type="submit" className="btn-primary" disabled={rentalLoading || availabilityConflicts.length > 0} style={{ width: '100%', marginTop: '10px', height: '48px', justifyContent: 'center', fontSize: '15px', fontWeight: 700 }}>
                <Calendar size={20} />
                <span>{rentalLoading ? 'Procesando...' : 'Reservar'}</span>
            </button>
        </form>
        );
    };

    const activeRental = scheduledRentals.find(rent => {
        const today = getLocalTodayDate();
        const rStart = normalizeDate(rent.start_date);
        const rEnd = normalizeDate(rent.end_date);
        return rent.status === 'active' && rStart <= today && rEnd >= today;
    });

    const filteredLogs = maintenanceLogs.filter(log =>
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.cost && log.cost.toString().includes(searchQuery)) ||
        (log.mileage_at_service && log.mileage_at_service.toString().includes(searchQuery))
    );

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '850px' }}>
                <div className="modal-header">
                    <h2>Detalles del Vehículo</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="detail-grid">
                    <div className="detail-media">
                        <div style={{ marginBottom: '16px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', height: '160px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${vehicle.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d596a?q=80&w=400'})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(10px) brightness(0.4)', transform: 'scale(1.1)' }} />
                            <img src={vehicle.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d596a?q=80&w=400'} alt={vehicle.model} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>Modelo</div>
                                <div style={{ fontSize: '15px', fontWeight: 700 }}>{vehicle.model}</div>
                            </div>
                            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>Placa</div>
                                <div style={{ fontSize: '15px', fontWeight: 700 }}>{vehicle.license_plate}</div>
                            </div>
                            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>Kilometraje</div>
                                <div style={{ fontSize: '15px', fontWeight: 700 }}>{vehicle.mileage?.toLocaleString() || '0'} km</div>
                            </div>
                            {vehicle.insurance_expiry && (
                                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>Seguro Vence</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{formatDateSafe(vehicle.insurance_expiry)}</div>
                                </div>
                            )}
                            {vehicle.last_maintenance && (
                                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>Ultimo Cambio Aceite</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{formatDateSafe(vehicle.last_maintenance)}</div>
                                </div>
                            )}
                            {vehicle.purchase_price > 0 && (
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>Valor</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700 }}>${Number(vehicle.purchase_price).toLocaleString()}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="maintenance-section-container">
                        <div className="detail-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 16px' }}>
                            <button className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => { setActiveTab('maintenance'); setEditingRentalId(null); setEditingLogId(null); }} style={{ padding:'12px', background:'none', border:'none', color:activeTab==='maintenance'?'#0ea5e9':'#94a3b8', borderBottom:activeTab==='maintenance'?'2px solid #0ea5e9':'none', cursor:'pointer' }}>Gastos del Vehículo</button>
                            <button className={`tab-btn ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => { setActiveTab('agenda'); setEditingRentalId(null); setEditingLogId(null); }} style={{ padding:'12px', background:'none', border:'none', color:activeTab==='agenda'?'#0ea5e9':'#94a3b8', borderBottom:activeTab==='agenda'?'2px solid #0ea5e9':'none', cursor:'pointer' }}>Agenda</button>
                            <button 
                                className={`tab-btn ${activeTab === 'new-rental' ? 'active' : ''}`} 
                                onClick={() => {
                                    setActiveTab('new-rental');
                                    if (activeTab !== 'new-rental') setEditingRentalId(null);
                                }} 
                                style={{ padding:'12px', background:'none', border:'none', color:activeTab==='new-rental'?'#10b981':'#94a3b8', borderBottom:activeTab==='new-rental'?'2px solid #10b981':'none', cursor:'pointer' }}
                            >
                                {editingRentalId ? 'Editar Renta' : 'Nueva Renta'}
                            </button>
                        </div>

                        {activeTab === 'maintenance' ? (
                            <>
                                <div className="maintenance-header">
                                    <h4>Historial de Gastos</h4>
                                    <button className="btn-add-log" onClick={() => setShowForm(!showForm)}>
                                        <Plus size={14} /> {showForm ? 'Cancelar' : 'Agregar'}
                                    </button>
                                </div>
                                {showForm && (
                                    <form onSubmit={handleAddLog} className="maintenance-form">
                                        <input type="text" className="input-field" placeholder="¿Qué se le hizo?" required value={newLog.description} onChange={(e) => setNewLog({ ...newLog, description: e.target.value })} style={{ fontSize: '13px', padding: '10px' }} />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input type="number" className="input-field" placeholder="Costo $" value={newLog.cost} onChange={(e) => setNewLog({ ...newLog, cost: e.target.value })} style={{ fontSize: '13px', padding: '10px' }} />
                                            <select className="input-field" value={newLog.category} onChange={(e) => setNewLog({ ...newLog, category: e.target.value })} style={{ fontSize: '13px', padding: '10px' }}>
                                                <option value="maintenance">Mantenimiento</option>
                                                <option value="insurance">Seguros</option>
                                                <option value="fuel">Combustibles</option>
                                                <option value="cleaning">Limpieza</option>
                                                <option value="taxes">Impuestos</option>
                                                <option value="other">Otros</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input type="number" className="input-field" placeholder="Km actual" value={newLog.mileage_at_service} onChange={(e) => setNewLog({ ...newLog, mileage_at_service: e.target.value })} style={{ fontSize: '13px', padding: '10px' }} />
                                            <input type="date" className="input-field" required value={newLog.date} onChange={(e) => setNewLog({ ...newLog, date: e.target.value })} style={{ fontSize: '13px', padding: '10px' }} />
                                        </div>
                                        <button type="submit" className="btn-primary-small" style={{ width: '100%', justifyContent: 'center' }}>{editingLogId ? 'Actualizar' : 'Guardar'}</button>
                                    </form>
                                )}
                                <div className="maintenance-history-list">
                                    {filteredLogs.map(log => (
                                        <div key={log.id} className="maintenance-log-item" style={{ position: 'relative' }}>
                                            <div className="log-info" style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span className="log-date">{formatDateSafe(log.date)}</span>
                                                    <span style={{ 
                                                        fontSize: '10px', 
                                                        padding: '2px 8px', 
                                                        borderRadius: '12px', 
                                                        background: 'rgba(255,255,255,0.08)', 
                                                        color: '#94a3b8',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 600,
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        {CATEGORY_MAP[log.category] || 'Gasto'}
                                                    </span>
                                                </div>
                                                <span className="log-desc" style={{ fontSize: '14px', color: '#e2e8f0' }}>
                                                    {log.description} {log.mileage_at_service ? `- ${Number(log.mileage_at_service).toLocaleString()} km` : ''}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span className="log-cost" style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>${log.cost}</span>
                                                <button onClick={() => handleEditLog(log)} style={{ background: 'rgba(14,165,233,0.1)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#0ea5e9' }}><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteLog(log.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : activeTab === 'agenda' ? (
                            <div className="agenda-list" style={{ padding: '0 16px' }}>
                                {scheduledRentals.filter(r => r.status === 'active').map(rent => {
                                    const today = getLocalTodayDate();
                                    const startDate = rent.start_date.split('T')[0];
                                    const endDate = rent.end_date.split('T')[0];
                                    const isActive = rent.status === 'active' && 
                                                   startDate <= today && 
                                                   endDate >= today;

                                    return (
                                        <div key={rent.id} style={{ 
                                            padding: '12px', 
                                            background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.05)', 
                                            borderRadius: '10px', 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            marginBottom:'10px',
                                            border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : 'none'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '14px', color: isActive ? '#34d399' : '#93c5fd', fontWeight: isActive ? 700 : 400, marginBottom: '4px' }}>
                                                    {formatDateSafe(rent.start_date)} - {formatDateSafe(rent.end_date)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
                                                    <User size={12} /> 
                                                    <span>{rent.customers?.full_name}</span>
                                                    {isActive && (
                                                        <span style={{ 
                                                            fontSize: '9px', 
                                                            padding: '1px 5px', 
                                                            background: '#10b981', 
                                                            color: '#fff', 
                                                            borderRadius: '3px', 
                                                            fontWeight: 700,
                                                            textTransform: 'uppercase',
                                                            marginLeft: '4px'
                                                        }}>
                                                            Renta Actual
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {rent.status === 'active' && (
                                                    <button 
                                                        onClick={() => handleCompleteRental(rent.id)}
                                                        title="Finalizar Renta"
                                                        style={{ background: 'rgba(16,185,129,0.1)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#10b981' }}
                                                    ><CheckCircle size={14} /></button>
                                                )}
                                                <button 
                                                    onClick={() => handleEditRental(rent)}
                                                    style={{ background: 'rgba(14,165,233,0.1)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#0ea5e9' }}
                                                ><Edit2 size={14} /></button>
                                                <button 
                                                    onClick={() => handleDeleteRental(rent.id)}
                                                    style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#ef4444' }}
                                                ><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            renderNewRentalTab()
                        )}
                    </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    {(() => {
                        const effectiveStatus = activeRental ? 'rented' : (vehicle.status === 'rented' ? 'available' : (vehicle.status || 'available'));
                        return (
                            <span className={`status-badge ${effectiveStatus}`} style={{ position: 'static' }}>
                                {effectiveStatus === 'available' ? 'Disponible' : effectiveStatus === 'rented' ? 'Rentado' : 'Mantenimiento'}
                            </span>
                        );
                    })()}
                    <button className="btn-subtle" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};
