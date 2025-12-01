// DataTable untuk membership/plans
'use client';
import Link from "next/link";
import DataTable from 'react-data-table-component';

const colors = {
  gray900: '#111827',
  gray800: '#1f2937',
  gray700: '#374151',
  gray600: '#4b5563',
  gray300: '#d1d5db',
  gray100: '#f3f4f6',
  blue600: '#2563eb',
};

const tailwindStyles = {
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
      color: colors.gray100,
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
      '&:hover': {
        backgroundColor: colors.gray700,
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

export default function MembershipPlansDataTable({ data }) {
  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px', center: true },
    { 
      name: 'Name', 
      selector: row => row.name, 
      sortable: true,
      cell: row => <span className="font-semibold">{row.name}</span>,
    },
    { name: 'Duration', selector: row => `${row.duration_value} ${row.duration_unit}`, sortable: true },
    { name: 'Price', selector: row => row.price?.toLocaleString('id-ID'), sortable: true },
    { name: 'Description', selector: row => row.description, sortable: true },
    {
      name: 'Actions',
      minWidth: '150px',
      cell: row => (
        <div className="flex gap-2 justify-center">
          <Link href={`/admin/membership/plans/edit?id=${row.id}`} className="bg-gray-400 text-white px-3 py-1 rounded-md font-semibold hover:bg-gray-500">
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
