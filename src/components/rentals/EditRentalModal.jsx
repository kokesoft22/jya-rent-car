import React, { useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdateRental } from '../../hooks/useRentals';

const rentalSchema = z.object({
    status: z.enum(['active', 'completed', 'cancelled']),
    start_date: z.string().min(1, "La fecha de inicio es obligatoria"),
    end_date: z.string().min(1, "La fecha de fin es obligatoria"),
    total_amount: z.coerce.number().min(0, "El total no puede ser negativo"),
    amount_paid: z.coerce.number().min(0, "El monto pagado no puede ser negativo"),
    payment_status: z.enum(['paid', 'partial', 'pending', 'reservation']),
    deposit: z.coerce.number().min(0, "El depósito no puede ser negativo"),
});

const EditRentalModal = ({ isOpen, onClose, rental }) => {
    const updateRentalMutation = useUpdateRental();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(rentalSchema),
        defaultValues: {
            status: 'active',
            start_date: '',
            end_date: '',
            total_amount: 0,
            amount_paid: 0,
            payment_status: 'pending',
            deposit: 0,
        }
    });

    useEffect(() => {
        if (isOpen && rental) {
            const formatDate = (dateStr) =>
                dateStr ? dateStr.split('T')[0] : '';

            reset({
                status: rental.status || 'active',
                start_date: formatDate(rental.start_date),
                end_date: formatDate(rental.end_date),
                total_amount: rental.total_amount || 0,
                amount_paid: rental.amount_paid || 0,
                payment_status: rental.payment_status || 'pending',
                deposit: rental.deposit || 0,
            });
        }
    }, [isOpen, rental, reset]);

    if (!isOpen || !rental) return null;

    const onSubmit = async (data) => {
        try {
            await updateRentalMutation.mutateAsync({ id: rental.id, data });
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                    <h2>Editar Renta</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="modal-form">

                    {/* Estado de la Renta */}
                    <div className="form-group">
                        <label>Estado de la Renta *</label>
                        <select className="input-field" {...register('status')}>
                            <option value="active">Activa</option>
                            <option value="completed">Completada</option>
                            <option value="cancelled">Cancelada</option>
                        </select>
                        {errors.status && <span style={{ color: 'red', fontSize: '12px' }}>{errors.status.message}</span>}
                    </div>

                    {/* Fechas */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha de Inicio *</label>
                            <input
                                type="date"
                                className={`input-field ${errors.start_date ? 'error-border' : ''}`}
                                {...register('start_date')}
                            />
                            {errors.start_date && <span style={{ color: 'red', fontSize: '12px' }}>{errors.start_date.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Fecha de Fin *</label>
                            <input
                                type="date"
                                className={`input-field ${errors.end_date ? 'error-border' : ''}`}
                                {...register('end_date')}
                            />
                            {errors.end_date && <span style={{ color: 'red', fontSize: '12px' }}>{errors.end_date.message}</span>}
                        </div>
                    </div>

                    {/* Total y Depósito */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Total de la Renta ($)</label>
                            <input
                                type="number"
                                className={`input-field ${errors.total_amount ? 'error-border' : ''}`}
                                step="0.01"
                                {...register('total_amount')}
                            />
                            {errors.total_amount && <span style={{ color: 'red', fontSize: '12px' }}>{errors.total_amount.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Depósito ($)</label>
                            <input
                                type="number"
                                className={`input-field ${errors.deposit ? 'error-border' : ''}`}
                                step="0.01"
                                {...register('deposit')}
                            />
                            {errors.deposit && <span style={{ color: 'red', fontSize: '12px' }}>{errors.deposit.message}</span>}
                        </div>
                    </div>

                    {/* Pago */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Monto Pagado ($)</label>
                            <input
                                type="number"
                                className={`input-field ${errors.amount_paid ? 'error-border' : ''}`}
                                step="0.01"
                                {...register('amount_paid')}
                            />
                            {errors.amount_paid && <span style={{ color: 'red', fontSize: '12px' }}>{errors.amount_paid.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Estado del Pago *</label>
                            <select className="input-field" {...register('payment_status')}>
                                <option value="paid">Pagado</option>
                                <option value="partial">Parcial</option>
                                <option value="pending">Pendiente</option>
                                <option value="reservation">Reserva</option>
                            </select>
                            {errors.payment_status && <span style={{ color: 'red', fontSize: '12px' }}>{errors.payment_status.message}</span>}
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
