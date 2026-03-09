import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    UserPlus,
    MoreVertical,
    Phone,
    Mail,
    CreditCard,
    AlertTriangle,
    Trash2,
    Edit2
} from 'lucide-react';
import { customerService } from '../services/customerService';

import AddCustomerModal from './AddCustomerModal';

const CustomerRow = ({ customer, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <tr key={customer.id}>
            <td>
                <div className="user-info-cell">
                    <div className="avatar-small">{customer.full_name.charAt(0)}</div>
                    <span>{customer.full_name}</span>
                </div>
            </td>
            <td>
                <div className="icon-text-cell">
                    <CreditCard size={14} />
                    <span>{customer.id_number}</span>
                </div>
            </td>
            <td>
                <div className="icon-text-cell">
                    <Phone size={14} />
                    <span>{customer.phone || 'N/A'}</span>
                </div>
            </td>
            <td>
                <div className="icon-text-cell">
                    <Mail size={14} />
                    <span>{customer.email || 'N/A'}</span>
                </div>
            </td>
            <td>
                <div className="action-menu-container">
                    <button
                        className={`btn-icon ${showMenu ? 'active' : ''}`}
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreVertical size={18} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="menu-backdrop" onClick={() => setShowMenu(false)}></div>
                            <div className="actions-dropdown">
                                <button className="dropdown-item">
                                    <Edit2 size={14} /> Editar Cliente
                                </button>
                                <button
                                    className="dropdown-item delete"
                                    onClick={() => {
                                        if (window.confirm('¿Está seguro de eliminar este cliente?')) {
                                            onDelete(customer.id);
                                        }
                                        setShowMenu(false);
                                    }}
                                >
                                    <Trash2 size={14} /> Eliminar Cliente
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await customerService.getAll();
            setCustomers(data);
        } catch (err) {
            console.error('Error loading customers:', err);
            setError('No se pudieron cargar los clientes.');
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteCustomer = async (id) => {
        try {
            await customerService.delete(id);
            loadCustomers();
        } catch (err) {
            alert('Error al eliminar cliente: ' + err.message);
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
            </div>

            {error && (
                <div className="error-message glass-card">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                    <button onClick={loadCustomers} className="btn-subtle">Reintentar</button>
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
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Cargando clientes...</td></tr>
                            ) : filteredCustomers.length > 0 ? (
                                filteredCustomers.map(customer => (
                                    <CustomerRow
                                        key={customer.id}
                                        customer={customer}
                                        onDelete={handleDeleteCustomer}
                                    />
                                ))
                            ) : (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No hay clientes registrados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddCustomerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onCustomerAdded={loadCustomers}
            />
        </div>
    );
};

export default Customers;
