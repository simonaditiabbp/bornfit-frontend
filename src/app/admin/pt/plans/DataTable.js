import Link from 'next/link';
import { StyledDataTable } from '@/components/admin';

export default function PTPlansDataTable({ data }) {
  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px', center: true },
    { name: 'Name', selector: row => row.name, sortable: true, cell: row => <span className="font-semibold">{row.name}</span> },
    { name: 'Duration', selector: row => row.duration_value, sortable: true, cell: row => `${row.duration_value} hari` },
    { name: 'Max Session', selector: row => row.max_session, sortable: true },
    { name: 'Price', selector: row => row.price, sortable: true, cell: row => `Rp.${row.price.toLocaleString()}` },
    { name: 'Minutes/Session', selector: row => row.minutes_per_session, sortable: true, cell: row => `${row.minutes_per_session} menit` },
    { name: 'Description', selector: row => row.description, sortable: false },
    {
      name: 'Actions',
      cell: row => (
          <Link href={`/admin/pt/plans/edit?id=${row.id}`} className="bg-gray-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
        // ...existing code...
      ),
    },
  ];

  return (
    <StyledDataTable
      columns={columns}
      data={data}
      pagination
    />
  );
}

