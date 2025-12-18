'use client';
import DataTable from 'react-data-table-component';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function UsersDataTable({ columns, data, setQrUser, pagination, paginationServer, paginationTotalRows, paginationPerPage, currentPage, onChangePage, onChangeRowsPerPage, paginationRowsPerPageOptions }) {
  const router = useRouter();
  const [loadingRow, setLoadingRow] = useState(null);
  const { theme } = useTheme();

  const customStyles = useMemo(() => {
    const isDark = theme === 'dark';
    return {
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
          borderBottomColor: isDark ? '#4b5563' : '#e5e7eb',
          minHeight: '52px',
        },
      },
      headCells: {
        style: {
          color: isDark ? '#f3f4f6' : '#374151',
          fontWeight: '600',
          fontSize: '0.875rem',
          paddingLeft: '16px',
          paddingRight: '16px',
        },
      },
      rows: {
        style: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#d1d5db' : '#4b5563',
          fontSize: '0.875rem',
          borderBottomWidth: '1px',
          borderBottomColor: isDark ? '#374151' : '#e5e7eb',
          minHeight: '60px',
          '&:hover': {
            backgroundColor: isDark ? '#374151' : '#f9fafb',
            transition: 'all 0.2s',
            color: isDark ? '#fff' : '#1f2937',
          },
        },
        highlightOnHoverStyle: {
          backgroundColor: isDark ? '#374151' : '#f9fafb',
          color: isDark ? '#fff' : '#1f2937',
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
          color: isDark ? '#d1d5db' : '#4b5563',
          borderTopWidth: '1px',
          borderTopColor: isDark ? '#4b5563' : '#e5e7eb',
        },
        pageButtonsStyle: {
          borderRadius: '50%',
          height: '32px',
          width: '32px',
          padding: '6px',
          margin: '2px',
          cursor: 'pointer',
          transition: '0.2s',
          color: isDark ? '#d1d5db' : '#4b5563',
          fill: isDark ? '#d1d5db' : '#4b5563',
          backgroundColor: 'transparent',
          '&:hover:not(:disabled)': {
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
          },
          '&:focus': {
            outline: 'none',
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
          },
        },
      },
    };
  }, [theme]);

  const updatedColumns = columns.map((column) => {
    if (column.name === 'Aksi') {
      return {
        ...column,
        cell: (row) => (
          <div className="flex gap-2">
            <button
              className="bg-gray-600 dark:bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-gray-700 dark:hover:bg-blue-700"
              onClick={() => setQrUser(row)}
            >
              Generate QR
            </button>
            <button
              className={`bg-gray-400 dark:bg-gray-400 text-white px-3 py-1 rounded font-semibold hover:bg-gray-500 dark:hover:bg-gray-500 ${loadingRow === row.id ? 'opacity-60 cursor-not-allowed' : ''}`}
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
      customStyles={customStyles}
      progressComponent={
          <div className="p-4 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 w-full text-center">
              Loading data...
          </div>
      }
      noDataComponent={
          <div className="p-4 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 w-full text-center">
              No data found.
          </div>
      }
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
  );
}
