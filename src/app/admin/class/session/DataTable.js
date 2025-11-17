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
            className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700"
            onClick={() => setQrSession && setQrSession(row)}
          >
            Generate QR
          </button>
          <Link href={`/admin/class/session/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
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
        headCells: { style: { fontWeight: 'bold', fontSize: '1rem', background: '#eff6ff', color: '#2563eb' } },
        rows: { style: { fontSize: '1rem' } },
      }}
    />
  );
}
