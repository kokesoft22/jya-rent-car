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
    Loader,
    AlertTriangle
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/vehicleService';
import { useAddRental } from '../hooks/useRentals';
import { useAddCustomer } from '../hooks/useCustomers';
import { toast } from 'sonner';
import { Calendar as ReactCalendar } from 'react-calendar';
import { formatDateSafe, getLocalTodayDate } from '../utils/dateUtils';
import 'react-calendar/dist/Calendar.css';

const rentalFormSchema = z.object({
    vehicle_id: z.string().min(1, "Selecciona un vehículo"),
    start_date: z.string().min(1, "Fecha de inicio obligatoria"),
    end_date: z.string().min(1, "Fecha de fin obligatoria"),
    customer_name: z.string().min(1, "Nombre del cliente obligatorio"),
    customer_id_number: z.string().min(1, "ID/Cédula obligatoria"),
    customer_phone: z.string().min(1, "Teléfono obligatorio"),
    custom_daily_rate: z.coerce.number().min(1, "La tarifa debe ser mayor a 0"),
    amount_paid: z.coerce.number().min(0),
    is_reservation: z.boolean().default(false),
});

const NewRental = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [vehicles, setVehicles] = useState([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [availabilityConflicts, setAvailabilityConflicts] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scheduledRentals, setScheduledRentals] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [loadingRentals, setLoadingRentals] = useState(false);
    
    const addRentalMutation = useAddRental();
    const addCustomerMutation = useAddCustomer();

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        control,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(rentalFormSchema),
        defaultValues: {
            vehicle_id: '',
            start_date: '',
            end_date: '',
            customer_name: '',
            customer_id_number: '',
            customer_phone: '',
            custom_daily_rate: 0,
            amount_paid: 0,
            is_reservation: false,
        }
    });

    const watchedVehicleId = useWatch({ control, name: 'vehicle_id' });
    const watchedStartDate = useWatch({ control, name: 'start_date' });
    const watchedEndDate = useWatch({ control, name: 'end_date' });
    const watchedDailyRate = useWatch({ control, name: 'custom_daily_rate' });
    const watchedIsReservation = useWatch({ control, name: 'is_reservation' });
    const watchedAmountPaid = useWatch({ control, name: 'amount_paid' });

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            const data = await vehicleService.getAll();
            const today = getLocalTodayDate();
            
            // Filter out vehicles that are in maintenance or have active rentals today
            const availableVehicles = await Promise.all(data.map(async (v) => {
                if (v.status === 'maintenance') return null;
                const activeRentals = await rentalService.checkAvailability(v.id, today, today);
                return activeRentals.length === 0 ? v : null;
            }));

            setVehicles(availableVehicles.filter(v => v !== null));
        } catch (err) {
            toast.error('Error cargando vehículos');
        } finally {
            setLoadingVehicles(false);
        }
    };

    useEffect(() => {
        const vehicle = vehicles.find(v => v.id === watchedVehicleId);
        setSelectedVehicle(vehicle);
        if (vehicle && !getValues('custom_daily_rate')) {
            setValue('custom_daily_rate', vehicle.daily_rate);
        }
        
        if (vehicle) {
            setLoadingRentals(true);
            rentalService.getByVehicle(vehicle.id)
                .then(rentals => setScheduledRentals(rentals))
                .catch(err => console.error("Error loading rentals for vehicle:", err))
                .finally(() => setLoadingRentals(false));
        } else {
            setScheduledRentals([]);
        }

        checkConflicts(watchedVehicleId, watchedStartDate, watchedEndDate);
    }, [watchedVehicleId, watchedStartDate, watchedEndDate, vehicles, setValue, getValues]);

    const isDateOccupied = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${d}`;
        return scheduledRentals.some(rent => {
            if (rent.status !== 'active') return false;
            const start = rent.start_date.split('T')[0];
            const end = rent.end_date.split('T')[0];
            return dStr >= start && dStr <= end;
        });
    };

    const getTileClassName = ({ date, view }) => {
        if (view === 'month' && isDateOccupied(date)) {
            return 'occupied-date';
        }
        return null;
    };

    const checkConflicts = async (vehicleId, start, end) => {
        if (vehicleId && start && end) {
            try {
                const conflicts = await rentalService.checkAvailability(vehicleId, start, end);
                setAvailabilityConflicts(conflicts);
            } catch (err) {
                console.error(err);
            }
        } else {
            setAvailabilityConflicts([]);
        }
    };

    const calculateDays = () => {
        if (watchedStartDate && watchedEndDate) {
            const s = new Date(watchedStartDate);
            const e = new Date(watchedEndDate);
            const diffTime = e - s;
            return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
        return 0;
    };

    const rentalDays = calculateDays();
    const totalAmount = rentalDays * (parseFloat(watchedDailyRate) || 0);

    const nextStep = (e) => {
        if (e) e.preventDefault();
        
        if (step === 1) {
            const today = getLocalTodayDate();
            if (!watchedVehicleId) return toast.error('Selecciona un vehículo');
            if (!watchedStartDate || !watchedEndDate) return toast.error('Selecciona el rango de fechas');
            if (watchedStartDate < today) return toast.error('La fecha de inicio no puede ser en el pasado');
            if (watchedEndDate < watchedStartDate) return toast.error('La fecha de fin no puede ser anterior al inicio');
            if (availabilityConflicts.length > 0) return toast.error('El vehículo no está disponible en esas fechas');
        }
        if (step === 2) {
            const vals = getValues();
            if (!vals.customer_name || !vals.customer_id_number || !vals.customer_phone) {
                return toast.error('Completa la información del cliente');
            }
        }
        setStep(prev => Math.min(prev + 1, 3));
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            
            // 1. Create or get customer
            let customerId;
            const existingCustomer = await customerService.getByIdNumber(data.customer_id_number);
            
            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                const newCustomer = await addCustomerMutation.mutateAsync({
                    full_name: data.customer_name,
                    id_number: data.customer_id_number,
                    phone: data.customer_phone
                });
                customerId = newCustomer.id;
            }

            // 2. Determine payment status
            let paymentStatus = 'pending';
            const paid = parseFloat(data.amount_paid) || 0;
            if (data.is_reservation) {
                paymentStatus = paid > 0 ? 'reservation' : 'pending';
            } else if (paid >= totalAmount && totalAmount > 0) {
                paymentStatus = 'paid';
            } else if (paid > 0) {
                paymentStatus = 'partial';
            }

            // 3. Create rental
            await addRentalMutation.mutateAsync({
                vehicle_id: data.vehicle_id,
                customer_id: customerId,
                start_date: data.start_date,
                end_date: data.end_date,
                total_amount: totalAmount,
                payment_status: paymentStatus,
                amount_paid: paid,
                status: 'active'
            });

            // toast.success is handled by hooks
            navigate('/rentals');
        } catch (err) {
            console.error('Error creating rental:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content new-rental">
            <header className="rental-header">
                <h1 className="page-title">Nueva Reserva de Alquiler</h1>
                <div className="stepper">
                    {[1, 2, 3].map(s => (
                        <React.Fragment key={s}>
                            <div className={`step-item ${step >= s ? 'active' : ''}`}>
                                <span className="step-num">{step > s ? <CheckCircle size={16} /> : s}</span>
                                <span className="step-label">{s === 1 ? 'Vehículo' : s === 2 ? 'Cliente' : 'Pago'}</span>
                            </div>
                            {s < 3 && <div className="step-line"></div>}
                        </React.Fragment>
                    ))}
                </div>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="rental-form-container">
                <div className="form-main glass-card">
                    {step === 1 && (
                        <div className="form-step">
                            <h3><Car size={20} /> Seleccionar Vehículo</h3>
                            <div className="form-group">
                                <label>Modelo del Vehículo</label>
                                <select className="input-field" {...register('vehicle_id')}>
                                    <option value="">Selecciona un vehículo...</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.model} ({v.license_plate})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '16px' }}>
                                <button type="button" onClick={() => setShowCalendar(!showCalendar)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={16} />
                                        {watchedStartDate && watchedEndDate 
                                            ? `${formatDateSafe(watchedStartDate)} → ${formatDateSafe(watchedEndDate)}`
                                            : 'Selecciona Fecha'
                                        }
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{showCalendar ? '▲ Cerrar' : '▼ Abrir'}</span>
                                </button>
                                {showCalendar && (
                                    <div style={{ marginTop: '10px' }}>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>🔴 Rojo = Días Ocupados</p>
                                        {loadingRentals ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                                <Loader className="animate-spin" size={24} color="#94a3b8" />
                                            </div>
                                        ) : (
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
                                                        setValue('start_date', start, { shouldValidate: true });
                                                        setValue('end_date', end, { shouldValidate: true });
                                                        checkConflicts(watchedVehicleId, start, end);
                                                        setShowCalendar(false);
                                                    }
                                                }}
                                                value={watchedStartDate && watchedEndDate ? [new Date(watchedStartDate + 'T00:00:00'), new Date(watchedEndDate + 'T00:00:00')] : null}
                                                tileClassName={getTileClassName}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                            {rentalDays > 0 && (
                                <div className="days-indicator-box">
                                    <Calendar size={16} />
                                    <span>Duración del alquiler: <strong>{rentalDays} {rentalDays === 1 ? 'día' : 'días'}</strong></span>
                                </div>
                            )}
                            {availabilityConflicts.length > 0 && (
                                <div className="error-message-box">
                                    <AlertTriangle size={18} />
                                    <span>Este vehículo tiene conflictos en estas fechas.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="form-step">
                            <h3><User size={20} /> Información del Cliente</h3>
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input type="text" className="input-field" placeholder="" {...register('customer_name')} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cédula / Pasaporte</label>
                                    <input type="text" className="input-field" placeholder="" {...register('customer_id_number')} />
                                </div>
                                <div className="form-group">
                                    <label>Número de Teléfono</label>
                                    <input type="tel" className="input-field" placeholder="" {...register('customer_phone')} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="form-step">
                            <h3><DollarSign size={20} /> Precios y Términos</h3>
                            
                            <div className="rate-inline-row">
                                <span className="label">Tarifa Diaria</span>
                                <div className="rate-input-container">
                                    <span className="currency-prefix">$</span>
                                    <input type="number" step="1" className="input-field small-input" {...register('custom_daily_rate')} />
                                    <span className="days-suffix">
                                        x {rentalDays} {rentalDays === 1 ? 'día' : 'días'}
                                        {selectedVehicle && watchedDailyRate != selectedVehicle.daily_rate && (
                                            <span className="original-rate-label"> (original: ${selectedVehicle.daily_rate})</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="summary-total-row">
                                <span className="label">Monto Total</span>
                                <span className="value">${totalAmount.toLocaleString()}</span>
                            </div>

                            <div className="payment-section">
                                <div className="section-header">
                                    <h3><DollarSign size={20} /> Monto a Pagar</h3>
                                    <label className="checkbox-container small">
                                        <input type="checkbox" {...register('is_reservation')} />
                                        <span className="checkmark"></span>
                                        Reservar
                                    </label>
                                </div>

                                <div className="form-group no-margin">
                                    <input type="number" step="0.01" className="input-field big-input" placeholder="0" {...register('amount_paid')} />
                                </div>

                                <div className="payment-status-summary">
                                    <span className="pending-balance">Pendiente: <strong className="text-error">${Math.max(0, totalAmount - (parseFloat(watchedAmountPaid) || 0)).toLocaleString()}</strong></span>
                                    <span className="total-balance">Total: <strong className="text-info">${totalAmount.toLocaleString()}</strong></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-footer">
                        {step > 1 && (
                            <button type="button" className="btn-subtle" onClick={() => setStep(s => s - 1)}>
                                <ArrowLeft size={18} /> Atrás
                            </button>
                        )}
                        <div style={{ flex: 1 }}></div>
                        {step < 3 ? (
                            <button type="button" className="btn-primary" onClick={(e) => nextStep(e)}>
                                Siguiente <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button type="submit" className="btn-primary accent-glow" disabled={loading}>
                                {loading ? <Loader className="animate-spin" size={18} /> : <FileText size={18} />}
                                <span>{loading ? 'Creando...' : 'Crear Contrato'}</span>
                            </button>
                        )}
                    </div>
                </div>

                <aside className="rental-summary glass-card">
                    <h3>Resumen</h3>
                    {selectedVehicle && (
                        <div className="summary-image">
                            <img src={selectedVehicle.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400'} alt="Vehículo" />
                        </div>
                    )}
                    <div className="summary-details">
                        <div className="detail">
                            <span className="label">Vehículo</span>
                            <span className="value">{selectedVehicle?.model || '-'}</span>
                        </div>
                        <div className="detail">
                            <span className="label">Días de Renta</span>
                            <span className="value">{rentalDays}</span>
                        </div>
                        <div className="detail">
                            <span className="label">Estado de Pago</span>
                            <span className={`value status-with-dot ${
                                watchedIsReservation ? 'text-warning' : 
                                watchedAmountPaid >= totalAmount && totalAmount > 0 ? 'text-success' : 
                                watchedAmountPaid > 0 ? 'text-warning' : 'text-error'
                            }`}>
                                <span className={`status-dot ${
                                    watchedIsReservation ? 'reservation' : 
                                    watchedAmountPaid >= totalAmount && totalAmount > 0 ? 'paid' : 
                                    watchedAmountPaid > 0 ? 'partial' : 'pending'
                                }`}></span>
                                {watchedIsReservation ? 'Reserva' : 
                                 watchedAmountPaid >= totalAmount && totalAmount > 0 ? 'Pagado' : 
                                 watchedAmountPaid > 0 ? 'Parcial' : 'Pendiente'}
                            </span>
                        </div>
                        <div className="detail">
                            <span className="label">Pagado</span>
                            <span className="value text-success">${(parseFloat(watchedAmountPaid) || 0).toLocaleString()}</span>
                        </div>
                        <div className="detail">
                            <span className="label">Pendiente</span>
                            <span className="value text-error">${Math.max(0, totalAmount - (parseFloat(watchedAmountPaid) || 0)).toLocaleString()}</span>
                        </div>
                        <div className="detail">
                            <span className="label">Total:</span>
                            <span className="value text-info font-bold">${totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </aside>
            </form>
        </div>
    );
};

export default NewRental;
