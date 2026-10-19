import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, UserPlus, AlertTriangle, ShieldAlert, Filter } from 'lucide-react';
import { useCustomers, useDeleteCustomer, useUnblacklistCustomer } from '../hooks/useCustomers';
import CustomerRow from '../components/customers/CustomerRow';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import EditCustomerModal from '../components/customers/EditCustomerModal';
import CustomerDetailsModal from '../components/customers/CustomerDetailsModal';
import BlacklistModal from '../components/customers/BlacklistModal';

import '../components/Customers.css';

const Customers = () => {
    const navigate = useNavigate();
    const { data: customers = [], isLoading, error, refetch } = useCustomers();
    const deleteCustomerMutation = useDeleteCustomer();
    const unblacklistMutation = useUnblacklistCustomer();

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [filterMode, setFilterMode] = useState('all'); // 'all', 'active', 'blacklisted'
    
    // State for editing
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState(null);

    // State for viewing details
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [customerToView, setCustomerToView] = useState(null);

    // State for blacklist modal
    const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
    const [customerToBlacklist, setCustomerToBlacklist] = useState(null);

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = 
            c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.id_number?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filterMode === 'blacklisted') return matchesSearch && c.is_blacklisted;
        if (filterMode === 'active') return matchesSearch && !c.is_blacklisted;
        return matchesSearch;
    });

    const blacklistedCount = customers.filter(c => c.is_blacklisted).length;

    const handleDeleteCustomer = async (id) => {
        try {
            await deleteCustomerMutation.mutateAsync(id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditCustomer = (customer) => {
        setCustomerToEdit(customer);
        setIsEditModalOpen(true);
    };

    const handleViewDetails = (customer) => {
        setCustomerToView(customer);
        setIsDetailsModalOpen(true);
    };

    const handleBlacklist = (customer) => {
        setCustomerToBlacklist(customer);
        setIsBlacklistModalOpen(true);
    };

    const handleUnblacklist = async (customer) => {
        if (window.confirm(`¿Deseas remover a "${customer.full_name}" de la lista negra?`)) {
            try {
                await unblacklistMutation.mutateAsync(customer.id);
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="page-content customers">
            <header className="customers-header">
                <div>
                    <h1 className="page-title">Gestión de Clientes</h1>
                    <p className="page-subtitle">Visualiza y gestiona la información de tus clientes registrados.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus size={18} />
                    <span>Añadir Cliente</span>
                </button>
            </header>

            <div className="customers-controls glass-card">
                <div className="control-section">
                    <span className="control-label">Búsqueda de Clientes</span>
                    <div className="search-input">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Nombre, teléfono o identificación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="control-section filter-section">
                    <span className="control-label">Filtrar por</span>
                    <div className="filter-buttons">
                        <button 
                            className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterMode('all')}
                        >
                            <Users size={14} />
                            Todos ({customers.length})
                        </button>
                        <button 
                            className={`filter-btn ${filterMode === 'active' ? 'active' : ''}`}
                            onClick={() => setFilterMode('active')}
                        >
                            <Filter size={14} />
                            Activos ({customers.length - blacklistedCount})
                        </button>
                        <button 
                            className={`filter-btn filter-btn-danger ${filterMode === 'blacklisted' ? 'active' : ''}`}
                            onClick={() => setFilterMode('blacklisted')}
                        >
                            <ShieldAlert size={14} />
                            Lista Negra ({blacklistedCount})
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message glass-card">
                    <AlertTriangle size={20} />
                    <span>No se pudieron cargar los clientes. {error.message}</span>
                    <button onClick={() => refetch()} className="btn-subtle">Reintentar</button>
                </div>
            )}

            <div className="glass-card customers-table-container">
                <div className="customers-table-wrapper">
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>Identificación</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Cargando clientes...</td></tr>
                            ) : filteredCustomers.length > 0 ? (
                                filteredCustomers.map(customer => (
                                    <CustomerRow
                                        key={customer.id}
                                        customer={customer}
                                        onEdit={handleEditCustomer}
                                        onDelete={handleDeleteCustomer}
                                        onViewDetails={handleViewDetails}
                                        onNewRental={(cust) => navigate('/new-rental', { state: { client: cust } })}
                                        onBlacklist={handleBlacklist}
                                        onUnblacklist={handleUnblacklist}
                                    />
                                ))
                            ) : (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                    {filterMode === 'blacklisted' 
                                        ? 'No hay clientes en lista negra.' 
                                        : 'No hay clientes encontrados.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AddCustomerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onCustomerAdded={() => refetch()}
            />

            <EditCustomerModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setCustomerToEdit(null);
                }}
                customer={customerToEdit}
                onCustomerUpdated={() => refetch()}
            />

            <CustomerDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setCustomerToView(null);
                }}
                customer={customerToView}
            />

            <BlacklistModal
                isOpen={isBlacklistModalOpen}
                onClose={() => {
                    setIsBlacklistModalOpen(false);
                    setCustomerToBlacklist(null);
                }}
                customer={customerToBlacklist}
                onBlacklisted={() => refetch()}
            />
        </div>
    );
};

export default Customers;
