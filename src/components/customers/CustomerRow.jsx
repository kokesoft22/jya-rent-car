import React, { useState } from 'react';
import { CreditCard, Phone, Mail, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const CustomerRow = ({ customer, onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <tr key={customer.id}>
            <td>
                <div className="user-info-cell">
                    <div className="avatar-small">{customer.full_name?.charAt(0) || '?'}</div>
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
                                <button className="dropdown-item" onClick={() => {
                                    setShowMenu(false);
                                    onEdit(customer);
                                }}>
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

export default CustomerRow;
