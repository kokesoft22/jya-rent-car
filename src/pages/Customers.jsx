import React, { useState } from 'react';
import { Users, Search, UserPlus, AlertTriangle } from 'lucide-react';
import { useCustomers, useDeleteCustomer } from '../hooks/useCustomers';
import CustomerRow from '../components/customers/CustomerRow';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import EditCustomerModal from '../components/customers/EditCustomerModal';
import CustomerDetailsModal from '../components/customers/CustomerDetailsModal';

import '../components/Customers.css';

const Customers = () => {
    const { data: customers = [], isLoading, error, refetch } = useCustomers();
    const deleteCustomerMutation = useDeleteCustomer();

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // State for editing
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState(null);

    // State for viewing details
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [customerToView, setCustomerToView] = useState(null);

    const filteredCustomers = customers.filter(c =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                    />
                                ))
                            ) : (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No hay clientes encontrados.</td></tr>
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
        </div>
    );
};

export default Customers;
