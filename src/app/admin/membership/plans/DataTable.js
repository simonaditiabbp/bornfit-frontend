// DataTable untuk membership/plans
'use client';
import Link from "next/link";
import { StyledDataTable } from '@/components/admin';
import { useTheme } from '@/contexts/ThemeContext';
import { FaInfoCircle } from "react-icons/fa";

export default function MembershipPlansDataTable({ 
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
  const { theme } = useTheme();
  const startNo = (currentPage - 1) * paginationPerPage;
  
  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    { 
      name: 'Name', 
      selector: row => row.name, 
      sortable: true,
      cell: row => <span className="font-semibold">{row.name}</span>,
    },
    { name: 'Duration', selector: row => `${row.duration_value} ${row.duration_unit}`, sortable: true },
    { name: 'Price', cell: row => row.price?.toLocaleString('id-ID'), sortable: true },
    { name: 'Description', selector: row => row.description, sortable: true },
    {
      name: 'Actions',
      cell: row => (
        <Link 
          href={`/admin/membership/plans/edit?id=${row.id}`} 
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
