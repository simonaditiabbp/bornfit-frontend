import Link from "next/link";
import DataTable from 'react-data-table-component';

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

  const colors = {
    primary: '#1f2937',
    secondary: '#374151',
    accent: '#fbbf24',
    text: '#e5e7eb',
    border: '#4b5563',
  };

  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px' },
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
          className="bg-gray-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500"
        >
          Detail
        </Link>
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
      customStyles={{
        table: {
          style: {
            backgroundColor: colors.primary,
            color: colors.text,
          },
        },
        headRow: {
          style: {
            backgroundColor: colors.secondary,
            borderBottomWidth: '2px',
            borderBottomColor: colors.border,
            borderBottomStyle: 'solid',
          },
        },
        headCells: {
          style: {
            fontSize: '0.875rem',
            fontWeight: '700',
            color: colors.accent,
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
        rows: {
          style: {
            fontSize: '0.875rem',
            color: colors.text,
            backgroundColor: colors.primary,
            borderBottomWidth: '1px',
            borderBottomColor: colors.border,
            borderBottomStyle: 'solid',
            '&:hover': {
              backgroundColor: colors.secondary,
              cursor: 'pointer',
            },
          },
        },
        cells: {
          style: {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
        pagination: {
          style: {
            backgroundColor: colors.primary,
            borderTopWidth: '1px',
            borderTopColor: colors.border,
            borderTopStyle: 'solid',
            color: colors.text,
          },
          pageButtonsStyle: {
            color: colors.accent,
            fill: colors.accent,
            '&:disabled': {
              color: colors.border,
              fill: colors.border,
            },
            '&:hover:not(:disabled)': {
              backgroundColor: colors.secondary,
            },
          },
        },
      }}
    />
  );
}
