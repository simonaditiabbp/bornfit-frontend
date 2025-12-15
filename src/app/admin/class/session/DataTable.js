import { StyledDataTable } from "@/components/admin";
import Link from "next/link";
import DataTable from 'react-data-table-component';

export default function ClassSessionDataTable({ data, plans = [], members = [], instructors = [], pagination = false, paginationServer = false, paginationTotalRows = 0, paginationPerPage = 10, currentPage, paginationDefaultPage, onChangePage = () => {}, onChangeRowsPerPage = () => {}, paginationRowsPerPageOptions = [10, 25, 50]
}) {

  const pageNo = paginationDefaultPage || currentPage || 1;
  const startNo = (pageNo - 1) * paginationPerPage;

  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    { name: 'Plan', selector: row => {
      const plan = plans.find(p => p.id === row.event_plan_id);
      return plan ? (plan.name || `Plan #${plan.id}`) : row.event_plan_id;
    }, sortable: true },
    { name: 'Instructor', selector: row => {
      const ins = instructors.find(t => t.id === row.instructor_id);
      return ins ? ins.name : row.instructor_id;
    }, sortable: true },
    { 
      name: 'Schedule Type', 
      cell: row => {
        if (row.is_recurring) {
          let days = [];
          try {
            days = row.recurrence_days ? JSON.parse(row.recurrence_days) : [];
          } catch (e) {
            days = [];
          }
          return (
            <div className="flex flex-col gap-1">
              <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded font-semibold">
                🔁 RECURRING PATTERN
              </span>
              <span className="text-xs text-gray-400">
                {days.map(d => d.slice(0,3).toUpperCase()).join(', ')}
              </span>
              <span className="text-xs text-amber-400">
                (Template - Not in calendar)
              </span>
            </div>
          );
        }
        
        // Check if this is a child of recurring pattern
        if (row.parent_class_id) {
          return (
            <div className="flex flex-col gap-1">
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
                📅 Instance
              </span>
              <span className="text-xs text-gray-400">
                From recurring pattern
              </span>
            </div>
          );
        }
        
        return (
          <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
            Single
          </span>
        );
      },
      sortable: false,
      width: '150px',
    },
    // { name: 'Class Date', selector: row => row.class_date ? row.class_date.slice(0,10) : '', sortable: true },
    // { name: 'Class Date', selector: row => {
    //     if (row.class_date) {
    //       const classDate = new Date(row.class_date);
    //       classDate.setHours(classDate.getHours() + 7);
    //       return classDate.toISOString().slice(0, 10);
    //     }
    //   return ''}
    { name: 'Class Date', selector: row => row.start_time ? row.start_time.slice(0,10) : '', sortable: true },
    { name: 'Start Time', selector: row => {
      if (row.is_recurring) {
        return row.recurrence_start_time || '-';
      }
      return row.start_time ? row.start_time.slice(11,16) : '';
    }, sortable: true },
    { name: 'End Time', selector: row => {
      if (row.is_recurring) {
        return row.recurrence_end_time || '-';
      }
      return row.end_time ? row.end_time.slice(11,16) : '';
    }, sortable: true },
    { name: 'Type', selector: row => row.class_type, sortable: true },
  //   { name: 'Manual Checkin', selector: row => row.total_manual_checkin, sortable: true },
    { name: 'Notes', selector: row => row.notes, sortable: false },
    {
      name: 'Aksi',
      cell: row => (
        <div className="flex gap-2 justify-center">
          {/* <button
            className="bg-amber-400 text-gray-900 px-3 py-1 rounded font-semibold hover:bg-amber-500"
            onClick={() => setQrSession && setQrSession(row)}
          >
            Generate QR
          </button> */}
          <Link href={`/admin/class/session/edit?id=${row.id}`} className="bg-gray-600 dark:bg-blue-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-700 dark:hover:bg-blue-700">Detail</Link>
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
      paginationDefaultPage={pageNo}
      currentPage={currentPage}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      paginationRowsPerPageOptions={paginationRowsPerPageOptions}
    />
  );
}
