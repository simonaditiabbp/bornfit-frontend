// DataTable untuk membership/schedules
'use client';
import Link from "next/link";
import DataTable from 'react-data-table-component';

export default function MembershipSchedulesDataTable({ data }) {
  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px' },
    { name: 'Plan', selector: row => row.membershipPlan?.name || '-', sortable: true },
    { name: 'Hari', selector: row => row.day_of_week || '-', sortable: true },
    { name: 'Jam Mulai', selector: row => row.start_time || '-', sortable: true },
    { name: 'Jam Selesai', selector: row => row.end_time || '-', sortable: true },
    { name: 'Tanggal Dibuat', selector: row => row.created_at ? row.created_at.slice(0,10) : '-', sortable: true },
    {
      name: 'Aksi',
      cell: row => (
        <div className="flex gap-2 justify-center">
          <Link href={`/admin/membership/schedules/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
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
