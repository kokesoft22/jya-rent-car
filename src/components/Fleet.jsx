import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Eye,
    Trash2,
    AlertTriangle,
    X,
    Save,
    Loader,
    Upload,
    Calendar,
    DollarSign,
    Car,
    User,
    Clock
} from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import AddVehicleModal from './AddVehicleModal';

import { maintenanceService } from '../services/maintenanceService';

import { rentalService } from '../services/rentalService';

const VehicleCard = ({ vehicle, onEdit, onDelete, onView }) => {
    const [currentStatus, setCurrentStatus] = useState(vehicle.status);
    const [activeRental, setActiveRental] = useState(null);
    const [nextRental, setNextRental] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const activeRentals = await rentalService.checkAvailability(vehicle.id, today, today);
                if (activeRentals.length > 0) {
                    setCurrentStatus('rented');
                    setActiveRental(activeRentals[0]);
                    setNextRental(null);
                } else {
                    if (vehicle.status !== 'maintenance') {
                        setCurrentStatus('available');
                    } else {
                        setCurrentStatus('maintenance');
                    }
                    setActiveRental(null);
                    // Buscar próxima renta si no hay una activa
                    const nextR = await rentalService.getNextRental(vehicle.id);
                    setNextRental(nextR);
                }
            } catch (err) {
                console.error('Error checking vehicle status:', err);
            }
        };
        checkStatus();
    }, [vehicle]);

    return (
        <div className="glass-card vehicle-card">
            <div className="vehicle-image">
                <img src={vehicle.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d596a?q=80&w=400'} alt={vehicle.model} />
                <span className={`status-badge ${currentStatus}`}>
                    {currentStatus === 'available' ? 'Disponible' :
                        currentStatus === 'rented' ? `Rentado • ${activeRental?.customers?.full_name || 'Cargando...'}` : 'Mantenimiento'}
                </span>
                
                {currentStatus === 'available' && nextRental && (
                    <div className="upcoming-badge" style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.95), rgba(202, 138, 4, 0.95))',
                        color: '#000',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        zIndex: 10
                    }}>
                        <Clock size={14} strokeWidth={2.5} />
                        <span>
                            {(() => {
                                const start = new Date(nextRental.start_date);
                                const today = new Date();
                                
                                const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                                const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                
                                const diffTime = startDate - todayDate;
                                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                                
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
                                    <Calendar size={12} /> Mant.: {new Date(vehicle.last_maintenance).toLocaleDateString()}
                                </span>
                            )}
                            {vehicle.insurance_expiry && (() => {
                                const daysLeft = Math.ceil((new Date(vehicle.insurance_expiry) - new Date()) / (1000 * 60 * 60 * 24));
                                const isExpiring = daysLeft <= 10 && daysLeft > 0;
                                const isExpired = daysLeft <= 0;
                                return (
                                    <span className={`vehicle-insurance ${isExpired ? 'expired' : isExpiring ? 'expiring' : ''}`}>
                                        <AlertTriangle size={12} /> Seguro: {isExpired ? '¡Vencido!' : isExpiring ? `¡Vence en ${daysLeft} días!` : new Date(vehicle.insurance_expiry).toLocaleDateString()}
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

/* ── Edit Vehicle Modal ── */
const EditVehicleModal = ({ vehicle, isOpen, onClose, onSaved }) => {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [newImage, setNewImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [formData, setFormData] = useState({
        model: '',
        year: '',
        license_plate: '',
        mileage: '',
        daily_rate: '',
        insurance_expiry: '',
        last_maintenance: '',
        purchase_price: '',
        status: 'available'
    });

    // Sync form when vehicle changes
    React.useEffect(() => {
        if (vehicle) {
            setFormData({
                model: vehicle.model || '',
                year: vehicle.year || '',
                license_plate: vehicle.license_plate || '',
                mileage: vehicle.mileage || '',
                daily_rate: vehicle.daily_rate || '',
                insurance_expiry: vehicle.insurance_expiry || '',
                last_maintenance: vehicle.last_maintenance || '',
                purchase_price: vehicle.purchase_price || '',
                status: vehicle.status || 'available'
            });
            setNewImage(null);
            setPreview(null);
        }
    }, [vehicle]);

    if (!isOpen || !vehicle) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            let imageUrl = vehicle.image_url;
            if (newImage) {
                imageUrl = await vehicleService.uploadImage(newImage);
            }
            await vehicleService.update(vehicle.id, { ...formData, image_url: imageUrl });
            onSaved();
            onClose();
        } catch (err) {
            alert('Error al actualizar vehículo: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <div className="modal-header">
                    <h2>Editar Vehículo</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Modelo / Marca</label>
                        <input type="text" className="input-field" required
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Año</label>
                            <input type="number" className="input-field"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Placa / Matrícula</label>
                            <input type="text" className="input-field" required
                                value={formData.license_plate}
                                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Tarifa Diaria ($)</label>
                            <input type="number" className="input-field" required
                                value={formData.daily_rate}
                                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Kilometraje (km)</label>
                            <input type="number" className="input-field" required
                                value={formData.mileage}
                                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Seguro Vence</label>
                            <input type="date" className="input-field"
                                value={formData.insurance_expiry}
                                onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Último Mantenimiento</label>
                            <input type="date" className="input-field"
                                value={formData.last_maintenance}
                                onChange={(e) => setFormData({ ...formData, last_maintenance: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Valor del Vehículo ($)</label>
                            <input type="number" className="input-field" required
                                value={formData.purchase_price}
                                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                            />
                        </div>
                        {/* Puedes añadir otro campo aquí si es necesario o dejarlo así */}
                    </div>
                    <div className="form-group">
                        <label>Estado</label>
                        <select className="input-field"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="available">Disponible</option>
                            <option value="rented">Rentado</option>
                            <option value="maintenance">Mantenimiento</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Cambiar Foto</label>
                        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                            {preview ? (
                                <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                            ) : vehicle.image_url ? (
                                <img src={vehicle.image_url} alt="Actual" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                                <>
                                    <Upload size={24} />
                                    <span>Haga clic para subir imagen</span>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ── Vehicle Detail Modal ── */
const VehicleDetailModal = ({ vehicle, isOpen, onClose }) => {
    const [maintenanceLogs, setMaintenanceLogs] = useState([]);
    const [scheduledRentals, setScheduledRentals] = useState([]);
    const [activeTab, setActiveTab] = useState('maintenance');
    const [showForm, setShowForm] = useState(false);
    const [editingLogId, setEditingLogId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingData, setLoadingData] = useState(false);

    // State for the new rental tab
    const [availabilityConflicts, setAvailabilityConflicts] = useState([]);
    const [rentalLoading, setRentalLoading] = useState(false);
    const [rentalForm, setRentalForm] = useState({
        customer_name: '',
        customer_id_number: '',
        customer_phone: '',
        start_date: '',
        end_date: '',
        amount_paid: 0,
        payment_status: 'pending'
    });

    const [newLog, setNewLog] = useState({
        description: '',
        cost: '',
        mileage_at_service: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen && vehicle) {
            loadData();
        }
    }, [isOpen, vehicle]);

    const loadData = async () => {
        try {
            setLoadingData(true);
            const [logs, rentals] = await Promise.all([
                maintenanceService.getByVehicle(vehicle.id),
                rentalService.getByVehicle(vehicle.id)
            ]);
            setMaintenanceLogs(logs);
            setScheduledRentals(rentals);
        } catch (err) {
            console.error('Error loading vehicle details:', err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleAddLog = async (e) => {
        e.preventDefault();
        try {
            const logData = {
                ...newLog,
                vehicle_id: vehicle.id,
                cost: parseFloat(newLog.cost) || 0,
                mileage_at_service: newLog.mileage_at_service ? parseInt(newLog.mileage_at_service) : null
            };

            if (editingLogId) {
                await maintenanceService.update(editingLogId, logData);
            } else {
                await maintenanceService.create(logData);
            }

            setNewLog({
                description: '',
                cost: '',
                mileage_at_service: '',
                date: new Date().toISOString().split('T')[0]
            });
            setShowForm(false);
            setEditingLogId(null);
            loadData();
        } catch (err) {
            alert('Error al guardar mantenimiento: ' + err.message);
        }
    };

    const handleEditLog = (log) => {
        setNewLog({
            description: log.description,
            cost: log.cost,
            mileage_at_service: log.mileage_at_service || '',
            date: log.date
        });
        setEditingLogId(log.id);
        setShowForm(true);
    };

    const handleDeleteLog = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este registro de mantenimiento?')) {
            try {
                await maintenanceService.delete(id);
                loadData();
            } catch (err) {
                alert('Error al eliminar el registro: ' + err.message);
            }
        }
    };

    if (!isOpen || !vehicle) return null;

    const handleNewRental = async (e) => {
        e.preventDefault();
        if (availabilityConflicts.length > 0) {
            alert('El vehículo tiene conflictos de disponibilidad en ese rango de fechas.');
            return;
        }

        try {
            setRentalLoading(true);
            
            // 1. Get or Create Customer
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

            // 2. Create Rental
            const s = new Date(rentalForm.start_date);
            const e = new Date(rentalForm.end_date);
            const diffDays = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) || 1;
            const totalAmount = diffDays * vehicle.daily_rate;

            await rentalService.create({
                vehicle_id: vehicle.id,
                customer_id: customerId,
                start_date: rentalForm.start_date,
                end_date: rentalForm.end_date,
                total_amount: totalAmount,
                payment_status: rentalForm.payment_status,
                amount_paid: parseFloat(rentalForm.amount_paid) || 0,
                status: 'active'
            });

            alert('Reserva creada exitosamente');
            setRentalForm({
                customer_name: '',
                customer_id_number: '',
                customer_phone: '',
                start_date: '',
                end_date: '',
                amount_paid: 0,
                payment_status: 'pending'
            });
            setActiveTab('agenda');
            loadData(); // Reload both logs and agenda
        } catch (err) {
            console.error('Error creating rental:', err);
            alert('Error al crear la renta: ' + err.message);
        } finally {
            setRentalLoading(false);
        }
    };

    const handleRentalDateChange = (field, value) => {
        const updatedForm = { ...rentalForm, [field]: value };
        setRentalForm(updatedForm);
        
        if (updatedForm.start_date && updatedForm.end_date) {
            checkConflictsForModal(vehicle.id, updatedForm.start_date, updatedForm.end_date);
        }
    };

    const checkConflictsForModal = async (vehicleId, start, end) => {
        try {
            const conflicts = await rentalService.checkAvailability(vehicleId, start, end);
            setAvailabilityConflicts(conflicts);
        } catch (err) {
            console.error('Error checking conflicts:', err);
        }
    };

    const renderNewRentalTab = () => (
        <form onSubmit={handleNewRental} className="modal-form" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Nombre Completo</label>
                <input 
                    type="text" className="input-field" required 
                    value={rentalForm.customer_name}
                    onChange={(e) => setRentalForm({...rentalForm, customer_name: e.target.value})}
                    style={{ fontSize: '13px', padding: '10px' }}
                />
            </div>
            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>ID / Cédula</label>
                    <input 
                        type="text" className="input-field" required 
                        value={rentalForm.customer_id_number}
                        onChange={(e) => setRentalForm({...rentalForm, customer_id_number: e.target.value})}
                        style={{ fontSize: '13px', padding: '10px' }}
                    />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Teléfono</label>
                    <input 
                        type="text" className="input-field" required 
                        value={rentalForm.customer_phone}
                        onChange={(e) => setRentalForm({...rentalForm, customer_phone: e.target.value})}
                        style={{ fontSize: '13px', padding: '10px' }}
                    />
                </div>
            </div>
            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Fecha Recogida</label>
                    <input 
                        type="date" className="input-field" required 
                        value={rentalForm.start_date}
                        onChange={(e) => handleRentalDateChange('start_date', e.target.value)}
                        style={{ fontSize: '13px', padding: '10px' }}
                    />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Fecha Entrega</label>
                    <input 
                        type="date" className="input-field" required 
                        value={rentalForm.end_date}
                        onChange={(e) => handleRentalDateChange('end_date', e.target.value)}
                        style={{ fontSize: '13px', padding: '10px' }}
                    />
                </div>
            </div>
            
            {availabilityConflicts.length > 0 && (
                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="#ef4444" />
                    <span style={{ fontSize: '12px', color: '#fca5a5' }}>Atención: Conflicto con una renta existente.</span>
                </div>
            )}

            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Monto Pagado ($)</label>
                    <input 
                        type="number" className="input-field" 
                        value={rentalForm.amount_paid}
                        onChange={(e) => setRentalForm({...rentalForm, amount_paid: e.target.value})}
                        style={{ fontSize: '13px', padding: '10px' }}
                    />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Estado de Pago</label>
                    <select 
                        className="input-field" 
                        value={rentalForm.payment_status}
                        onChange={(e) => setRentalForm({...rentalForm, payment_status: e.target.value})}
                        style={{ fontSize: '13px', padding: '10px' }}
                    >
                        <option value="pending">Pendiente</option>
                        <option value="partial">Parcial</option>
                        <option value="paid">Pagado</option>
                    </select>
                </div>
            </div>

            <button 
                type="submit" 
                className="btn-primary" 
                disabled={rentalLoading || availabilityConflicts.length > 0} 
                style={{ width: '100%', marginTop: '10px', height: '44px', justifyContent: 'center' }}
            >
                {rentalLoading ? <Loader className="animate-spin" size={20} /> : <Calendar size={20} />}
                <span>{rentalLoading ? 'Procesando...' : 'Crear Reserva / Renta'}</span>
            </button>
        </form>
    );

    const activeRental = scheduledRentals.find(rent => {
        const today = new Date().toISOString().split('T')[0];
        return rent.status === 'active' && rent.start_date <= today && rent.end_date >= today;
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
                        <div style={{
                            marginBottom: '16px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            height: '160px',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#000'
                        }}>
                            {/* Fondo difuminado */}
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundImage: `url(${vehicle.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d596a?q=80&w=400'})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'blur(10px) brightness(0.4)',
                                transform: 'scale(1.1)'
                            }} />
                            <img
                                src={vehicle.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d596a?q=80&w=400'}
                                alt={vehicle.model}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }}
                            />
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
                            {vehicle.last_maintenance && (
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>Último Mantenimiento</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{new Date(vehicle.last_maintenance).toLocaleDateString()}</div>
                                </div>
                            )}
                            {vehicle.insurance_expiry && (() => {
                                const daysLeft = Math.ceil((new Date(vehicle.insurance_expiry) - new Date()) / (1000 * 60 * 60 * 24));
                                const isExpiring = daysLeft <= 10 && daysLeft > 0;
                                const isExpired = daysLeft <= 0;
                                const borderColor = isExpired ? 'rgba(239,68,68,0.3)' : isExpiring ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)';
                                const bgColor = isExpired ? 'rgba(239,68,68,0.08)' : isExpiring ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)';
                                return (
                                    <div style={{ padding: '12px', background: bgColor, borderRadius: '10px', border: `1px solid ${borderColor}` }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>Seguro Vence</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: isExpired ? '#ef4444' : isExpiring ? '#f59e0b' : 'inherit' }}>
                                            {isExpired ? '¡Vencido!' : isExpiring ? `¡${daysLeft} días!` : new Date(vehicle.insurance_expiry).toLocaleDateString()}
                                        </div>
                                    </div>
                                );
                            })()}
                            {vehicle.purchase_price > 0 && (
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>Valor del Vehículo</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700 }}>${Number(vehicle.purchase_price).toLocaleString()}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="maintenance-section-container">
                        {/* Renta Actual Prominente */}
                        {vehicle.status === 'rented' && activeRental && (
                            <div style={{ 
                                margin: '0 16px 20px 16px', 
                                padding: '16px', 
                                background: 'rgba(239, 68, 68, 0.05)', 
                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                borderRadius: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                                    <Clock size={16} />
                                    <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Renta Actual en Curso</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Cliente</div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fca5a5' }}>
                                            {activeRental.customers?.full_name}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Entrega</div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fca5a5' }}>
                                            {new Date(activeRental.end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    {activeRental.customers?.phone && (
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Teléfono</div>
                                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{activeRental.customers.phone}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="detail-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 16px' }}>
                            <button 
                                className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('maintenance'); setShowForm(false); }}
                                style={{
                                    padding: '12px 16px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: activeTab === 'maintenance' ? '#0ea5e9' : '#94a3b8',
                                    borderBottom: activeTab === 'maintenance' ? '2px solid #0ea5e9' : '2px solid transparent',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                            >
                                Mantenimiento
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'agenda' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('agenda'); setShowForm(false); }}
                                style={{
                                    padding: '12px 16px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: activeTab === 'agenda' ? '#0ea5e9' : '#94a3b8',
                                    borderBottom: activeTab === 'agenda' ? '2px solid #0ea5e9' : '2px solid transparent',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                            >
                                Agenda de Rentas
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'new-rental' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('new-rental'); setShowForm(false); }}
                                style={{
                                    padding: '12px 16px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: activeTab === 'new-rental' ? '#10b981' : '#94a3b8',
                                    borderBottom: activeTab === 'new-rental' ? '2px solid #10b981' : '2px solid transparent',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                            >
                                Nueva Renta
                            </button>
                        </div>

                        {activeTab === 'maintenance' ? (
                            <>
                                <div className="maintenance-header">
                                    <h4>Historial de Mantenimiento</h4>
                                    <button className="btn-add-log" onClick={() => {
                                        setShowForm(!showForm);
                                        if (showForm) setEditingLogId(null);
                                        if (!showForm && !editingLogId) {
                                            setNewLog({
                                                description: '',
                                                cost: '',
                                                mileage_at_service: '',
                                                date: new Date().toISOString().split('T')[0]
                                            });
                                        }
                                    }}>
                                        <Plus size={14} /> {showForm ? 'Cancelar' : 'Agregar'}
                                    </button>
                                </div>
                                <div style={{ padding: '0 16px', marginBottom: '12px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        width: '100%'
                                    }}>
                                        <Search size={15} color="var(--text-muted)" />
                                        <input
                                            type="text"
                                            placeholder="Buscar en historial (ej: aceite, 50, 81000)..."
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {showForm && (
                                    <form onSubmit={handleAddLog} className="maintenance-form">
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="¿Qué se le hizo?"
                                            required
                                            value={newLog.description}
                                            onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                                            style={{ fontSize: '13px', padding: '10px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="Costo $"
                                                value={newLog.cost}
                                                onChange={(e) => setNewLog({ ...newLog, cost: e.target.value })}
                                                style={{ fontSize: '13px', padding: '10px' }}
                                            />
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="Km actual"
                                                value={newLog.mileage_at_service}
                                                onChange={(e) => setNewLog({ ...newLog, mileage_at_service: e.target.value })}
                                                style={{ fontSize: '13px', padding: '10px' }}
                                            />
                                        </div>
                                        <input
                                            type="date"
                                            className="input-field"
                                            required
                                            value={newLog.date}
                                            onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                                            style={{ fontSize: '13px', padding: '10px' }}
                                        />
                                        <button type="submit" className="btn-primary-small" style={{ width: '100%', justifyContent: 'center' }}>
                                            {editingLogId ? 'Actualizar Registro' : 'Guardar Registro'}
                                        </button>
                                    </form>
                                )}

                                <div className="maintenance-history-list">
                                    {loadingData ? (
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Cargando historial...</p>
                                    ) : filteredLogs.length > 0 ? (
                                        filteredLogs.map(log => (
                                            <div key={log.id} className="maintenance-log-item" style={{ position: 'relative' }}>
                                                <div className="log-info" style={{ flex: 1 }}>
                                                    <span className="log-date">{new Date(log.date).toLocaleDateString()}</span>
                                                    <span className="log-desc">{log.description}</span>
                                                    {log.mileage_at_service && (
                                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Km: {log.mileage_at_service.toLocaleString()}</span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span className="log-cost" style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>${log.cost}</span>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            onClick={() => handleEditLog(log)}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#0ea5e9' }}
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLog(log.id)}
                                                            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#ef4444' }}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
                                            {maintenanceLogs.length > 0 ? 'No se encontraron registros en la búsqueda.' : 'Sin registros de mantenimiento.'}
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : activeTab === 'agenda' ? (
                            <>
                                <div className="agenda-header" style={{ padding: '0 16px', marginBottom: '16px' }}>
                                    <h4 style={{ margin: 0 }}>Próximas Rentas</h4>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>Días que el vehículo ya está reservado o rentado.</p>
                                </div>

                                <div className="agenda-list" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                                    {loadingData ? (
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Cargando agenda...</p>
                                    ) : scheduledRentals.length > 0 ? (
                                        scheduledRentals.map(rent => (
                                            <div key={rent.id} style={{ 
                                                padding: '12px', 
                                                background: 'rgba(59, 130, 246, 0.05)', 
                                                border: '1px solid rgba(59, 130, 246, 0.15)', 
                                                borderRadius: '10px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#93c5fd' }}>
                                                        {new Date(rent.start_date).toLocaleDateString()} - {new Date(rent.end_date).toLocaleDateString()}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                        <User size={12} /> {rent.customers?.full_name}
                                                    </div>
                                                </div>
                                                <span className={`status-badge ${rent.status}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                                    {rent.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dotted rgba(255,255,255,0.1)' }}>
                                            <Calendar size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '12px' }} />
                                            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Este vehículo no tiene rentas programadas.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            renderNewRentalTab()
                        )}
                    </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <span className={`status-badge ${vehicle.status}`} style={{ position: 'static' }}>
                        {vehicle.status === 'available' ? 'Disponible' :
                            vehicle.status === 'rented' ? 'Rentado' : 'Mantenimiento'}
                    </span>
                    <button className="btn-subtle" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};


const Fleet = () => {
    const [vehicles, setVehicles] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit & Detail state
    const [editVehicle, setEditVehicle] = useState(null);
    const [detailVehicle, setDetailVehicle] = useState(null);

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const data = await vehicleService.getAll();
            setVehicles(data);
        } catch (err) {
            console.error('Error loading vehicles:', err);
            if (err.message.includes('Supabase credentials')) {
                setError('Configuración pendiente: Agregue sus claves de Supabase al archivo .env');
            } else {
                setError('No se pudieron cargar los vehículos. Verifica tu conexión.');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredVehicles = vehicles.filter(v => {
        let statusMatch = true;
        if (filter !== 'all') {
            const statusMap = {
                'disponible': 'available',
                'rentado': 'rented',
                'mantenimiento': 'maintenance'
            };
            statusMatch = v.status === statusMap[filter];
        }
        const searchMatch =
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.year.toString().includes(searchTerm);
        return statusMatch && searchMatch;
    });

    const handleDeleteVehicle = async (vehicle) => {
        if (confirm(`¿Estás seguro de que deseas eliminar "${vehicle.model}"? Esta acción no se puede deshacer.`)) {
            try {
                await vehicleService.delete(vehicle.id);
                loadVehicles();
            } catch (err) {
                alert('Error al eliminar vehículo: ' + err.message);
            }
        }
    };

    return (
        <div className="page-content fleet">
            <header className="fleet-header">
                <div>
                    <h1 className="page-title">Gestión de la Flota</h1>
                    <p className="page-subtitle">Tienes un total de {vehicles.length} vehículos en tu lista.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    <span>Añadir Vehículo</span>
                </button>
            </header>

            <div className="fleet-controls glass-card">
                <div className="search-input">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por modelo, placa o año..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >Todos</button>
                    <button
                        className={`filter-btn ${filter === 'disponible' ? 'active' : ''}`}
                        onClick={() => setFilter('disponible')}
                    >Disponible</button>
                    <button
                        className={`filter-btn ${filter === 'rentado' ? 'active' : ''}`}
                        onClick={() => setFilter('rentado')}
                    >Rentado</button>
                    <button
                        className={`filter-btn ${filter === 'mantenimiento' ? 'active' : ''}`}
                        onClick={() => setFilter('mantenimiento')}
                    >
                        <span className="full-text">Mantenimiento</span>
                        <span className="short-text">Mant.</span>
                    </button>

                </div>
            </div>

            {error && (
                <div className="error-message glass-card">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                    <button onClick={loadVehicles} className="btn-subtle">Reintentar</button>
                </div>
            )}

            {loading ? (
                <div className="loading-state">Cargando flota...</div>
            ) : (
                <div className="vehicle-grid">
                    {filteredVehicles.length > 0 ? (
                        filteredVehicles.map(v => (
                            <VehicleCard
                                key={v.id}
                                vehicle={v}
                                onEdit={(veh) => setEditVehicle(veh)}
                                onDelete={handleDeleteVehicle}
                                onView={(veh) => setDetailVehicle(veh)}
                            />
                        ))
                    ) : (
                        <div className="empty-state">
                            {!error && <p>No se encontraron vehículos.</p>}
                        </div>
                    )}
                </div>
            )}

            <AddVehicleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onVehicleAdded={loadVehicles}
            />

            <EditVehicleModal
                vehicle={editVehicle}
                isOpen={!!editVehicle}
                onSaved={loadVehicles}
                onClose={() => setEditVehicle(null)}
            />

            <VehicleDetailModal
                vehicle={detailVehicle}
                isOpen={!!detailVehicle}
                onClose={() => setDetailVehicle(null)}
            />
        </div>
    );
};

export default Fleet;
