import Link from "next/link";
import { StyledDataTable } from '@/components/admin';
import { FaInfoCircle } from "react-icons/fa";

export default function PTBookingDataTable({ 
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
    // { name: 'ID', selector: row => row.id, sortable: true },
    { name: 'Plan', cell: row => row.pt_session_plan?.name || row.pt_session_plan_id, sortable: true },
    { name: 'Member', cell: row => row.user_member?.name || row.user_member_id, sortable: true },
    { name: 'Personal Trainer', cell: row => row.personal_trainer_session?.user_pt?.name || row.personal_trainer_session?.user_pt_id, sortable: true },
    // { name: 'PT Session', selector: row => `${row.pt_session_plan?.name} - ${row.personal_trainer_session.user_pt.name}` || '', sortable: true },
    // { name: 'Plan', selector: row => row.pt_session_plan?.name || row.pt_session_plan_id, sortable: true },
    // { name: 'Trainer', selector: row => row.personal_trainer_session?.user_pt_id || '-', sortable: true },
    { name: 'Booking Time', cell: row => row.booking_time?.slice(0,16).replace('T',' '), sortable: true },
    {
      name: 'Status',
      cell: row => {
        const status = row.status?.toLowerCase();

        const styleMap = {
          completed:   "bg-green-100 text-green-700",
          cancelled:  "bg-red-100 text-red-700",
          booked:  "bg-yellow-100 text-yellow-700",
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
      name: 'Actions',
      cell: row => (
        <Link 
          href={`/admin/pt/booking/edit?id=${row.id}`} 
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors shadow-sm text-xs font-medium">
            <FaInfoCircle className="w-3 h-3" />
            Details
        </Link>
      ),
      ignoreRowClick: true,
    },
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
