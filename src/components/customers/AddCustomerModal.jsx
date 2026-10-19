import React, { useEffect, useState, useRef } from 'react';
import { X, Save, Loader, UploadCloud, Trash2, Image, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAddCustomer } from '../../hooks/useCustomers';
import { customerService } from '../../services/customerService';

const customerSchema = z.object({
    full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    id_number: z.string().min(6, "La identificación debe tener al menos 6 caracteres"),
    phone: z.string().optional(),
});

const AddCustomerModal = ({ isOpen, onClose, onCustomerAdded }) => {
    const [documentFile, setDocumentFile] = useState(null);
    const [documentPreview, setDocumentPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

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
            phone: ''
        }
    });

    const addCustomerMutation = useAddCustomer();
    const loading = addCustomerMutation.isLoading || isUploading;

    useEffect(() => {
        if (!isOpen) {
            reset();
            setDocumentFile(null);
            if (documentPreview) {
                URL.revokeObjectURL(documentPreview);
                setDocumentPreview(null);
            }
        }
    }, [isOpen, reset]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen (JPG, PNG, WEBP, etc.)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('La imagen no debe superar los 10MB');
            return;
        }

        setDocumentFile(file);
        const previewUrl = URL.createObjectURL(file);
        setDocumentPreview(previewUrl);
    };

    const handleRemoveFile = () => {
        if (documentPreview) {
            URL.revokeObjectURL(documentPreview);
        }
        setDocumentFile(null);
        setDocumentPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        try {
            setIsUploading(true);
            let idDocumentUrl = null;

            if (documentFile) {
                idDocumentUrl = await customerService.uploadDocument(documentFile);
            }

            await addCustomerMutation.mutateAsync({
                ...data,
                id_document_url: idDocumentUrl
            });

            onCustomerAdded();
            onClose();
        } catch (err) {
            console.error('Error al guardar cliente:', err);
            toast.error(err.message || 'Error al guardar el cliente');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '540px' }}>
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

                    <div className="form-group">
                        <label>Teléfono</label>
                        <input
                            type="tel"
                            className="input-field"
                            placeholder="Ej. 809-555-0199"
                            {...register('phone')}
                        />
                    </div>

                    {/* Campo para subir foto del documento de identificación */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Image size={15} style={{ color: '#3b82f6' }} />
                            Documento de Identificación (Foto Cédula / Pasaporte)
                        </label>

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />

                        {!documentPreview ? (
                            <div 
                                className="document-upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud size={32} className="upload-icon" />
                                <div className="upload-text">
                                    <span className="upload-prompt">Haz clic para subir o arrastra la foto</span>
                                    <span className="upload-subtext">JPG, PNG o WEBP (máx. 10MB)</span>
                                </div>
                            </div>
                        ) : (
                            <div className="document-preview-card">
                                <img src={documentPreview} alt="Vista previa del documento" className="document-preview-img" />
                                <div className="document-preview-info">
                                    <div className="document-filename">{documentFile?.name || 'documento.jpg'}</div>
                                    <div className="document-filesize">
                                        {documentFile ? `${(documentFile.size / 1024).toFixed(1)} KB` : ''}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-remove-doc"
                                    onClick={handleRemoveFile}
                                    title="Quitar foto"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose} disabled={loading}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{loading ? (isUploading ? 'Subiendo foto...' : 'Guardando...') : 'Guardar Cliente'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomerModal;
