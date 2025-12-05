import React from 'react';
import DataTable from 'react-data-table-component';

/**
 * Reusable DataTable Component with consistent styling
 * @param {Object} props - All react-data-table-component props
 */
export default function StyledDataTable(props) {
  const colors = {
    gray900: '#111827',
    gray800: '#1f2937',
    gray700: '#374151',
    gray600: '#4b5563',
    gray300: '#d1d5db',
    gray100: '#f3f4f6',
    accent: '#fbbf24',
  };

  const customStyles = {
    table: {
      style: {
        backgroundColor: colors.gray800,
        color: colors.gray100,
      },
    },
    header: {
      style: {
        backgroundColor: colors.gray800,
        color: colors.gray100,
        fontSize: '1.25rem',
        fontWeight: '700',
      },
    },
    headRow: {
      style: {
        backgroundColor: colors.gray700,
        borderBottomWidth: '1px',
        borderBottomColor: colors.gray600,
        minHeight: '52px',
      },
    },
    headCells: {
      style: {
        color: colors.accent,
        fontWeight: '600',
        fontSize: '0.875rem',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        backgroundColor: colors.gray800,
        color: colors.gray300,
        fontSize: '0.875rem',
        borderBottomWidth: '1px',
        borderBottomColor: colors.gray700,
        minHeight: '60px',
      },
      highlightOnHoverStyle: {
        backgroundColor: colors.gray700,
        color: '#fff',
        transitionDuration: '0.15s',
        transitionProperty: 'background-color',
        borderBottomColor: colors.gray600,
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
        backgroundColor: colors.gray800,
        color: colors.gray300,
        borderTopWidth: '1px',
        borderTopColor: colors.gray600,
      },
      pageButtonsStyle: {
        borderRadius: '50%',
        height: '32px',
        width: '32px',
        padding: '6px',
        margin: '2px',
        cursor: 'pointer',
        transition: '0.2s',
        color: colors.gray300,
        fill: colors.gray300,
        backgroundColor: 'transparent',
        '&:hover:not(:disabled)': {
          backgroundColor: colors.gray700,
        },
        '&:focus': {
          outline: 'none',
          backgroundColor: colors.gray700,
        },
        '&:disabled': {
          cursor: 'not-allowed',
          color: colors.gray600,
          fill: colors.gray600,
        },
      },
    },
    noData: {
      style: {
        backgroundColor: colors.gray800,
        color: colors.gray300,
        padding: '24px',
      },
    },
  };

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
