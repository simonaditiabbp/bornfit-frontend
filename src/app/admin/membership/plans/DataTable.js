// DataTable untuk membership/plans
'use client';
import Link from "next/link";
import { StyledDataTable } from '@/components/admin';
import { useTheme } from '@/contexts/ThemeContext';

export default function MembershipPlansDataTable({ data }) {
  const { theme } = useTheme();
  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px', center: "true" },
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
      cell: row => (
        <div className="flex gap-2 justify-center">
          <Link href={`/admin/membership/plans/edit?id=${row.id}`} className="bg-gray-600 dark:bg-blue-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-700 dark:hover:bg-blue-700">
            Detail
          </Link>
        </div>
      ),
      ignoreRowClick: true,
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
