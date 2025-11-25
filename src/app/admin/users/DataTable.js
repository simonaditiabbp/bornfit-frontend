'use client';
import DataTable from 'react-data-table-component';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const colors = {
  gray900: '#111827',
  gray800: '#1f2937', // Background utama container kamu
  gray700: '#374151', // Header background
  gray600: '#4b5563', // Border
  gray300: '#d1d5db', // Text secondary
  gray100: '#f3f4f6', // Text primary
  blue600: '#2563eb', // Primary action
};

const tailwindStyles = {
  table: {
    style: {
      backgroundColor: colors.gray800, // bg-gray-800
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
      backgroundColor: colors.gray700, // bg-gray-700 untuk header baris
      borderBottomWidth: '1px',
      borderBottomColor: colors.gray600,
      minHeight: '52px',
    },
  },
  headCells: {
    style: {
      color: colors.gray100, // text-gray-100
      fontWeight: '600',     // font-semibold
      fontSize: '0.875rem',  // text-sm
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
  rows: {
    style: {
      backgroundColor: colors.gray800, // bg-gray-800
      color: colors.gray300,           // text-gray-300
      fontSize: '0.875rem',            // text-sm
      borderBottomWidth: '1px',
      borderBottomColor: colors.gray700, // border-gray-700
      minHeight: '60px',
      '&:hover': {
        backgroundColor: colors.gray700, // hover:bg-gray-700
        transition: 'all 0.2s',
        color: '#fff',
      },
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
    },
  },
};

export default function UsersDataTable({ columns, data, setQrUser, pagination, paginationServer, paginationTotalRows, paginationPerPage, currentPage, onChangePage, onChangeRowsPerPage, paginationRowsPerPageOptions }) {
  const router = useRouter();
  const [loadingRow, setLoadingRow] = useState(null); // Track loading state for each row

  const updatedColumns = columns.map((column) => {
    if (column.name === 'Aksi') {
      return {
        ...column,
        cell: (row) => (
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700"
              onClick={() => setQrUser(row)}
            >
              Generate QR
            </button>
            <button
              className={`bg-gray-400 text-white px-3 py-1 rounded font-semibold hover:bg-gray-500 ${loadingRow === row.id ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={loadingRow === row.id}
              onClick={async () => {
                setLoadingRow(row.id);
                // Simulasi loading, ganti dengan request backend jika perlu
                await new Promise((resolve) => setTimeout(resolve, 2000));
                router.push(`/admin/users/${row.id}`);
                setLoadingRow(null);
              }}
            >
              {loadingRow === row.id ? 'Loading...' : 'Detail'}
            </button>
          </div>
        ),
      };
    }
    return column;
  });

  return (
    <DataTable
      columns={updatedColumns}
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
      fixedHeaderScrollHeight="300px"
      direction="auto"
      subHeaderWrap
      customStyles={tailwindStyles}
      progressComponent={
          <div className="p-4 text-gray-300 bg-gray-800 w-full text-center">
              Loading data...
          </div>
      }
      noDataComponent={
          <div className="p-4 text-gray-400 bg-gray-800 w-full text-center">
              Tidak ada data yang ditemukan.
          </div>
      }
      theme="dark"
    />
  );
}
