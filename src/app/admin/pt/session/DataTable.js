import Link from 'next/link';
import { StyledDataTable } from '@/components/admin';

export default function PTSessionDataTable({ 
  data, 
  plans, 
  members, 
  trainers,
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
    // { name: 'Name', selector: row => row.name, sortable: true },
    { name: 'Plan', selector: row => {
      const plan = plans.find(p => p.id === row.pt_session_plan_id);
      return plan ? (plan.name || `Plan #${plan.id}`) : row.pt_session_plan_id;
    }, sortable: true },
    { name: 'Member', selector: row => {
      const member = members.find(m => m.id === row.user_member_id);
      return member ? member.name : row.user_member_id;
    }, sortable: true },
    { name: 'Personal Trainer', selector: row => {
      const pt = trainers.find(t => t.id === row.user_pt_id);
      return pt ? pt.name : row.user_pt_id;
    }, sortable: true },
    { name: 'Start Date', selector: row => row.start_date?.slice(0,10), sortable: true },
    {
      name: 'Remaining Session',
      selector: row => {
        const plan = plans.find(p => p.id === row.pt_session_plan_id);
        const max = plan ? plan.max_session : '...';
        const sisa = typeof row.remaining_session === 'number' ? row.remaining_session : '...';
        return `${sisa} of ${max} sessions remaining`;
      },
      sortable: true
    },
    {
      name: 'Status',
      cell: row => {
        const status = row.status?.toLowerCase();

        const styleMap = {
          active:   "bg-green-100 text-green-700",
          expired:  "bg-red-100 text-red-700",
          pending:  "bg-yellow-100 text-yellow-700",
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
        <div className="flex gap-2 justify-center">
          {/* <button
            className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700"
            onClick={() => setQrSession && setQrSession(row)}
          >
            Generate QR
          </button> */}
          <Link href={`/admin/pt/session/edit?id=${row.id}`} className="bg-gray-600 dark:bg-blue-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-700 dark:hover:bg-blue-700">Detail</Link>
        </div>
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

