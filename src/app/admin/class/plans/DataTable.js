import { StyledDataTable } from '@/components/admin';
import Link from 'next/link';
import DataTable from 'react-data-table-component';

export default function ClassPlansDataTable({ data }) {

  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px', center: true },
    { name: 'Name', selector: row => row.name, sortable: true, cell: row => <span className="font-semibold">{row.name}</span> },
    { name: 'Max Visitors', selector: row => row.max_visitor, sortable: true, cell: row => `${row.max_visitor} people` },
    { name: 'Minutes/Session', selector: row => row.minutes_per_session, sortable: true, cell: row => `${row.minutes_per_session} minutes` },
    { name: 'Description', selector: row => row.description, sortable: false },
    { name: 'Status', selector: row => row.is_active ? 'Active' : 'Inactive', sortable: false },
    {
      name: 'Actions',
      cell: row => (
         <Link href={`/admin/class/plans/edit?id=${row.id}`} className="bg-gray-600 dark:bg-blue-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-700 dark:hover:bg-blue-700">Detail</Link>
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
