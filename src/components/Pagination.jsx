import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Pagination({ page, totalPages, onChange, totalRecords, pageSize }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalRecords);

  // Show max 5 page buttons
  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer', border: '1px solid #e2e8f0',
    transition: 'all 0.15s'
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#fafafa'
    }}>
      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
        Showing <strong style={{ color: '#475569' }}>{from}–{to}</strong> of <strong style={{ color: '#475569' }}>{totalRecords}</strong> records
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Prev */}
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          style={{
            ...btnBase,
            background: page === 1 ? '#f8fafc' : 'white',
            color: page === 1 ? '#cbd5e1' : '#475569',
            cursor: page === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <FaChevronLeft style={{ fontSize: '11px' }} />
        </button>

        {/* Page numbers */}
        {getPages().map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              ...btnBase,
              background: p === page ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'white',
              color: p === page ? 'white' : '#475569',
              border: p === page ? 'none' : '1px solid #e2e8f0',
              boxShadow: p === page ? '0 2px 8px rgba(14,165,233,0.35)' : 'none'
            }}
          >
            {p}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          style={{
            ...btnBase,
            background: page === totalPages ? '#f8fafc' : 'white',
            color: page === totalPages ? '#cbd5e1' : '#475569',
            cursor: page === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          <FaChevronRight style={{ fontSize: '11px' }} />
        </button>
      </div>
    </div>
  );
}
