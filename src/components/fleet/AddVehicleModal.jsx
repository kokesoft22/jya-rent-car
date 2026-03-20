import React, { useRef, useState, useEffect } from 'react';
import { X, Save, Loader, Upload, Trash2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { vehicleService } from '../../services/vehicleService';
import { toast } from 'sonner';

const vehicleSchema = z.object({
    model: z.string().min(2, 'El modelo es obligatorio (mínimo 2 caracteres)'),
    year: z.coerce.number().min(1900, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido'),
    license_plate: z.string().min(3, 'Placa o matrícula requerida'),
    mileage: z.coerce.number().min(0, 'El kilometraje no puede ser negativo'),
    daily_rate: z.coerce.number().min(0, 'La tarifa debe ser mayor a 0'),
    insurance_expiry: z.string().optional(),
    last_maintenance: z.string().optional(),
    purchase_price: z.coerce.number().min(0, 'Precio inválido'),
    status: z.enum(['available', 'rented', 'maintenance']).default('available'),
}).refine(data => {
    if (data.insurance_expiry) {
        return new Date(data.insurance_expiry) >= new Date(new Date().setHours(0,0,0,0));
    }
    return true;
}, {
    message: 'El seguro no puede estar vencido',
    path: ['insurance_expiry']
}).refine(data => {
    if (data.last_maintenance) {
        return new Date(data.last_maintenance) <= new Date();
    }
    return true;
}, {
    message: 'El mantenimiento no puede ser en el futuro',
    path: ['last_maintenance']
});

const AddVehicleModal = ({ isOpen, onClose, onVehicleAdded }) => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            model: '',
            year: new Date().getFullYear(),
            license_plate: '',
            mileage: 0,
            daily_rate: 0,
            insurance_expiry: '',
            last_maintenance: '',
            purchase_price: 0,
            status: 'available'
        }
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
            setSelectedFiles([]);
            setPreviews([]);
        }
    }, [isOpen, reset]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index]);
            return newPreviews.filter((_, i) => i !== index);
        });
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // Convert empty date strings to null for Supabase
            const formattedData = {
                ...data,
                insurance_expiry: data.insurance_expiry || null,
                last_maintenance: data.last_maintenance || null
            };

            let imageUrl = '';
            if (selectedFiles.length > 0) {
                imageUrl = await vehicleService.uploadImage(selectedFiles[0]);
            }

            await vehicleService.create({
                ...formattedData,
                image_url: imageUrl
            });

            toast.success('Vehículo creado exitosamente');
            onVehicleAdded();
            onClose();
        } catch (err) {
            console.error('Error creating vehicle:', err);
            toast.error('Error al añadir vehículo: ' + (err.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <div className="modal-header">
                    <h2>Añadir Nuevo Vehículo</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
                    <div className="form-group">
                        <label>Modelo / Marca *</label>
                        <input type="text" className={`input-field ${errors.model ? 'error' : ''}`} {...register('model')} />
                        {errors.model && <span className="error-text"><AlertCircle size={12}/> {errors.model.message}</span>}
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Año *</label>
                            <input type="number" className={`input-field ${errors.year ? 'error' : ''}`} {...register('year')} />
                            {errors.year && <span className="error-text"><AlertCircle size={12}/> {errors.year.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Placa / Matrícula *</label>
                            <input type="text" className={`input-field ${errors.license_plate ? 'error' : ''}`} {...register('license_plate')} />
                            {errors.license_plate && <span className="error-text"><AlertCircle size={12}/> {errors.license_plate.message}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Tarifa Diaria ($) *</label>
                            <input type="number" step="any" className={`input-field ${errors.daily_rate ? 'error' : ''}`} {...register('daily_rate')} />
                            {errors.daily_rate && <span className="error-text"><AlertCircle size={12}/> {errors.daily_rate.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Kilometraje (km) *</label>
                            <input type="number" className={`input-field ${errors.mileage ? 'error' : ''}`} {...register('mileage')} />
                            {errors.mileage && <span className="error-text"><AlertCircle size={12}/> {errors.mileage.message}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Seguro Vence</label>
                            <input type="date" className={`input-field ${errors.insurance_expiry ? 'error' : ''}`} {...register('insurance_expiry')} />
                            {errors.insurance_expiry && <span className="error-text"><AlertCircle size={12}/> {errors.insurance_expiry.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Ultimo Cambio Aceite</label>
                            <input type="date" className={`input-field ${errors.last_maintenance ? 'error' : ''}`} {...register('last_maintenance')} />
                            {errors.last_maintenance && <span className="error-text"><AlertCircle size={12}/> {errors.last_maintenance.message}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Valor del Vehículo ($) *</label>
                        <input type="number" step="any" className={`input-field ${errors.purchase_price ? 'error' : ''}`} {...register('purchase_price')} />
                        {errors.purchase_price && <span className="error-text"><AlertCircle size={12}/> {errors.purchase_price.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Fotos del Vehículo</label>
                        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                            <Upload size={24} />
                            <span>Haga clic para subir imágenes</span>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" style={{ display: 'none' }} />
                        </div>

                        {previews.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginTop: '12px', maxHeight: '120px', overflowY: 'auto' }}>
                                {previews.map((url, index) => (
                                    <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '70px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button type="button" style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{loading ? 'Subiendo...' : 'Guardar Vehículo'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVehicleModal;
