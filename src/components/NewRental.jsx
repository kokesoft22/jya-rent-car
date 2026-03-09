import React, { useState, useEffect } from 'react';
import {
    Car,
    User,
    Calendar,
    DollarSign,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    FileText,
    Loader
} from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { customerService } from '../services/customerService';
import { rentalService } from '../services/rentalService';
import { useNavigate } from 'react-router-dom';

const NewRental = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        vehicle_id: '',
        customer_id: '',
        start_date: '',
        end_date: '',
        total_amount: 0,
        customer_name: '',
        customer_id_number: '',
        customer_phone: '',
        rental_days: 0,
        payment_status: 'pending',
        amount_paid: 0,
        is_reservation: false,
        custom_daily_rate: 0
    });

    const [selectedVehicle, setSelectedVehicle] = useState(null);

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        const data = await vehicleService.getAll();
        setVehicles(data.filter(v => v.status === 'available'));
    };

    const handleVehicleChange = (e) => {
        const id = e.target.value;
        const vehicle = vehicles.find(v => v.id === id);
        setSelectedVehicle(vehicle);
        const rate = vehicle ? vehicle.daily_rate : 0;
        setFormData(prev => ({ ...prev, vehicle_id: id, custom_daily_rate: rate }));
        calculateTotal(rate, formData.start_date, formData.end_date);
    };

    const calculateTotal = (rate, start, end) => {
        if (rate && start && end) {
            const s = new Date(start);
            const e = new Date(end);
            const diffTime = Math.abs(e - s);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
            setFormData(prev => ({
                ...prev,
                total_amount: diffDays * parseFloat(rate),
                rental_days: diffDays,
                custom_daily_rate: parseFloat(rate)
            }));
        }
    };

    const nextStep = () => {
        if (step === 1) {
            const today = new Date().toISOString().split('T')[0];
            if (formData.start_date < today) {
                alert('La fecha de recogida no puede ser en el pasado.');
                return;
            }
            if (formData.end_date < formData.start_date) {
                alert('La fecha de entrega no puede ser anterior a la fecha de recogida.');
                return;
            }
        }
        setStep(prev => Math.min(prev + 1, 3));
    };
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // 1. Create or get customer
            let customerId = formData.customer_id;
            if (!customerId) {
                // Check if customer already exists by id_number
                const existingCustomer = await customerService.getByIdNumber(formData.customer_id_number);

                if (existingCustomer) {
                    customerId = existingCustomer.id;
                    // Optionally update customer info if needed
                } else {
                    const newCustomer = await customerService.create({
                        full_name: formData.customer_name,
                        id_number: formData.customer_id_number,
                        phone: formData.customer_phone
                    });
                    customerId = newCustomer.id;
                }
            }

            // 2. Create rental
            await rentalService.create({
                vehicle_id: formData.vehicle_id,
                customer_id: customerId,
                start_date: formData.start_date,
                end_date: formData.end_date,
                total_amount: formData.total_amount,
                payment_status: formData.payment_status,
                amount_paid: parseFloat(formData.amount_paid) || 0,
                status: 'active'
            });

            alert('Renta creada exitosamente');
            navigate('/');
        } catch (err) {
            console.error('Error creating rental:', err);
            alert('Error al crear la renta: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content new-rental">
            <header className="rental-header">
                <h1 className="page-title">Nueva Reserva de Alquiler</h1>
                <div className="stepper">
                    <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
                        <span className="step-num">{step > 1 ? <CheckCircle size={16} /> : '1'}</span>
                        <span className="step-label">Vehículo</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                        <span className="step-num">{step > 2 ? <CheckCircle size={16} /> : '2'}</span>
                        <span className="step-label">Cliente</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                        <span className="step-num">3</span>
                        <span className="step-label">Pago</span>
                    </div>
                </div>
            </header>

            <div className="rental-form-container">
                <div className="form-main glass-card">
                    {step === 1 && (
                        <div className="form-step">
                            <h3><Car size={20} /> Seleccionar Vehículo</h3>
                            <div className="form-group">
                                <label>Modelo del Vehículo</label>
                                <select
                                    className="input-field"
                                    value={formData.vehicle_id}
                                    onChange={handleVehicleChange}
                                >
                                    <option value="">Selecciona un vehículo...</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.model} ({v.license_plate})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fecha de Recogida</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.start_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, start_date: e.target.value });
                                            calculateTotal(formData.custom_daily_rate || selectedVehicle?.daily_rate, e.target.value, formData.end_date);
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha de Entrega</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                                        value={formData.end_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, end_date: e.target.value });
                                            calculateTotal(formData.custom_daily_rate || selectedVehicle?.daily_rate, formData.start_date, e.target.value);
                                        }}
                                    />
                                </div>
                            </div>
                            {formData.rental_days > 0 && (
                                <div className="duration-badge" style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(6, 188, 249, 0.1)', borderRadius: '8px', color: '#06bcf9', border: '1px solid rgba(6, 188, 249, 0.2)' }}>
                                    <Calendar size={18} />
                                    <span>Duración estimada: <strong>{formData.rental_days} {formData.rental_days === 1 ? 'día' : 'días'}</strong></span>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="form-step">
                            <h3><User size={20} /> Información del Cliente</h3>
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Juan Pérez"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cédula / Pasaporte</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="12345678-9"
                                        value={formData.customer_id_number}
                                        onChange={(e) => setFormData({ ...formData, customer_id_number: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Número de Teléfono</label>
                                    <input
                                        type="tel"
                                        className="input-field"
                                        placeholder="+1 809..."
                                        value={formData.customer_phone}
                                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="form-step">
                            <h3><DollarSign size={20} /> Precios y Términos</h3>
                            <div className="summary-list">
                                <div className="summary-item" style={{ alignItems: 'center' }}>
                                    <span>Tarifa Diaria</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#64748b', fontSize: '13px' }}>$</span>
                                        <input
                                            type="number"
                                            value={formData.custom_daily_rate}
                                            onChange={(e) => {
                                                const newRate = parseFloat(e.target.value) || 0;
                                                const newTotal = formData.rental_days * newRate;
                                                setFormData({ ...formData, custom_daily_rate: e.target.value, total_amount: newTotal });
                                            }}
                                            style={{ width: '70px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#06bcf9', textAlign: 'center', borderRadius: '8px', padding: '6px 8px', fontSize: '15px', fontWeight: 700 }}
                                        />
                                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>x {formData.rental_days} {formData.rental_days === 1 ? 'día' : 'días'}</span>
                                        {parseFloat(formData.custom_daily_rate) !== (selectedVehicle?.daily_rate || 0) && (
                                            <span style={{ fontSize: '11px', color: '#f59e0b', marginLeft: '4px' }}>
                                                (original: ${selectedVehicle?.daily_rate})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="summary-total">
                                    <span>Monto Total</span>
                                    <span>${formData.total_amount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0 }}><DollarSign size={20} /> Monto a Pagar</h3>
                                    <div
                                        onClick={() => setFormData({ ...formData, is_reservation: !formData.is_reservation, amount_paid: '' })}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                            padding: '6px 14px', borderRadius: '20px',
                                            background: formData.is_reservation ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${formData.is_reservation ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '16px', height: '16px', borderRadius: '4px',
                                            background: formData.is_reservation ? '#3b82f6' : 'transparent',
                                            border: `2px solid ${formData.is_reservation ? '#3b82f6' : '#64748b'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}>
                                            {formData.is_reservation && <CheckCircle size={10} color="#fff" />}
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 500, color: formData.is_reservation ? '#3b82f6' : '#94a3b8' }}>Reservar</span>
                                    </div>
                                </div>

                                {formData.is_reservation && (
                                    <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '16px', fontSize: '13px', color: '#93c5fd' }}>
                                        📅 El cliente está reservando el vehículo. Introduce el monto de la reserva.
                                    </div>
                                )}

                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="Introduce el monto que el cliente paga ahora"
                                        style={{ fontSize: '16px', padding: '14px 18px' }}
                                        value={formData.amount_paid}
                                        onChange={(e) => {
                                            const paid = parseFloat(e.target.value) || 0;
                                            let status = 'pending';
                                            if (formData.is_reservation) {
                                                status = paid > 0 ? 'reservation' : 'pending';
                                            } else if (paid >= formData.total_amount && formData.total_amount > 0) {
                                                status = 'paid';
                                            } else if (paid > 0) {
                                                status = 'partial';
                                            }
                                            setFormData({ ...formData, amount_paid: e.target.value, payment_status: status });
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                                    <span style={{ color: '#94a3b8' }}>Pendiente: <strong style={{ color: '#ef4444' }}>${Math.max(0, formData.total_amount - (parseFloat(formData.amount_paid) || 0)).toLocaleString()}</strong></span>
                                    <span style={{ color: '#94a3b8' }}>Total: <strong style={{ color: '#10b981' }}>${formData.total_amount.toLocaleString()}</strong></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-footer">
                        {step > 1 && (
                            <button className="btn-subtle" onClick={prevStep}>
                                <ArrowLeft size={18} /> Atrás
                            </button>
                        )}
                        <div style={{ flex: 1 }}></div>
                        {step < 3 ? (
                            <button className="btn-primary" onClick={nextStep} disabled={!formData.vehicle_id && step === 1}>
                                Siguiente Paso <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button className="btn-primary accent-glow" onClick={handleSubmit} disabled={loading}>
                                {loading ? <Loader className="animate-spin" size={18} /> : <FileText size={18} />}
                                <span>{loading ? 'Procesando...' : 'Crear Contrato'}</span>
                            </button>
                        )}
                    </div>
                </div>

                <aside className="rental-summary glass-card">
                    <h3>Resumen de Reserva</h3>
                    <div className="summary-vehicle-img">
                        <img src={selectedVehicle?.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400'} alt="Vehículo" />
                    </div>
                    <div className="summary-details">
                        <div className="detail">
                            <span className="label">Vehículo</span>
                            <span className="value">{selectedVehicle?.model || 'No seleccionado'}</span>
                        </div>
                        <div className="detail">
                            <span className="label">Días de Renta</span>
                            <span className="value">{formData.rental_days || 0} {formData.rental_days === 1 ? 'día' : 'días'}</span>
                        </div>
                        <div className="detail">
                            <span className="label">Estado de Pago</span>
                            <span className="value" style={{
                                color: {
                                    paid: '#10b981', reservation: '#3b82f6', partial: '#f59e0b', pending: '#ef4444'
                                }[formData.payment_status] || '#ef4444'
                            }}>
                                {{ paid: '✅ Pagado', reservation: '📅 Reservado', partial: '🟡 Parcial', pending: '🔴 Pendiente' }[formData.payment_status]}
                            </span>
                        </div>
                        {parseFloat(formData.amount_paid) > 0 && formData.payment_status !== 'paid' && (
                            <div className="detail">
                                <span className="label">Pagado</span>
                                <span className="value" style={{ color: '#06bcf9' }}>${parseFloat(formData.amount_paid).toLocaleString()}</span>
                            </div>
                        )}
                        {parseFloat(formData.amount_paid) > 0 && formData.payment_status !== 'paid' && (
                            <div className="detail">
                                <span className="label">Pendiente</span>
                                <span className="value" style={{ color: '#ef4444' }}>${Math.max(0, formData.total_amount - parseFloat(formData.amount_paid)).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="detail">
                            <span className="label">Precio Total</span>
                            <span className="value highlighting">${formData.total_amount.toLocaleString()}</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default NewRental;
