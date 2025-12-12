// DataTable untuk membership/session
'use client';
import Link from "next/link";
import { StyledDataTable } from '@/components/admin';
import { useTheme } from '@/contexts/ThemeContext';

export default function MembershipSessionDataTable({ data, pagination = false, paginationServer = false, paginationTotalRows = 0, paginationPerPage = 10, currentPage, paginationDefaultPage, onChangePage = () => {}, onChangeRowsPerPage = () => {}, paginationRowsPerPageOptions = [10, 25, 50] }) {

  const pageNo = paginationDefaultPage || currentPage || 1;
  const startNo = (pageNo - 1) * paginationPerPage;

  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    { 
      name: 'Member', 
      selector: row => row.user?.name || '-', 
      sortable: true,
      cell: row => <span className="font-semibold">{row.user?.name || '-'}</span>,
    },
    { name: 'Plan', selector: row => row.membershipPlan?.name || '-', sortable: true },
    { name: 'Start Date', selector: row => row.start_date?.slice(0,10) || '-', sortable: true },
    { name: 'End Date', selector: row => row.end_date?.slice(0,10) || '-', sortable: true },
    {
      name: 'Status',
      cell: row => {
        const status = row.status?.toLowerCase();

        const styleMap = {
          active:   "bg-green-100 text-green-700",
          expired:  "bg-red-100 text-red-700",
          pending:  "bg-yellow-100 text-yellow-700",
          frozen:  "bg-blue-100 text-blue-700",
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
        <div className="flex gap-2 justify-center">
          <Link href={`/admin/membership/session/edit?id=${row.id}`} 
          className="bg-gray-600 dark:bg-blue-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-700 dark:hover:bg-blue-700">
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
      paginationServer={paginationServer}
      paginationTotalRows={paginationTotalRows}
      paginationPerPage={paginationPerPage}
      paginationDefaultPage={pageNo}
      currentPage={currentPage}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      paginationRowsPerPageOptions={paginationRowsPerPageOptions}
    />
  );
}
