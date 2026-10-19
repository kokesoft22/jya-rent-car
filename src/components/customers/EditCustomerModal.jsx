import React, { useEffect, useState, useRef } from 'react';
import { X, Save, Loader, UploadCloud, Trash2, Image, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { customerService } from '../../services/customerService';

const customerSchema = z.object({
    full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    id_number: z.string().min(6, "La identificación debe tener al menos 6 caracteres"),
    phone: z.string().optional().nullable(),
    email: z.string().email("Correo electrónico inválido").optional().nullable().or(z.literal('')),
});

const EditCustomerModal = ({ isOpen, onClose, customer, onCustomerUpdated }) => {
    const [documentFile, setDocumentFile] = useState(null);
    const [documentPreview, setDocumentPreview] = useState(null);
    const [existingDocumentUrl, setExistingDocumentUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            full_name: '',
            id_number: '',
            phone: '',
            email: ''
        }
    });

    useEffect(() => {
        if (isOpen && customer) {
            reset({
                full_name: customer.full_name || '',
                id_number: customer.id_number || '',
                phone: customer.phone || '',
                email: customer.email || ''
            });
            setExistingDocumentUrl(customer.id_document_url || null);
            setDocumentFile(null);
            setDocumentPreview(null);
        }
    }, [isOpen, customer, reset]);

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

    const handleRemoveNewFile = () => {
        if (documentPreview) {
            URL.revokeObjectURL(documentPreview);
        }
        setDocumentFile(null);
        setDocumentPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveExistingDoc = () => {
        setExistingDocumentUrl(null);
    };

    if (!isOpen || !customer) return null;

    const loading = isSubmitting || isUploading;

    const onSubmit = async (data) => {
        try {
            setIsUploading(true);
            let finalDocUrl = existingDocumentUrl;

            if (documentFile) {
                finalDocUrl = await customerService.uploadDocument(documentFile);
            }

            await customerService.update(customer.id, {
                ...data,
                id_document_url: finalDocUrl
            });

            toast.success('Cliente actualizado con éxito');
            onCustomerUpdated();
            onClose();
        } catch (err) {
            console.error('Error al actualizar cliente:', err);
            toast.error('Error al actualizar cliente: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '540px' }}>
                <div className="modal-header">
                    <h2>Editar Cliente</h2>
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

                    {/* Foto del Documento de Identificación */}
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

                        {/* Nueva foto seleccionada */}
                        {documentPreview ? (
                            <div className="document-preview-card">
                                <img src={documentPreview} alt="Nueva foto seleccionada" className="document-preview-img" />
                                <div className="document-preview-info">
                                    <div className="document-filename">{documentFile?.name || 'nueva_foto.jpg'}</div>
                                    <div className="document-filesize" style={{ color: '#10b981' }}>
                                        Nueva foto para guardar
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-remove-doc"
                                    onClick={handleRemoveNewFile}
                                    title="Cancelar nueva foto"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : existingDocumentUrl ? (
                            /* Foto existente guardada en base de datos */
                            <div className="document-preview-card">
                                <img src={existingDocumentUrl} alt="Documento actual" className="document-preview-img" />
                                <div className="document-preview-info">
                                    <div className="document-filename">Documento Guardado</div>
                                    <a 
                                        href={existingDocumentUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="document-view-link"
                                    >
                                        Ver original <ExternalLink size={12} />
                                    </a>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        type="button"
                                        className="btn-subtle"
                                        style={{ padding: '6px 10px', fontSize: '12px' }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Cambiar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-remove-doc"
                                        onClick={handleRemoveExistingDoc}
                                        title="Eliminar documento"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Sin foto */
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
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-subtle" onClick={onClose} disabled={loading}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{loading ? (isUploading ? 'Subiendo foto...' : 'Guardando...') : 'Guardar Cambios'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCustomerModal;
