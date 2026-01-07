import { StyledDataTable } from '@/components/admin';
import Link from 'next/link';
import DataTable from 'react-data-table-component';

export default function ClassPlansDataTable({ 
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
    { name: 'Name', selector: row => row.name, sortable: true, cell: row => <span className="font-semibold">{row.name}</span> },
    { name: 'Max Visitors', selector: row => row.max_visitor, sortable: true, cell: row => `${row.max_visitor} people` },
    { name: 'Minutes/Session', selector: row => row.minutes_per_session, sortable: true, cell: row => `${row.minutes_per_session} minutes` },
    { name: 'Description', selector: row => row.description, sortable: false },
    { name: 'Status',
      cell: row => {
        const status = row.is_active ? 'active' : 'inactive';
        const styleMap = { active: 'bg-green-100 text-green-700', inactive: 'bg-red-100 text-red-700' };
        const label = status.charAt(0).toUpperCase() + status.slice(1);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${ styleMap[status] }`}>
            {label}
          </span>
        );
      },
      sortable: false
    },
    {
      name: 'Actions',
      cell: row => (
         <Link href={`/admin/class/plans/edit?id=${row.id}`} className="bg-gray-600 dark:bg-blue-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-700 dark:hover:bg-blue-700">Detail</Link>
      ),
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
