import Link from 'next/link';
import { StyledDataTable } from '@/components/admin';

export default function ClassAttendanceDataTable({ 
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
    { name: 'Member', cell: row => row.member?.name || '', sortable: true },
    { name: 'Class', cell: row => {
      const instructorOrTrainer = row.class.instructor 
        ? `${row.class.instructor.name} (Instructor)` 
        : row.class.trainer 
        ? `${row.class.trainer.name} (Trainer)` 
        : '';
      return `${row.class.event_plan.name}${instructorOrTrainer ? ' - ' + instructorOrTrainer : ''}`;
    }, sortable: true },
    { name: 'Checked-in Time', cell: row => row.checked_in_at ? new Date(new Date(row.checked_in_at).getTime() - 7 * 60 * 60 * 1000).toLocaleString('en-GB', { hour12: false }) : '', sortable: true },
    {
      name: 'Status',
      cell: row => {
        const status = row.status?.toLowerCase();

        const styleMap = {
          booked:   "bg-blue-100 text-blue-700",
          cancelled:  "bg-red-100 text-red-700",
          checked_in:  "bg-green-100 text-green-700",
        };

        const label = status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "";

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold ${
              styleMap[status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {label}
          </span>
        );
      },
      sortable: true
    },
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
