"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassAttendanceDataTable from './DataTable';
import { FaPlus, FaCalendar, FaAngleRight } from 'react-icons/fa';

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

  if (backendError) return <div className="text-red-400">Backend error</div>;

  const startNo = (page - 1) * limit;
  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    { name: 'Member', selector: row => row.member?.name || '', sortable: true },
    { name: 'Class', selector: row => `${row.class.event_plan.name} - ${row.class.instructor.name}` || '', sortable: true },
    { name: 'Checked-in Time', selector: row => row.checked_in_at ? new Date(new Date(row.checked_in_at).getTime() - 7 * 60 * 60 * 1000).toLocaleString('en-GB', { hour12: false }) : '', sortable: true },
    {
      name: 'Aksi',
      cell: row => (
        <Link href={`/admin/class/attendance/edit?id=${row.id}`} className="bg-gray-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
      )
    }
  ];

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaCalendar className="text-amber-300" />
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-amber-300 transition-colors">
          Dashboard
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Class Attendance</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          placeholder="Search member/class/plan/status..."
          className="w-full max-w-md p-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 text-base bg-gray-700 text-gray-200 placeholder-gray-400"
          value={searchInput}
          onChange={e => { setSearchInput(e.target.value); }}
        />
        <Link
          href="/admin/class/attendance/insert"
          className="bg-amber-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors flex items-center gap-2"
        >
          <FaPlus />
          Add Attendance
        </Link>
      </div>
      {loading ? (
        <div className="text-center text-amber-300">Loading...</div>
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
