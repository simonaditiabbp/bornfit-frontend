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
      name: 'Aksi',
      cell: row => (
        <Link href={`/admin/pt/booking/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Edit</Link>
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
      customStyles={{
        headCells: { style: { fontWeight: 'bold', fontSize: '1rem', background: '#eff6ff', color: '#2563eb' } },
        rows: { style: { fontSize: '1rem' } },
      }}
    />
  );
}
