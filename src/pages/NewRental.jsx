import React, { useState, useEffect, useRef } from 'react';
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
    AlertTriangle,
    ShieldAlert,
    UploadCloud,
    Trash2,
    Image as ImageIcon,
    ExternalLink
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { vehicleService } from '../services/vehicleService';
import { rentalService } from '../services/rentalService';
import { customerService } from '../services/customerService';
import { useAddRental } from '../hooks/useRentals';
import { useAddCustomer, useCustomers } from '../hooks/useCustomers';
import { toast } from 'sonner';
import { Calendar as ReactCalendar } from 'react-calendar';
import { formatDateSafe, getLocalTodayDate, getDaysDiff } from '../utils/dateUtils';
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
    const location = useLocation();
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
    const { data: customersList = [] } = useCustomers();
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerDropdownRef = useRef(null);
    const [blacklistedWarning, setBlacklistedWarning] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);
    const [documentPreview, setDocumentPreview] = useState(null);
    const [existingDocumentUrl, setExistingDocumentUrl] = useState(null);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const docInputRef = useRef(null);

    const handleDocChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen (JPG, PNG, WEBP)');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('La imagen no debe superar los 10MB');
            return;
        }
        setDocumentFile(file);
        setDocumentPreview(URL.createObjectURL(file));
    };

    const handleRemoveNewDoc = () => {
        if (documentPreview) URL.revokeObjectURL(documentPreview);
        setDocumentFile(null);
        setDocumentPreview(null);
        if (docInputRef.current) docInputRef.current.value = '';
    };

    const handleRemoveExistingDoc = () => {
        setExistingDocumentUrl(null);
    };

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
    const watchedCustomerName = useWatch({ control, name: 'customer_name' });
    const watchedCustomerIdNumber = useWatch({ control, name: 'customer_id_number' });

    const filteredCustomers = customersList.filter(c => 
        (c.full_name?.toLowerCase() || '').startsWith((watchedCustomerName || '').toLowerCase())
    );

    // Auto-detect blacklist when customer name or id is typed or changed
    useEffect(() => {
        if (!watchedCustomerIdNumber && !watchedCustomerName) {
            setBlacklistedWarning(null);
            return;
        }
        const matched = customersList.find(c => 
            (watchedCustomerIdNumber && c.id_number && c.id_number.trim().toLowerCase() === watchedCustomerIdNumber.trim().toLowerCase()) ||
            (watchedCustomerName && c.full_name && c.full_name.trim().toLowerCase() === watchedCustomerName.trim().toLowerCase())
        );
        if (matched && matched.is_blacklisted) {
            setBlacklistedWarning({
                name: matched.full_name,
                reason: matched.blacklist_reason || 'Sin motivo especificado'
            });
        } else if (matched && !matched.is_blacklisted) {
            setBlacklistedWarning(null);
        }
    }, [watchedCustomerIdNumber, watchedCustomerName, customersList]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCustomer = (customer) => {
        setValue('customer_name', customer.full_name, { shouldValidate: true });
        setValue('customer_id_number', customer.id_number, { shouldValidate: true });
        setValue('customer_phone', customer.phone, { shouldValidate: true });
        setShowCustomerDropdown(false);
        
        if (customer.id_document_url) {
            setExistingDocumentUrl(customer.id_document_url);
        } else {
            setExistingDocumentUrl(null);
        }
        if (documentPreview) URL.revokeObjectURL(documentPreview);
        setDocumentFile(null);
        setDocumentPreview(null);
        if (docInputRef.current) docInputRef.current.value = '';

        if (customer.is_blacklisted) {
            setBlacklistedWarning({
                name: customer.full_name,
                reason: customer.blacklist_reason || 'Sin motivo especificado'
            });
        } else {
            setBlacklistedWarning(null);
        }
    };

    useEffect(() => {
        loadVehicles();
    }, []);

    useEffect(() => {
        if (location.state?.client) {
            const client = location.state.client;
            setValue('customer_name', client.full_name || '');
            setValue('customer_id_number', client.id_number || '');
            setValue('customer_phone', client.phone || '');
            if (client.id_document_url) {
                setExistingDocumentUrl(client.id_document_url);
            }
        }
    }, [location.state, setValue]);

    const loadVehicles = async () => {
        try {
            const data = await vehicleService.getAll();
            setVehicles(data);
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
        if (view === 'month') {
            const todayStr = getLocalTodayDate();
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            
            if (dateStr < todayStr) {
                return 'past-date';
            }
            
            if (isDateOccupied(date)) {
                return 'occupied-date';
            }
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
            return getDaysDiff(watchedStartDate, watchedEndDate) + 1;
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
            if (blacklistedWarning) {
                return toast.error(`No se puede rentar a este cliente: está en la lista negra (${blacklistedWarning.reason})`);
            }
            const foundBlacklisted = customersList.find(c => 
                c.is_blacklisted && (
                    (c.id_number && c.id_number.trim().toLowerCase() === (vals.customer_id_number || '').trim().toLowerCase()) ||
                    (c.full_name && c.full_name.trim().toLowerCase() === (vals.customer_name || '').trim().toLowerCase())
                )
            );
            if (foundBlacklisted) {
                setBlacklistedWarning({
                    name: foundBlacklisted.full_name,
                    reason: foundBlacklisted.blacklist_reason || 'Sin motivo especificado'
                });
                return toast.error(`No se puede rentar a este cliente: está en la lista negra (${foundBlacklisted.blacklist_reason || 'Sin motivo especificado'})`);
            }
        }
        setStep(prev => Math.min(prev + 1, 3));
    };

    const onSubmit = async (data) => {
        try {
            if (blacklistedWarning) {
                return toast.error(`No se puede crear el contrato: El cliente está en la lista negra (${blacklistedWarning.reason}).`);
            }

            setLoading(true);
            
            // Upload document if selected
            let finalDocUrl = existingDocumentUrl;
            if (documentFile) {
                setIsUploadingDoc(true);
                try {
                    finalDocUrl = await customerService.uploadDocument(documentFile);
                } catch (uploadErr) {
                    toast.error('Error al subir documento: ' + uploadErr.message);
                } finally {
                    setIsUploadingDoc(false);
                }
            }

            // 1. Create or get customer
            let customerId;
            const existingCustomer = await customerService.getByIdNumber(data.customer_id_number);
            
            if (existingCustomer) {
                if (existingCustomer.is_blacklisted) {
                    setLoading(false);
                    return toast.error(`No se puede crear el contrato: El cliente está en la lista negra (${existingCustomer.blacklist_reason || 'Sin motivo especificado'}).`);
                }
                customerId = existingCustomer.id;
                // If a new document was uploaded and customer doesn't have it or it changed, update customer
                if (finalDocUrl && finalDocUrl !== existingCustomer.id_document_url) {
                    await customerService.update(existingCustomer.id, { id_document_url: finalDocUrl });
                }
            } else {
                const newCustomer = await addCustomerMutation.mutateAsync({
                    full_name: data.customer_name,
                    id_number: data.customer_id_number,
                    phone: data.customer_phone,
                    id_document_url: finalDocUrl
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
                            <div className="form-group" style={{ position: 'relative' }} ref={customerDropdownRef}>
                                <label>Nombre Completo</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="Ingresa o busca un cliente..." 
                                    {...register('customer_name', {
                                        onChange: () => setShowCustomerDropdown(true)
                                    })} 
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    autoComplete="off"
                                />
                                {showCustomerDropdown && watchedCustomerName && filteredCustomers.length > 0 && (
                                    <div className="customer-dropdown-menu">
                                        {filteredCustomers.slice(0, 5).map(c => (
                                            <div 
                                                key={c.id} 
                                                className={`customer-dropdown-item ${c.is_blacklisted ? 'customer-blacklisted' : ''}`}
                                                onClick={() => handleSelectCustomer(c)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                                    {c.is_blacklisted && <ShieldAlert size={14} style={{ color: '#ef4444', flexShrink: 0 }} />}
                                                    <span className="customer-dropdown-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {c.full_name}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                    {c.is_blacklisted && (
                                                        <span style={{ 
                                                            fontSize: '10px', 
                                                            color: '#f87171', 
                                                            fontWeight: 700, 
                                                            textTransform: 'uppercase',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            background: 'rgba(239, 68, 68, 0.15)',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0
                                                        }}>
                                                            Lista Negra
                                                        </span>
                                                    )}
                                                    <span className="customer-dropdown-id" style={{ whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 500 }}>
                                                        {c.id_number}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {blacklistedWarning && (
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                                    padding: '16px 18px', margin: '16px 0',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    borderRadius: '12px',
                                    animation: 'slideInDown 0.3s ease-out'
                                }}>
                                    <ShieldAlert size={22} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                                            ⛔ Cliente en Lista Negra
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                                            <strong style={{ color: '#f8fafc' }}>{blacklistedWarning.name}</strong> está en la lista negra.
                                            No se podrá completar esta renta.
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                                            Motivo: "{blacklistedWarning.reason}"
                                        </div>
                                    </div>
                                </div>
                            )}
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

                            {/* Documento de Identificación */}
                            <div className="form-group" style={{ marginTop: '14px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ImageIcon size={15} style={{ color: '#3b82f6' }} />
                                    Documento de Identificación (Foto Cédula / Pasaporte)
                                </label>

                                <input
                                    type="file"
                                    ref={docInputRef}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleDocChange}
                                />

                                {documentPreview ? (
                                    <div className="document-preview-card">
                                        <img src={documentPreview} alt="Nueva foto seleccionada" className="document-preview-img" />
                                        <div className="document-preview-info">
                                            <div className="document-filename">{documentFile?.name || 'nueva_foto.jpg'}</div>
                                            <div className="document-filesize" style={{ color: '#10b981' }}>
                                                Nueva foto para guardar
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-remove-doc"
                                            onClick={handleRemoveNewDoc}
                                            title="Cancelar nueva foto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : existingDocumentUrl ? (
                                    <div className="document-preview-card">
                                        <img src={existingDocumentUrl} alt="Documento actual" className="document-preview-img" />
                                        <div className="document-preview-info">
                                            <div className="document-filename">Documento Guardado del Cliente</div>
                                            <a 
                                                href={existingDocumentUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="document-view-link"
                                            >
                                                Ver original <ExternalLink size={12} />
                                            </a>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                type="button"
                                                className="btn-subtle"
                                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                                onClick={() => docInputRef.current?.click()}
                                            >
                                                Cambiar
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-remove-doc"
                                                onClick={handleRemoveExistingDoc}
                                                title="Eliminar documento"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="document-upload-zone"
                                        onClick={() => docInputRef.current?.click()}
                                    >
                                        <UploadCloud size={28} className="upload-icon" />
                                        <div className="upload-text">
                                            <span className="upload-prompt">Haz clic para subir o arrastra la foto del documento</span>
                                            <span className="upload-subtext">JPG, PNG o WEBP (máx. 10MB)</span>
                                        </div>
                                    </div>
                                )}
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
