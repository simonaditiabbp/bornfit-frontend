import Link from 'next/link';
import { StyledDataTable } from '@/components/admin';

export default function ClassPurchaseDataTable({ data }) {
  const columns = [
    { name: 'No', cell: (row, i) => i + 1, width: '70px', center: true },
    { name: 'User', selector: row => row.user?.name || '-', sortable: true, cell: row => <span className="font-semibold">{row.user?.name || '-'}</span> },
    { name: 'Class', selector: row => row.class?.name || '-', sortable: true },
    { name: 'Price', selector: row => row.price, sortable: true },
    { name: 'Purchase Date', selector: row => row.purchase_date?.slice(0, 16).replace('T', ' ') || '-', sortable: true },
    { name: 'Actions', cell: row => (
      <Link href={`/admin/class/classpurchase/edit?id=${row.id}`} className="bg-gray-600 dark:bg-blue-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-700 dark:hover:bg-blue-700">Detail</Link>
    ), ignoreRowClick: true }
  ];

  return (
    <StyledDataTable
      columns={columns}
      data={data}
      pagination
    />
  );
}
