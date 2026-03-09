import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Save, Loader, Upload, Trash2 } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';

const AddVehicleModal = ({ isOpen, onClose, onVehicleAdded }) => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [formData, setFormData] = useState({
        model: '',
        year: '',
        license_plate: '',
        mileage: '',
        daily_rate: '',
        insurance_expiry: '',
        last_maintenance_date: '',
        purchase_price: '',
        status: 'available'
    });

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                model: '',
                year: '',
                license_plate: '',
                mileage: '',
                daily_rate: '',
                insurance_expiry: '',
                last_maintenance_date: '',
                purchase_price: '',
                status: 'available'
            });
            setSelectedFiles([]);
            setPreviews([]);
        }
    }, [isOpen]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const today = new Date().toISOString().split('T')[0];
        if (formData.insurance_expiry && formData.insurance_expiry < today) {
            alert('La fecha de vencimiento del seguro no puede estar en el pasado.');
            return;
        }
        if (formData.last_maintenance_date && formData.last_maintenance_date > today) {
            alert('La fecha del último mantenimiento no puede ser en el futuro.');
            return;
        }

        try {
            setLoading(true);

            let imageUrl = '';
            // For now, we take the first image if multiple are uploaded, 
            // as the schema currently only has one image_url field.
            if (selectedFiles.length > 0) {
                imageUrl = await vehicleService.uploadImage(selectedFiles[0]);
            }

            await vehicleService.create({
                ...formData,
                image_url: imageUrl
            });

            onVehicleAdded();
            onClose();
            // Clear state
            setSelectedFiles([]);
            setPreviews([]);
        } catch (err) {
            alert('Error al añadir vehículo: ' + err.message);
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
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Modelo / Marca</label>
                        <input
                            type="text"
                            className="input-field"

                            required
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Año</label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Placa / Matrícula</label>
                            <input
                                type="text"
                                className="input-field"

                                required
                                value={formData.license_plate}
                                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Tarifa Diaria ($)</label>
                            <input
                                type="number"
                                className="input-field"

                                required
                                value={formData.daily_rate}
                                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Kilometraje (km)</label>
                            <input
                                type="number"
                                className="input-field"

                                required
                                value={formData.mileage}
                                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Seguro Vence</label>
                            <input
                                type="date"
                                className="input-field"
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.insurance_expiry}
                                onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Último Mantenimiento</label>
                            <input
                                type="date"
                                className="input-field"
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.last_maintenance_date}
                                onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Valor del Vehículo ($)</label>
                        <input
                            type="number"
                            className="input-field"
                            required
                            value={formData.purchase_price}
                            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Fotos del Vehículo</label>
                        <div
                            className="upload-area"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={24} />
                            <span>Haga clic para subir imágenes</span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                multiple
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>

                        {previews.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                gap: '8px',
                                marginTop: '12px',
                                maxHeight: '120px',
                                overflowY: 'auto'
                            }}>
                                {previews.map((url, index) => (
                                    <div key={index} style={{
                                        position: 'relative',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        height: '70px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <img src={url} alt={`Preview ${index}`} style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }} />
                                        <button
                                            type="button"
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                background: 'rgba(220,38,38,0.85)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '22px',
                                                height: '22px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: 'white'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                        >
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
