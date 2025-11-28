import DataTable from 'react-data-table-component';

export default function BookingDataTable({ columns, data, pagination, paginationServer, paginationTotalRows, paginationPerPage, currentPage, onChangePage, onChangeRowsPerPage, paginationRowsPerPageOptions }) {
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
      fixedHeaderScrollHeight="500px"
      direction="auto"
      subHeaderWrap
      customStyles={{
        headCells: { style: { fontWeight: 'bold', fontSize: '1rem', background: '#eff6ff', color: '#2563eb' } },
        rows: { style: { fontSize: '1rem' } },
      }}
    />
  );
}
