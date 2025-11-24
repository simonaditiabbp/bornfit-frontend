// DataTable untuk membership/session
'use client';
import DataTable from 'react-data-table-component';
import Link from "next/link";

export default function MembershipSessionDataTable({ data }) {
  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px' },
    { name: 'Member', selector: row => row.user?.name || '-', sortable: true },
    { name: 'Plan', selector: row => row.membershipPlan?.name || '-', sortable: true },
    { name: 'Start Date', selector: row => row.start_date?.slice(0,10) || '-', sortable: true },
    { name: 'End Date', selector: row => row.end_date?.slice(0,10) || '-', sortable: true },
    { name: 'Status', selector: row => row.is_active ? 'Active' : 'Inactive', sortable: true },
    {
      name: 'Aksi',
      cell: row => (
        <div className="flex gap-2 justify-center">
          <Link href={`/admin/membership/session/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
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
