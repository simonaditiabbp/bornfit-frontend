import Link from "next/link";
import { StyledDataTable } from '@/components/admin';
import { FaInfoCircle } from "react-icons/fa";

export default function TransferDataTable({
  data,
  pagination = false,
  paginationServer = false,
  paginationTotalRows = 0,
  paginationPerPage = 10,
  currentPage = 1,
  onChangePage = () => {},
  onChangeRowsPerPage = () => {},
  paginationRowsPerPageOptions = [10, 25, 50],
}) {
  const startNo = (currentPage - 1) * paginationPerPage;

  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    { 
      name: 'From Member', 
      selector: row => row.fromUser?.name || '-', 
      sortable: true 
    },
    { 
      name: 'To Member', 
      selector: row => row.toUser?.name || '-', 
      sortable: true 
    },
    { 
      name: 'Membership Plan', 
      selector: row => row.fromMembership?.membershipPlan?.name || '-', 
      sortable: true 
    },
    { 
      name: 'Fee', 
      selector: row => new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(row.fee || 0),
      sortable: true 
    },
    { 
      name: 'Transfer Date', 
      selector: row => row.transfer_date ? new Date(row.transfer_date).toLocaleDateString('id-ID') : '-', 
      sortable: true 
    },
    {
      name: 'Status',
      cell: row => {
        const status = row.status || 'pending';
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-700',
          completed: 'bg-green-100 text-green-700',
          cancelled: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || statusColors.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: 'Aksi',
      cell: row => (
        <Link 
          href={`/admin/membership/transfer/edit?id=${row.id}`} 
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors shadow-sm text-xs font-medium"
        >
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
