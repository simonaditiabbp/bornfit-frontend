'use client';
import DataTable from 'react-data-table-component';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersDataTable({ columns, data, setQrUser }) {
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
      pagination
      highlightOnHover
      responsive={true}
      fixedHeaderScrollHeight="300px"
      direction="auto"
      subHeaderWrap
      customStyles={{
        headCells: { style: { fontWeight: 'bold', fontSize: '1rem', background: '#eff6ff', color: '#2563eb' } },
        rows: { style: { fontSize: '1rem' } },
      }}
    />
  );
}
