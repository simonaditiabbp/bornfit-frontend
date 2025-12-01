import DataTable from 'react-data-table-component';

export default function BookingDataTable({ columns, data, pagination, paginationServer, paginationTotalRows, paginationPerPage, currentPage, onChangePage, onChangeRowsPerPage, paginationRowsPerPageOptions }) {
  const colors = {
    bgPrimary: '#1f2937',
    bgSecondary: '#374151',
    textPrimary: '#f3f4f6',
    textSecondary: '#d1d5db',
    border: '#4b5563',
    hover: '#4b5563'
  };

  const tailwindStyles = {
    table: {
      style: {
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
      },
    },
    headRow: {
      style: {
        backgroundColor: colors.bgSecondary,
        borderBottomWidth: '1px',
        borderBottomColor: colors.border,
        borderBottomStyle: 'solid',
        minHeight: '56px',
      },
    },
    headCells: {
      style: {
        fontSize: '0.95rem',
        fontWeight: 'bold',
        color: colors.textPrimary,
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        fontSize: '1rem',
        color: colors.textSecondary,
        backgroundColor: colors.bgPrimary,
        minHeight: '48px',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: colors.border,
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: colors.hover,
        borderBottomColor: colors.border,
        outline: 'none',
      },
    },
    pagination: {
      style: {
        backgroundColor: colors.bgSecondary,
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: colors.border,
        color: colors.textPrimary,
        minHeight: '56px',
      },
      pageButtonsStyle: {
        borderRadius: '4px',
        height: '32px',
        width: '32px',
        padding: '4px',
        margin: '0 4px',
        cursor: 'pointer',
        transition: '0.2s',
        color: colors.textPrimary,
        fill: colors.textPrimary,
        backgroundColor: 'transparent',
        '&:disabled': {
          cursor: 'unset',
          color: colors.border,
          fill: colors.border,
        },
        '&:hover:not(:disabled)': {
          backgroundColor: colors.hover,
        },
      },
    },
  };
  
  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
      paginationServer={paginationServer}
      paginationTotalRows={paginationTotalRows}
      paginationPerPage={paginationPerPage}
      paginationDefaultPage={currentPage}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      paginationRowsPerPageOptions={paginationRowsPerPageOptions}
      highlightOnHover
      responsive={true}
      fixedHeaderScrollHeight="500px"
      direction="auto"
      subHeaderWrap
      customStyles={tailwindStyles}
    />
  );
}
