"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassAttendanceDataTable from './DataTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassAttendancePage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const fetchWith401 = async (url) => {
      const res = await fetch(url, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (res.status === 401) {
        setAttendances([]);
        localStorage.removeItem('token');
        window.location.replace('/login');
      }
      return res.json();
    };

    const fetchAll = async () => {
      setLoading(true);
      try {
        if (search && search.trim() !== '') {
          let allMatches = null;
          try {
            const resSearch = await fetch(`${API_URL}/api/classattendances?search=${encodeURIComponent(search)}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            const dataAttendances = await resSearch.json();
            if (Array.isArray(dataAttendances.data.attendances)) allMatches = dataAttendances.data.attendances;
          } catch (e) {}

          if (!allMatches) {
            const resAll = await fetch(`${API_URL}/api/classattendances`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            const dataAttendances = await resAll.json();
            if (Array.isArray(dataAttendances.data.attendances)) {
              allMatches = dataAttendances.data.attendances.filter(b =>
                (b.user_member?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (b.class_plan?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (b.status || '').toLowerCase().includes(search.toLowerCase())
              );
            } else allMatches = [];
          }

          const start = (page - 1) * limit;
          const pageSlice = allMatches.slice(start, start + limit);
          setAttendances(pageSlice);
          setTotal(allMatches.length);
        } else {
          const res = await fetch(`${API_URL}/api/classattendances?page=${page}&limit=${limit}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
          const dataAttendances = await res.json();
          setAttendances(dataAttendances.data.attendances || []);
          setTotal(dataAttendances.data.total || 0);
        }
      } catch (err) {
        setAttendances([]);
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchAll();
  }, [page, limit, search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  if (backendError) return <div className="text-red-600">Backend error</div>;

  const startNo = (page - 1) * limit;
  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    { name: 'Member', selector: row => row.member?.name || '', sortable: true },
    { name: 'Class', selector: row => `${row.class.event_plan.name} - ${row.class.instructor.name}` || '', sortable: true },
    { name: 'Checked-in Time', selector: row => row.checked_in_at ? new Date(new Date(row.checked_in_at).getTime() - 7 * 60 * 60 * 1000).toLocaleString('en-GB', { hour12: false }) : '', sortable: true },
    {
      name: 'Actions',
      cell: row => (
        <Link href={`/admin/class/attendance/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
      )
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-700">Class Attendance</h1>
        <Link href="/admin/class/attendance/insert" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700">+ Add Attendance</Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <input type="text" placeholder="Search member/class/plan/status..." className="w-full max-w-xs p-2 border border-blue-300 rounded focus:outline-blue-500 text-base" value={searchInput} onChange={e => { setSearchInput(e.target.value); }} />
      </div>
      {loading ? (
        <div className="text-center text-blue-500">Loading...</div>
      ) : (
        <ClassAttendanceDataTable
          columns={columns}
          data={attendances}
          pagination
          paginationServer
          paginationTotalRows={total}
          paginationPerPage={limit}
          currentPage={page}
          onChangePage={setPage}
          onChangeRowsPerPage={newLimit => { setLimit(newLimit); setPage(1); }}
          paginationRowsPerPageOptions={[10,25,50]}
        />
      )}
    </div>
  );
}
