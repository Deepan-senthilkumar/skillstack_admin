import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationControls({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = 'entries'
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - 2 && i > 1) ||
        (i === currentPage + 2 && i < totalPages)
      ) {
        pages.push('...');
      }
    }
    return pages.filter((item, index) => item !== '...' || pages[index - 1] !== '...');
  };

  return (
    <div
      className="pagination-controls-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 20px',
        borderTop: '1px solid #E2E8F0',
        background: '#FAFAFA',
        borderBottomLeftRadius: '14px',
        borderBottomRightRadius: '14px',
      }}
    >
      {/* Left: Summary text */}
      <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
        Showing <span style={{ color: '#0F172A', fontWeight: 700 }}>{startIdx}</span> to{' '}
        <span style={{ color: '#0F172A', fontWeight: 700 }}>{endIdx}</span> of{' '}
        <span style={{ color: '#7B1C6E', fontWeight: 800 }}>{totalItems}</span> {itemName}
      </div>

      {/* Right: Page Size Selector & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Page size dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              if (onPageSizeChange) {
                onPageSizeChange(Number(e.target.value));
              }
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0F172A',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt} per page
              </option>
            ))}
          </select>
        </div>

        {/* Buttons (Prev, page pills, Next) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange && onPageChange(Math.max(currentPage - 1, 1))}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1.5px solid #E2E8F0',
              background: currentPage <= 1 ? '#F1F5F9' : '#FFFFFF',
              color: currentPage <= 1 ? '#94A3B8' : '#0F172A',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12.5px',
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
          >
            <ChevronLeft size={14} /> Prev
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94A3B8', fontSize: '13px' }}>
                    …
                  </span>
                );
              }
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange && onPageChange(p)}
                  style={{
                    minWidth: '32px',
                    height: '32px',
                    padding: '0 6px',
                    borderRadius: '8px',
                    border: isActive ? '1.5px solid #7B1C6E' : '1.5px solid #E2E8F0',
                    background: isActive ? '#7B1C6E' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#0F172A',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange && onPageChange(Math.min(currentPage + 1, totalPages))}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1.5px solid #E2E8F0',
              background: currentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
              color: currentPage >= totalPages ? '#94A3B8' : '#0F172A',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12.5px',
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
