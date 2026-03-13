import Link from 'next/link';
import { StyledDataTable } from '@/components/admin';
import { FaInfoCircle } from 'react-icons/fa';

export default function ClassPurchaseDataTable({ 
  data,
  pagination = false,
  paginationServer = false,
  paginationTotalRows = 0,
  paginationPerPage = 10,
  currentPage = 1,
  onChangePage = () => {},
  onChangeRowsPerPage = () => {},
  paginationRowsPerPageOptions = [10, 25, 50]
}) {
  const startNo = (currentPage - 1) * paginationPerPage;

  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    { name: 'User', selector: row => row.user?.name || '-', sortable: true, cell: row => <span className="font-semibold">{row.user?.name || '-'}</span> },
    { name: 'Class', cell: row => {
      const instructorOrTrainer = row.class?.instructor?.name 
        ? `${row.class.instructor.name} (Instructor)` 
        : row.class?.trainer?.name 
        ? `${row.class.trainer.name} (Trainer)` 
        : '';
      const className = row.class?.event_plan?.name || row.class?.name || '-';
      return instructorOrTrainer ? `${className} - ${instructorOrTrainer}` : className;
    }, sortable: true },
    { name: 'Price', cell: row => row.price, sortable: true },
    { name: 'Purchase Date',
      cell: row => {
        if (!row.purchase_date) return '-';
        const d = new Date(row.purchase_date);
        d.setHours(d.getHours() + 7);
        return d.toISOString().slice(0, 16).replace('T', ' ');
      },
      sortable: true
    },
    { name: 'Actions', cell: row => (
      <Link 
        href={`/admin/class/classpurchase/edit?id=${row.id}`} 
        className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors shadow-sm text-xs font-medium">
          <FaInfoCircle className="w-3 h-3" />
          Details
      </Link>
    ), ignoreRowClick: true }
  ];

  return (
    <StyledDataTable
      columns={columns}
      data={data}
      pagination={pagination}
      paginationServer={paginationServer}
      paginationTotalRows={paginationTotalRows}
      paginationPerPage={paginationPerPage}
      paginationDefaultPage={currentPage}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      paginationRowsPerPageOptions={paginationRowsPerPageOptions}
    />
  );
}
