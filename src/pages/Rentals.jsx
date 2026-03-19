import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import { useRentals, useDeleteRental } from '../hooks/useRentals';
import { rentalService } from '../services/rentalService';
import RentalRow from '../components/rentals/RentalRow';
import PaymentModal from '../components/rentals/PaymentModal';
import EditRentalModal from '../components/rentals/EditRentalModal';
import { toast } from 'sonner';
import '../components/Rentals.css';

const Rentals = () => {
    const { data: rentals = [], isLoading, error, refetch } = useRentals();
    const deleteRentalMutation = useDeleteRental();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Modal states
    const [paymentRental, setPaymentRental] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    const [editRental, setEditRental] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const filteredRentals = rentals.filter(r => {
        const searchMatch =
            (r.vehicles?.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (r.customers?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        if (statusFilter === 'all') return searchMatch;
        return searchMatch && r.status === statusFilter;
    });

    const handleCompleteRental = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas marcar esta renta como completada? El vehículo volverá a estar disponible.')) {
            try {
                await rentalService.complete(id);
                toast.success('Renta completada exitosamente');
                refetch();
            } catch (err) {
                toast.error('Error al completar renta: ' + err.message);
            }
        }
    };

    const handleDeleteRental = async (id) => {
        try {
            await deleteRentalMutation.mutateAsync(id);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="page-content rentals">
            <header className="rentals-header">
                <div className="rentals-header-content">
                    <div>
                        <h1 className="page-title">Historial de Renta</h1>
                        <p className="page-subtitle">Gestiona tus contratos activos y revisa el historial de rentas.</p>
                    </div>
                    <Link to="/new-rental" className="btn-primary btn-small">
                        <Plus size={16} />
                        <span>Nueva Renta</span>
                    </Link>
                </div>
            </header>

            <div className="rentals-controls glass-card">
                <div className="control-section">
                    <span className="control-label">Búsqueda</span>
                    <div className="search-input">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Por cliente o vehículo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="control-section">
                    <span className="control-label">Filtrar por Estado</span>
                    <div className="filter-group">
                        <button
                            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >Todas</button>
                        <button
                            className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('active')}
                        >Activas</button>
                        <button
                            className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('completed')}
                        >Completadas</button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message glass-card">
                    <AlertTriangle size={20} />
                    <span>{error.message}</span>
                    <button onClick={() => refetch()} className="btn-subtle">Reintentar</button>
                </div>
            )}

            <div className="glass-card rentals-table-container">
                <div className="rentals-table-wrapper">
                    <table className="rentals-table">
                        <thead>
                            <tr>
                                <th>Vehículo</th>
                                <th>Cliente</th>
                                <th>Periodo</th>
                                <th>Total</th>
                                <th>Pago</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Cargando rentas...</td></tr>
                            ) : filteredRentals.length > 0 ? (
                                filteredRentals.map(r => (
                                    <RentalRow
                                        key={r.id}
                                        rental={r}
                                        onComplete={handleCompleteRental}
                                        onDelete={handleDeleteRental}
                                        onPayment={(rental) => {
                                            setPaymentRental(rental);
                                            setIsPaymentModalOpen(true);
                                        }}
                                        onEdit={(rental) => {
                                            setEditRental(rental);
                                            setIsEditModalOpen(true);
                                        }}
                                    />
                                ))
                            ) : (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No hay rentas registradas con estos filtros.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaymentModal
                rental={paymentRental}
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentRental(null);
                }}
                onPaymentSaved={() => refetch()}
            />

            <EditRentalModal
                rental={editRental}
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditRental(null);
                }}
            />
        </div>
    );
};

export default Rentals;
