// DataTable untuk membership/schedules
'use client';
import { useMemo } from 'react';
import Link from "next/link";
import DataTable from 'react-data-table-component';
import { useTheme } from '@/contexts/ThemeContext';

export default function MembershipSchedulesDataTable({ data }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tailwindStyles = useMemo(() => ({
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
        '&:hover': {
          backgroundColor: isDark ? '#374151' : '#f9fafb',
          transition: 'all 0.2s',
          color: isDark ? '#fff' : '#000',
        },
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
        borderTopColor: isDark ? '#4b5563' : '#d1d5db',
      },
    },
  }), [isDark]);

  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px', center: "true" },
    { 
      name: 'Plan', 
      selector: row => row.membershipPlan?.name || '-', 
      sortable: true,
      cell: row => <span className="font-semibold">{row.membershipPlan?.name || '-'}</span>,
    },
    { name: 'Hari', selector: row => row.day_of_week || '-', sortable: true },
    { name: 'Jam Mulai', selector: row => row.start_time || '-', sortable: true },
    { name: 'Jam Selesai', selector: row => row.end_time || '-', sortable: true },
    { name: 'Tanggal Dibuat', selector: row => row.created_at ? row.created_at.slice(0,10) : '-', sortable: true },
    {
      name: 'Actions',
      minWidth: '150px',
      cell: row => (
        <div className="flex gap-2 justify-center">
          <Link href={`/admin/membership/schedules/edit?id=${row.id}`} className="bg-gray-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">
            Detail
          </Link>
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination
      highlightOnHover
      responsive
      fixedHeaderScrollHeight="300px"
      direction="auto"
      subHeaderWrap
      customStyles={tailwindStyles}
      progressComponent={
        <div className="p-4 text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-800 w-full text-center">
          Loading data...
        </div>
      }
      noDataComponent={
        <div className="p-4 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 w-full text-center">
          No data found.
        </div>
      }
      />
  );
}
