import React, { useState } from 'react';
import { X, ShieldAlert, Loader } from 'lucide-react';
import { useBlacklistCustomer } from '../../hooks/useCustomers';

const BlacklistModal = ({ isOpen, onClose, customer, onBlacklisted }) => {
    const [reason, setReason] = useState('');
    const blacklistMutation = useBlacklistCustomer();
    const loading = blacklistMutation.isPending;

    if (!isOpen || !customer) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;

        try {
            await blacklistMutation.mutateAsync({ id: customer.id, reason: reason.trim() });
            setReason('');
            if (onBlacklisted) onBlacklisted();
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-content glass-card" style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                        <ShieldAlert size={22} />
                        Agregar a Lista Negra
                    </h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="blacklist-modal-warning">
                    <div className="blacklist-warning-icon">⚠️</div>
                    <div>
                        <p className="blacklist-warning-title">¿Estás seguro?</p>
                        <p className="blacklist-warning-text">
                            Estás a punto de agregar a <strong>{customer.full_name}</strong> a la lista negra.
                            Este cliente no podrá ser seleccionado para nuevas rentas.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Motivo de la Lista Negra *</label>
                        <textarea
                            className="input-field blacklist-textarea"
                            placeholder="Describe el motivo por el cual este cliente no debe recibir más rentas..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            required
                        />
                        <span className="blacklist-hint">
                            Este motivo será visible para todo el equipo como referencia.
                        </span>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose}>Cancelar</button>
                        <button 
                            type="submit" 
                            className="btn-danger" 
                            disabled={loading || !reason.trim()}
                        >
                            {loading ? <Loader className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
                            <span>{loading ? 'Procesando...' : 'Confirmar Lista Negra'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BlacklistModal;
