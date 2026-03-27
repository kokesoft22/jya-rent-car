import React, { useState } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { VehicleCard } from '../components/fleet/VehicleCard';
import AddVehicleModal from '../components/fleet/AddVehicleModal';
import { EditVehicleModal } from '../components/fleet/EditVehicleModal';
import { VehicleDetailModal } from '../components/fleet/VehicleDetailModal';
import { useVehicles, useDeleteVehicle } from '../hooks/useVehicles';
import { useActiveRentals } from '../hooks/useRentals';
import { getLocalTodayDate, normalizeDate } from '../utils/dateUtils';
import './Fleet.css';

const Fleet = () => {
    const queryClient = useQueryClient();
    const { data: vehicles = [], isLoading, isError, error } = useVehicles();
    const deleteVehicleMutation = useDeleteVehicle();
    const today = getLocalTodayDate();
    const { data: activeRentals = [] } = useActiveRentals(today);

    console.log('FLEET DATA:', vehicles);

    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editVehicle, setEditVehicle] = useState(null);
    const [detailVehicle, setDetailVehicle] = useState(null);

    const filteredVehicles = vehicles.map(v => {
        // Calculate dynamic status for filtering
        const currentRental = activeRentals.find(r => r.vehicle_id === v.id);
        const effectiveStatus = currentRental ? 'rented' : (v.status === 'rented' ? 'available' : (v.status || 'available'));
        return { ...v, effectiveStatus, currentRental };
    }).filter(v => {
        let statusMatch = true;
        if (filter !== 'all') {
            const statusMap = {
                'disponible': 'available',
                'rentado': 'rented',
                'mantenimiento': 'maintenance'
            };
            statusMatch = v.effectiveStatus === statusMap[filter];
        }
        const searchMatch =
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.year.toString().includes(searchTerm);
        return statusMatch && searchMatch;
    });

    const handleDeleteVehicle = (vehicle) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar "${vehicle.model}"? Esta acción no se puede deshacer.`)) {
            deleteVehicleMutation.mutate(vehicle.id);
        }
    };

    return (
        <div className="page-content fleet">
            <header className="fleet-header">
                <div>
                    <h1 className="page-title">Gestión de la Flota</h1>
                    <p className="page-subtitle">Tienes un total de {vehicles.length} vehículos en tu lista.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    <span>Añadir Vehículo</span>
                </button>
            </header>

            <div className="fleet-controls glass-card">
                <div className="search-input">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por modelo, placa o año..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
                    <button className={`filter-btn ${filter === 'disponible' ? 'active' : ''}`} onClick={() => setFilter('disponible')}>Disponible</button>
                    <button className={`filter-btn ${filter === 'rentado' ? 'active' : ''}`} onClick={() => setFilter('rentado')}>Rentado</button>
                    <button className={`filter-btn ${filter === 'mantenimiento' ? 'active' : ''}`} onClick={() => setFilter('mantenimiento')}>
                        <span className="full-text">Mantenimiento</span>
                        <span className="short-text">Mant.</span>
                    </button>
                </div>
            </div>

            {isError && (
                <div className="error-message glass-card">
                    <AlertTriangle size={20} />
                    <span>{error.message.includes('Supabase credentials') ? 'Configuración pendiente: Agregue sus claves de Supabase al archivo .env' : 'No se pudieron cargar los vehículos. Verifica tu conexión.'}</span>
                </div>
            )}

            {isLoading ? (
                <div className="loading-state">Cargando flota...</div>
            ) : (
                <div className="vehicle-grid">
                    {filteredVehicles.length > 0 ? (
                        filteredVehicles.map(v => (
                            <VehicleCard
                                key={v.id}
                                vehicle={v}
                                currentRental={v.currentRental}
                                onEdit={(veh) => setEditVehicle(veh)}
                                onDelete={handleDeleteVehicle}
                                onView={(veh) => setDetailVehicle(veh)}
                            />
                        ))
                    ) : (
                        <div className="empty-state">
                            {!isError && <p>No se encontraron vehículos.</p>}
                        </div>
                    )}
                </div>
            )}

            <AddVehicleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onVehicleAdded={() => { setIsModalOpen(false); /* React Query will invalidate automatically */ }}
            />

            <EditVehicleModal
                vehicle={editVehicle}
                isOpen={!!editVehicle}
                onSaved={() => {
                    setEditVehicle(null);
                    queryClient.invalidateQueries(['vehicles']);
                }}
                onClose={() => setEditVehicle(null)}
            />

            <VehicleDetailModal
                vehicle={detailVehicle}
                isOpen={!!detailVehicle}
                onClose={() => {
                    setDetailVehicle(null);
                    queryClient.invalidateQueries(['vehicles']);
                }}
            />
        </div>
    );
};

export default Fleet;
