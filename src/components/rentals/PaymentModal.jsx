import React, { useState } from 'react';
import { DollarSign, X, Loader } from 'lucide-react';
import { useAddPayment } from '../../hooks/useRentals';

const PaymentModal = ({ rental, isOpen, onClose, onPaymentSaved }) => {
    const [amount, setAmount] = useState('');
    
    const addPaymentMutation = useAddPayment();
    const loading = addPaymentMutation.isLoading;

    if (!isOpen || !rental) return null;

    const totalAmount = parseFloat(rental.total_amount) || 0;
    const amountPaid = parseFloat(rental.amount_paid) || 0;
    const balance = Math.max(0, totalAmount - amountPaid);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payAmount = parseFloat(amount);
        if (!payAmount || payAmount <= 0) return;
        if (payAmount > balance) return;

        try {
            await addPaymentMutation.mutateAsync({ id: rental.id, amount: payAmount });
            onClose();
            setAmount('');
        } catch (err) {
            console.error('Error submitting payment:', err);
        }
    };

    const handlePayAll = async () => {
        setAmount(balance.toString());
        if (balance <= 0) return;

        try {
            await addPaymentMutation.mutateAsync({ id: rental.id, amount: balance });
            onClose();
            setAmount('');
        } catch (err) {
            console.error('Error paying all:', err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card payment-modal">
                <div className="modal-header">
                    <h2><DollarSign size={20} /> Registrar Pago</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="payment-summary">
                    <div className="payment-summary-row">
                        <span>Vehículo</span>
                        <strong>{rental.vehicles?.model || 'N/A'}</strong>
                    </div>
                    <div className="payment-summary-row">
                        <span>Cliente</span>
                        <strong>{rental.customers?.full_name || 'N/A'}</strong>
                    </div>
                    <div className="payment-summary-row">
                        <span>Total de la Renta</span>
                        <strong>${totalAmount.toLocaleString()}</strong>
                    </div>
                    <div className="payment-summary-row paid">
                        <span>Ya Pagado</span>
                        <strong>${amountPaid.toLocaleString()}</strong>
                    </div>
                    <div className="payment-summary-row pending">
                        <span>Pendiente</span>
                        <strong>${balance.toLocaleString()}</strong>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Monto del Pago ($)</label>
                        <div className="payment-input-row">
                            <input
                                type="number"
                                className="input-field"
                                placeholder={`Máximo $${balance.toLocaleString()}`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                max={balance}
                                step="0.01"
                                required
                            />
                            <button type="button" className="btn-subtle pay-all-btn" onClick={handlePayAll}>
                                Pagar Todo
                            </button>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading || balance === 0}>
                            {loading ? <Loader className="animate-spin" size={18} /> : <DollarSign size={18} />}
                            <span>{loading ? 'Procesando...' : `Registrar Pago`}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
