import React, { useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Reusable DataTable Component with consistent styling
 * @param {Object} props - All react-data-table-component props
 */
export default function StyledDataTable(props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const customStyles = useMemo(() => ({
    table: {
      style: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#1f2937',
      },
    },
    header: {
      style: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#1f2937',
        fontSize: '1.25rem',
        fontWeight: '700',
      },
    },
    headRow: {
      style: {
        backgroundColor: isDark ? '#374151' : '#f3f4f6',
        borderBottomWidth: '1px',
        borderBottomColor: isDark ? '#4b5563' : '#d1d5db',
        minHeight: '52px',
      },
    },
    headCells: {
      style: {
        color: isDark ? '#fbbf24' : '#374151',
        fontWeight: '600',
        fontSize: '0.875rem',
        paddingLeft: '16px',
        paddingRight: '16px',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
      },
    },
    rows: {
      style: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#d1d5db' : '#1f2937',
        fontSize: '0.875rem',
        borderBottomWidth: '1px',
        borderBottomColor: isDark ? '#374151' : '#e5e7eb',
        minHeight: '60px',
      },
      highlightOnHoverStyle: {
        backgroundColor: isDark ? '#374151' : '#f9fafb',
        color: isDark ? '#fff' : '#000',
        transitionDuration: '0.15s',
        transitionProperty: 'background-color',
        borderBottomColor: isDark ? '#4b5563' : '#d1d5db',
        outline: 'none',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    pagination: {
      style: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#d1d5db' : '#1f2937',
        borderTopWidth: '1px',
        borderTopColor: isDark ? '#4b5563' : '#d1d5db',
      },
      pageButtonsStyle: {
        borderRadius: '50%',
        height: '32px',
        width: '32px',
        padding: '6px',
        margin: '2px',
        cursor: 'pointer',
        transition: '0.2s',
        color: isDark ? '#d1d5db' : '#1f2937',
        fill: isDark ? '#d1d5db' : '#1f2937',
        backgroundColor: 'transparent',
        '&:hover:not(:disabled)': {
          backgroundColor: isDark ? '#374151' : '#f3f4f6',
        },
        '&:focus': {
          outline: 'none',
          backgroundColor: isDark ? '#374151' : '#f3f4f6',
        },
        '&:disabled': {
          cursor: 'not-allowed',
          color: isDark ? '#4b5563' : '#9ca3af',
          fill: isDark ? '#4b5563' : '#9ca3af',
        },
      },
    },
    noData: {
      style: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#d1d5db' : '#1f2937',
        padding: '24px',
      },
    },
  }), [isDark]);

  return (
    <DataTable
      {...props}
      customStyles={customStyles}
      highlightOnHover
      pointerOnHover
      responsive
    />
  );
}
