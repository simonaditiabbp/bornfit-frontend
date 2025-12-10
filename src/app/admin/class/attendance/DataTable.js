import Link from 'next/link';
import { StyledDataTable } from '@/components/admin';

export default function ClassAttendanceDataTable({ data }) {
  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px', center: true },
    { name: 'Member', selector: row => row.member?.name || '', sortable: true },
    { name: 'Class', selector: row => `${row.class.event_plan.name} - ${row.class.instructor.name}` || '', sortable: true },
    { name: 'Checked-in Time', selector: row => row.checked_in_at ? new Date(new Date(row.checked_in_at).getTime() - 7 * 60 * 60 * 1000).toLocaleString('en-GB', { hour12: false }) : '', sortable: true },
    {
      name: 'Aksi',
      cell: row => (
        <Link href={`/admin/class/attendance/edit?id=${row.id}`} className="bg-gray-600 dark:bg-blue-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-700 dark:hover:bg-blue-700">Detail</Link>
      )
    }
  ];

  return (
    <StyledDataTable
      columns={columns}
      data={data}
      pagination
    />
  );
}
