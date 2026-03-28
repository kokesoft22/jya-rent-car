import React, { useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdateExpense } from '../../hooks/useFinances';
import { toast } from 'sonner';

const expenseSchema = z.object({
    description: z.string().min(1, 'Descripción obligatoria'),
    amount: z.coerce.number().min(1, 'El monto debe ser mayor a 0'),
    category: z.string().min(1, 'Categoría obligatoria'),
    expense_date: z.string().min(1, 'Fecha obligatoria'),
    vehicle_id: z.string().optional().nullable(),
});

const EditExpenseModal = ({ isOpen, onClose, expense, vehicles }) => {
    const updateExpenseMutation = useUpdateExpense();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            description: '',
            amount: '',
            category: 'maintenance',
            expense_date: '',
            vehicle_id: '',
        }
    });

    useEffect(() => {
        if (isOpen && expense) {
            reset({
                description: expense.description || '',
                amount: expense.amount || '',
                category: expense.category || 'maintenance',
                expense_date: expense.expense_date
                    ? expense.expense_date.split('T')[0]
                    : '',
                vehicle_id: expense.vehicle_id || '',
            });
        }
    }, [isOpen, expense, reset]);

    if (!isOpen || !expense) return null;

    const onSubmit = async (data) => {
        try {
            await updateExpenseMutation.mutateAsync({
                id: expense.id,
                data: { ...data, vehicle_id: data.vehicle_id || null }
            });
            toast.success('Gasto actualizado correctamente');
            onClose();
        } catch (err) {
            toast.error('Error al actualizar gasto: ' + err.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <div className="modal-header">
                    <h2>Editar Gasto</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
                    <div className="form-group">
                        <label>Descripción</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Cambio de aceite..."
                            {...register('description')}
                        />
                        {errors.description && <span style={{ color: 'red', fontSize: '12px' }}>{errors.description.message}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Monto ($)</label>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="150"
                                {...register('amount')}
                            />
                            {errors.amount && <span style={{ color: 'red', fontSize: '12px' }}>{errors.amount.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Categoría</label>
                            <select className="input-field" {...register('category')}>
                                <option value="maintenance">Mantenimiento</option>
                                <option value="insurance">Seguros</option>
                                <option value="fuel">Combustibles</option>
                                <option value="cleaning">Limpieza</option>
                                <option value="taxes">Impuestos</option>
                                <option value="other">Otros</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha</label>
                            <input type="date" className="input-field" {...register('expense_date')} />
                            {errors.expense_date && <span style={{ color: 'red', fontSize: '12px' }}>{errors.expense_date.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Vehículo (Opcional)</label>
                            <select className="input-field" {...register('vehicle_id')}>
                                <option value="">Sin vehículo</option>
                                {vehicles?.map(v => (
                                    <option key={v.id} value={v.id}>{v.model} ({v.license_plate})</option>
                                ))}
                            </select>
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

export default EditExpenseModal;
