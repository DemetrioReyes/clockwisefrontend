import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  itemsPerPage?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  total,
  itemsPerPage
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Número de páginas a mostrar

    if (totalPages <= showPages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas con ellipsis
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = total && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem = total && itemsPerPage ? Math.min(currentPage * itemsPerPage, total) : null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      {/* Información de resultados */}
      {total && startItem && endItem && (
        <div className="hidden sm:block">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </p>
        </div>
      )}

      {/* Botones de paginación */}
      <div className="flex items-center space-x-2">
        {/* Primera página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronsLeft className="h-5 w-5 text-gray-600" />
        </button>

        {/* Página anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        {/* Números de página */}
        <div className="hidden sm:flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Página actual en móvil */}
        <div className="sm:hidden px-3 py-2 text-sm font-medium text-gray-700">
          Page {currentPage} of {totalPages}
        </div>

        {/* Página siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>

        {/* Última página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Last page"
        >
          <ChevronsRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
