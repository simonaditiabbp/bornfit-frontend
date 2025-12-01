import Link from "next/link";
import DataTable from 'react-data-table-component';

export default function PTSessionDataTable({
  data,
  plans = [],
  members = [],
  trainers = [],
  setQrSession,
  pagination = false,
  paginationServer = false,
  paginationTotalRows = 0,
  paginationPerPage = 10,
  currentPage = 1,
  onChangePage = () => {},
  onChangeRowsPerPage = () => {},
  paginationRowsPerPageOptions = [10, 25, 50],
}) {
  const colors = {
    bgPrimary: '#1f2937',
    bgSecondary: '#374151',
    textPrimary: '#f3f4f6',
    textSecondary: '#d1d5db',
    border: '#4b5563',
    hover: '#4b5563'
  };

  const tailwindStyles = {
    table: {
      style: {
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
      },
    },
    headRow: {
      style: {
        backgroundColor: colors.bgSecondary,
        borderBottomWidth: '1px',
        borderBottomColor: colors.border,
        borderBottomStyle: 'solid',
        minHeight: '56px',
      },
    },
    headCells: {
      style: {
        fontSize: '0.95rem',
        fontWeight: 'bold',
        color: colors.textPrimary,
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        fontSize: '1rem',
        color: colors.textSecondary,
        backgroundColor: colors.bgPrimary,
        minHeight: '48px',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: colors.border,
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: colors.hover,
        borderBottomColor: colors.border,
        outline: 'none',
      },
    },
    pagination: {
      style: {
        backgroundColor: colors.bgSecondary,
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: colors.border,
        color: colors.textPrimary,
        minHeight: '56px',
      },
      pageButtonsStyle: {
        borderRadius: '4px',
        height: '32px',
        width: '32px',
        padding: '4px',
        margin: '0 4px',
        cursor: 'pointer',
        transition: '0.2s',
        color: colors.textPrimary,
        fill: colors.textPrimary,
        backgroundColor: 'transparent',
        '&:disabled': {
          cursor: 'unset',
          color: colors.border,
          fill: colors.border,
        },
        '&:hover:not(:disabled)': {
          backgroundColor: colors.hover,
        },
      },
    },
  };

  const startNo = (currentPage - 1) * paginationPerPage;
  const columns = [
  { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px',  },
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
    { name: 'Join Date', selector: row => row.join_date?.slice(0,10), sortable: true },
    {
      name: 'Remaining Session',
      selector: row => {
        const plan = plans.find(p => p.id === row.pt_session_plan_id);
        const max = plan ? plan.max_session : '...';
        console.log("row.remaining_session:", row.remaining_session);
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
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700"
            onClick={() => setQrSession && setQrSession(row)}
          >
            Generate QR
          </button>
          <Link href={`/admin/pt/session/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data.map(item => ({ ...item }))}
      pagination={pagination}
      paginationServer={paginationServer}
      paginationTotalRows={paginationTotalRows}
      paginationPerPage={paginationPerPage}
      paginationDefaultPage={currentPage}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      paginationRowsPerPageOptions={paginationRowsPerPageOptions}
      highlightOnHover
      responsive={true}
      noHeader
      fixedHeaderScrollHeight="300px"
      direction="auto"
      subHeaderWrap
      customStyles={tailwindStyles}
    />
  );
}
