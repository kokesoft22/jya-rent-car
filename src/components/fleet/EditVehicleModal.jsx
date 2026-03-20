import React, { useRef, useState, useEffect } from 'react';
import { X, Save, Loader, Upload, AlertCircle } from 'lucide-react';
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
    insurance_expiry: z.string().optional().nullable(),
    last_maintenance: z.string().optional().nullable(),
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

export const EditVehicleModal = ({ vehicle, isOpen, onClose, onSaved }) => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [newImage, setNewImage] = useState(null);
    const [preview, setPreview] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(vehicleSchema)
    });

    useEffect(() => {
        if (vehicle && isOpen) {
            reset({
                model: vehicle.model || '',
                year: vehicle.year || '',
                license_plate: vehicle.license_plate || '',
                mileage: vehicle.mileage || 0,
                daily_rate: vehicle.daily_rate || 0,
                insurance_expiry: vehicle.insurance_expiry || '',
                last_maintenance: vehicle.last_maintenance || '',
                purchase_price: vehicle.purchase_price || 0,
                status: vehicle.status || 'available'
            });
            setNewImage(null);
            setPreview(null);
        }
    }, [vehicle, isOpen, reset]);

    if (!isOpen || !vehicle) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImage(file);
            setPreview(URL.createObjectURL(file));
        }
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

            let imageUrl = vehicle.image_url;
            if (newImage) {
                imageUrl = await vehicleService.uploadImage(newImage);
            }
            await vehicleService.update(vehicle.id, { ...formattedData, image_url: imageUrl });
            toast.success('Vehículo actualizado exitosamente');
            onSaved();
            onClose();
        } catch (err) {
            console.error('Error updating vehicle:', err);
            toast.error('Error al actualizar vehículo: ' + (err.message || 'Error desconocido'));
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
                    <div className="form-row">
                        <div className="form-group">
                            <label>Valor del Vehículo ($) *</label>
                            <input type="number" step="any" className={`input-field ${errors.purchase_price ? 'error' : ''}`} {...register('purchase_price')} />
                            {errors.purchase_price && <span className="error-text"><AlertCircle size={12}/> {errors.purchase_price.message}</span>}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Estado</label>
                        <select className="input-field" {...register('status')}>
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
