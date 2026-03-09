import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { customerService } from '../services/customerService';

const AddCustomerModal = ({ isOpen, onClose, onCustomerAdded }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        id_number: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                full_name: '',
                id_number: '',
                phone: '',
                email: ''
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            await customerService.create(formData);

            onCustomerAdded();
            onClose();
        } catch (err) {
            alert('Error al añadir cliente: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Añadir Nuevo Cliente</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Nombre Completo *</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Ej. Juan Pérez"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Identificación / Cédula / Pasaporte *</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Ej. 402-XXXXXXX-X"
                            required
                            value={formData.id_number}
                            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="Ej. 809-555-0199"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Correo Electrónico</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="ejemplo@correo.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
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
