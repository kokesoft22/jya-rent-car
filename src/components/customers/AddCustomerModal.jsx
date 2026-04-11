import React, { useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAddCustomer } from '../../hooks/useCustomers';

const customerSchema = z.object({
    full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    id_number: z.string().min(6, "La identificación debe tener al menos 6 caracteres"),
    phone: z.string().optional(),
    email: z.string().email("Correo electrónico inválido").optional().or(z.literal('')),
});

const AddCustomerModal = ({ isOpen, onClose, onCustomerAdded }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            full_name: '',
            id_number: '',
            phone: '',
            email: ''
        }
    });

    const addCustomerMutation = useAddCustomer();
    const loading = addCustomerMutation.isLoading;

    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        try {
            await addCustomerMutation.mutateAsync(data);
            onCustomerAdded();
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Añadir Nuevo Cliente</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
                    <div className="form-group">
                        <label>Nombre Completo *</label>
                        <input
                            type="text"
                            className={`input-field ${errors.full_name ? 'error-border' : ''}`}
                            placeholder="Ej. Juan Pérez"
                            {...register('full_name')}
                        />
                        {errors.full_name && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.full_name.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Identificación / Cédula / Pasaporte *</label>
                        <input
                            type="text"
                            className={`input-field ${errors.id_number ? 'error-border' : ''}`}
                            placeholder="Ej. 402-XXXXXXX-X"
                            {...register('id_number')}
                        />
                        {errors.id_number && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.id_number.message}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="Ej. 809-555-0199"
                                {...register('phone')}
                            />
                        </div>
                        <div className="form-group">
                            <label>Correo Electrónico</label>
                            <input
                                type="email"
                                className={`input-field ${errors.email ? 'error-border' : ''}`}
                                placeholder="ejemplo@correo.com"
                                {...register('email')}
                            />
                            {errors.email && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.email.message}</span>}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{loading ? 'Guardando...' : 'Guardar Cliente'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomerModal;
