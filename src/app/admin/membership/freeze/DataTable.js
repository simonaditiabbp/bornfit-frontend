import Link from "next/link";
import { StyledDataTable } from '@/components/admin';

export default function FreezeDataTable({
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
      name: 'Member', 
      selector: row => row.membership?.user?.name || '-', 
      sortable: true 
    },
    { 
      name: 'Membership Plan', 
      selector: row => row.membership?.membershipPlan?.name || '-', 
      sortable: true 
    },
    { 
      name: 'Freeze At', 
      selector: row => row.freeze_at ? new Date(row.freeze_at).toLocaleDateString('id-ID') : '-', 
      sortable: true 
    },
    { 
      name: 'Unfreeze At', 
      selector: row => row.unfreeze_at ? new Date(row.unfreeze_at).toLocaleDateString('id-ID') : '-', 
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
      name: 'Status',
      cell: row => {
        const status = row.status || 'active';
        const statusColors = {
          active: 'bg-blue-100 text-blue-700',
          completed: 'bg-green-100 text-green-700',
          cancelled: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || statusColors.active}`}>
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
          href={`/admin/membership/freeze/edit?id=${row.id}`} 
          className="bg-gray-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500"
        >
          Detail
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
