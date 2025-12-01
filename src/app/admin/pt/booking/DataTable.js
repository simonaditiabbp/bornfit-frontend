import Link from "next/link";
import DataTable from 'react-data-table-component';

export default function PTBookingDataTable({
  data = [],
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

  // Calculate global row number
  const startNo = (currentPage - 1) * paginationPerPage;
  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px' },
    // { name: 'ID', selector: row => row.id, sortable: true },
    { name: 'Member', selector: row => row.user_member?.name || row.user_member_id, sortable: true },
    { name: 'PT Session', selector: row => `${row.pt_session_plan?.name} - ${row.personal_trainer_session.user_pt.name}` || '', sortable: true },
    // { name: 'Plan', selector: row => row.pt_session_plan?.name || row.pt_session_plan_id, sortable: true },
    // { name: 'Trainer', selector: row => row.personal_trainer_session?.user_pt_id || '-', sortable: true },
    { name: 'Booking Time', selector: row => row.booking_time?.slice(0,16).replace('T',' '), sortable: true },
    { name: 'Status', selector: row => row.status, sortable: true },
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
      name: 'Aksi',
      cell: row => (
        <Link href={`/admin/pt/booking/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <DataTable
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
