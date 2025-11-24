// DataTable untuk membership/plans
'use client';
import Link from "next/link";
import DataTable from 'react-data-table-component';

export default function MembershipPlansDataTable({ data }) {
  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px' },
    { name: 'Name', selector: row => row.name, sortable: true },
    { name: 'Duration', selector: row => `${row.duration_value} ${row.duration_unit}`, sortable: true },
    { name: 'Price', selector: row => row.price?.toLocaleString('id-ID'), sortable: true },
    { name: 'Description', selector: row => row.description, sortable: true },
    {
      name: 'Aksi',
      cell: row => (
        <div className="flex gap-2 justify-center">
          <Link href={`/admin/membership/plans/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
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
      striped
      responsive
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
