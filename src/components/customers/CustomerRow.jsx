import React, { useState } from 'react';
import { CreditCard, Phone, MoreVertical, Edit2, Trash2, History, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';

const CustomerRow = ({ customer, onEdit, onDelete, onViewDetails, onNewRental, onBlacklist, onUnblacklist }) => {
    const [showMenu, setShowMenu] = useState(false);
    const isBlacklisted = customer.is_blacklisted;

    return (
        <tr key={customer.id} className={isBlacklisted ? 'blacklisted-row' : ''}>
            <td>
                <div className="user-info-cell">
                    <div className={`avatar-small ${isBlacklisted ? 'avatar-blacklisted' : ''}`}>
                        {isBlacklisted ? <ShieldAlert size={18} /> : (customer.full_name?.charAt(0) || '?')}
                    </div>
                    <div className="user-name-cell">
                        <button
                            type="button"
                            className="customer-name-link"
                            onClick={() => onViewDetails?.(customer)}
                        >
                            {customer.full_name}
                        </button>
                        {isBlacklisted && (
                            <span className="blacklist-badge">
                                <ShieldAlert size={11} />
                                Lista Negra
                            </span>
                        )}
                    </div>
                </div>
            </td>
            <td>
                <div className="icon-text-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={14} />
                        <span>{customer.id_number}</span>
                    </div>
                </div>
            </td>
            <td>
                <div className="icon-text-cell">
                    <Phone size={14} />
                    <span>{customer.phone || 'N/A'}</span>
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
                                {!isBlacklisted && (
                                    <button className="dropdown-item" onClick={() => {
                                        setShowMenu(false);
                                        if(onNewRental) onNewRental(customer);
                                    }}>
                                        <Plus size={14} /> Nueva Renta
                                    </button>
                                )}
                                <button className="dropdown-item" onClick={() => {
                                    setShowMenu(false);
                                    if(onViewDetails) onViewDetails(customer);
                                }}>
                                    <History size={14} /> Historial de Rentas
                                </button>
                                <button className="dropdown-item" onClick={() => {
                                    setShowMenu(false);
                                    onEdit(customer);
                                }}>
                                    <Edit2 size={14} /> Editar Cliente
                                </button>

                                {isBlacklisted ? (
                                    <button
                                        className="dropdown-item unblacklist"
                                        onClick={() => {
                                            setShowMenu(false);
                                            if (onUnblacklist) onUnblacklist(customer);
                                        }}
                                    >
                                        <ShieldCheck size={14} /> Quitar de Lista Negra
                                    </button>
                                ) : (
                                    <button
                                        className="dropdown-item blacklist"
                                        onClick={() => {
                                            setShowMenu(false);
                                            if (onBlacklist) onBlacklist(customer);
                                        }}
                                    >
                                        <ShieldAlert size={14} /> Agregar a Lista Negra
                                    </button>
                                )}

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

export default CustomerRow;
