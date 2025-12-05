import DataTable from 'react-data-table-component';
import Link from 'next/link';

export default function ClassAttendanceDataTable({ columns, data, pagination, paginationServer, paginationTotalRows, paginationPerPage, currentPage, onChangePage, onChangeRowsPerPage, paginationRowsPerPageOptions }) {
  const colors = {
    primary: '#1f2937',
    secondary: '#374151',
    accent: '#fbbf24',
    text: '#e5e7eb',
    border: '#4b5563',
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
      responsive={true}
      fixedHeaderScrollHeight="300px"
      direction="auto"
      subHeaderWrap
      customStyles={{
        table: {
          style: {
            backgroundColor: colors.primary,
            color: colors.text,
          },
        },
        headRow: {
          style: {
            backgroundColor: colors.secondary,
            borderBottomWidth: '2px',
            borderBottomColor: colors.border,
            borderBottomStyle: 'solid',
          },
        },
        headCells: {
          style: {
            fontSize: '0.875rem',
            fontWeight: '700',
            color: colors.accent,
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
        rows: {
          style: {
            fontSize: '0.875rem',
            color: colors.text,
            backgroundColor: colors.primary,
            borderBottomWidth: '1px',
            borderBottomColor: colors.border,
            borderBottomStyle: 'solid',
            '&:hover': {
              backgroundColor: colors.secondary,
              // cursor: 'pointer',
            },
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
            backgroundColor: colors.primary,
            borderTopWidth: '1px',
            borderTopColor: colors.border,
            borderTopStyle: 'solid',
            color: colors.text,
          },
          pageButtonsStyle: {
            color: colors.accent,
            fill: colors.accent,
            '&:disabled': {
              color: colors.border,
              fill: colors.border,
            },
            '&:hover:not(:disabled)': {
              backgroundColor: colors.secondary,
            },
          },
        },
      }}
    />
  );
}
