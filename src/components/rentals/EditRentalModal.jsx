import React, { useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdateRental } from '../../hooks/useRentals';

const rentalSchema = z.object({
    end_date: z.string().min(1, "La fecha de fin es obligatoria"),
    total_amount: z.coerce.number().min(0, "El total no puede ser negativo"),
    deposit: z.coerce.number().min(0, "El depósito no puede ser negativo"),
    status: z.enum(['active', 'completed', 'cancelled']),
});

const EditRentalModal = ({ isOpen, onClose, rental }) => {
    const updateRentalMutation = useUpdateRental();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(rentalSchema),
        defaultValues: {
            end_date: '',
            total_amount: 0,
            deposit: 0,
            status: 'active'
        }
    });

    useEffect(() => {
        if (isOpen && rental) {
            // Format dates for datetime-local input
            let formattedDate = '';
            if (rental.end_date) {
                formattedDate = rental.end_date.split('T')[0];
            }

            reset({
                end_date: formattedDate,
                total_amount: rental.total_amount || 0,
                deposit: rental.deposit || 0,
                status: rental.status || 'active'
            });
        }
    }, [isOpen, rental, reset]);

    if (!isOpen || !rental) return null;

    const onSubmit = async (data) => {
        try {
            // Keep end_date as YYYY-MM-DD representation
            let payload = { ...data };
            
            await updateRentalMutation.mutateAsync({ id: rental.id, data: payload });
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2>Editar Renta</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
                    
                    <div className="form-group">
                        <label>Estado de la Renta *</label>
                        <select className="input-field" {...register('status')}>
                            <option value="active">Activa</option>
                            <option value="completed">Completada</option>
                            <option value="cancelled">Cancelada</option>
                        </select>
                        {errors.status && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.status.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Fecha de Fin *</label>
                        <input
                            type="date"
                            className={`input-field ${errors.end_date ? 'error-border' : ''}`}
                            {...register('end_date')}
                        />
                        {errors.end_date && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.end_date.message}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Total de la Renta ($)</label>
                            <input
                                type="number"
                                className={`input-field ${errors.total_amount ? 'error-border' : ''}`}
                                step="0.01"
                                {...register('total_amount')}
                            />
                            {errors.total_amount && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.total_amount.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Depósito ($)</label>
                            <input
                                type="number"
                                className={`input-field ${errors.deposit ? 'error-border' : ''}`}
                                step="0.01"
                                {...register('deposit')}
                            />
                            {errors.deposit && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.deposit.message}</span>}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRentalModal;
