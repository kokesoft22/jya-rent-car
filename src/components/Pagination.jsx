import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
    if (totalPages <= 1) return null;

    const firstItem = (currentPage - 1) * itemsPerPage + 1;
    const lastItem = Math.min(currentPage * itemsPerPage, totalItems);
    const pages = totalPages <= 7
        ? Array.from({ length: totalPages }, (_, index) => index + 1)
        : currentPage <= 4
            ? [1, 2, 3, 4, 5, '...', totalPages]
            : currentPage >= totalPages - 3
                ? [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
                : [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];

    return (
        <div className="pagination-controls">
            <span className="pagination-summary">
                Mostrando {firstItem}-{lastItem} de {totalItems}
            </span>
            <nav className="pagination-nav" aria-label="Paginación">
                <button
                    type="button"
                    className="pagination-button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                >
                    <ChevronLeft size={16} />
                </button>
                {pages.map((page, index) => page === '...' ? (
                    <span className="pagination-ellipsis" key={`ellipsis-${index}`} aria-hidden="true">…</span>
                ) : (
                    <button
                        type="button"
                        className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                        key={page}
                        onClick={() => onPageChange(page)}
                        aria-label={`Página ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                    >
                        {page}
                    </button>
                ))}
                <button
                    type="button"
                    className="pagination-button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Página siguiente"
                >
                    <ChevronRight size={16} />
                </button>
            </nav>
        </div>
    );
};

export default Pagination;
