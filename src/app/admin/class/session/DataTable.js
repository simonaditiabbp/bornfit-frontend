import Link from "next/link";
import DataTable from 'react-data-table-component';

export default function ClassSessionDataTable({
  data,
  plans = [],
  members = [],
  instructors = [],
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
  const startNo = (currentPage - 1) * paginationPerPage;

  const colors = {
    primary: '#1f2937',
    secondary: '#374151',
    accent: '#fbbf24',
    text: '#e5e7eb',
    border: '#4b5563',
  };

  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px',  },
      { name: 'Plan', selector: row => {
        const plan = plans.find(p => p.id === row.event_plan_id);
        return plan ? (plan.name || `Plan #${plan.id}`) : row.event_plan_id;
      }, sortable: true },
      { name: 'Instructor', selector: row => {
        const ins = instructors.find(t => t.id === row.instructor_id);
        return ins ? ins.name : row.instructor_id;
      }, sortable: true },
      { name: 'Class Date', selector: row => row.class_date ? row.class_date.slice(0,10) : '', sortable: true },
      { name: 'Start Time', selector: row => row.start_time ? row.start_time.slice(11,16) : '', sortable: true },
      { name: 'End Time', selector: row => row.end_time ? row.end_time.slice(11,16) : '', sortable: true },
      { name: 'Type', selector: row => row.class_type, sortable: true },
    //   { name: 'Manual Checkin', selector: row => row.total_manual_checkin, sortable: true },
      { name: 'Notes', selector: row => row.notes, sortable: false },
    {
      name: 'Aksi',
      cell: row => (
        <div className="flex gap-2 justify-center">
          <button
            className="bg-amber-400 text-gray-900 px-3 py-1 rounded font-semibold hover:bg-amber-500"
            onClick={() => setQrSession && setQrSession(row)}
          >
            Generate QR
          </button>
          <Link href={`/admin/class/session/edit?id=${row.id}`} className="bg-gray-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
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
